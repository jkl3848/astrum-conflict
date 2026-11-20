import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  allCharacters,
  allUpgrades,
  contentVersion,
  deriveUnitStats,
  gameConstants,
  getCharacter,
  reachableSquares,
  resolveAttackDice,
  rollD6,
  type Faction,
  type TeamList,
  type UnitState,
} from '@astrum/game'
import { ensureSignedIn, firebaseConfigured, getFirebaseFunctions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { buildingCells, cellKey, clampCell, MAP_SIZE, startingSquares } from '../board/layout'

export type GameStatus = 'lobby' | 'setup' | 'playing' | 'finished'

export interface Seat {
  uid: string | null
  name: string
  faction: Faction | null
  ready: boolean
}

export interface LocalGame {
  id: string
  code: string
  contentVersion: string
  status: GameStatus
  players: { A: Seat; B: Seat }
  lists: { A: TeamList | null; B: TeamList | null }
  round: number
  phase: 'action' | 'recovery'
  activeSeat: 'A' | 'B'
  scenarioId: string | null
  scores: { A: number; B: number }
  units: UnitState[]
  log: { id: string; text: string; at: number }[]
  lastRoll: { faces: number[]; hits: number; damage: number; crits: number[] } | null
}

function code6() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

function makeUnit(
  seat: 'A' | 'B',
  characterId: string,
  x: number,
  y: number,
  upgradeIds: string[] = [],
): UnitState {
  const c = allCharacters.find((ch) => ch.id === characterId)!
  const upgrades = upgradeIds
    .map((id) => allUpgrades.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
  const stats = deriveUnitStats(c, upgrades)
  return {
    id: `${seat}-${characterId}-${Math.random().toString(36).slice(2, 7)}`,
    seat,
    characterId,
    upgradeIds: [...upgradeIds],
    pos: { x: clampCell(x), y: clampCell(y), elev: 0 },
    hp: stats.hp,
    maxHp: stats.hp,
    energy: stats.energy,
    maxEnergy: stats.energy,
    defense: stats.defense,
    statuses: {},
    activated: false,
    exhausted: [],
    downed: false,
    freeMoveRemaining: gameConstants.freeMovement,
  }
}

function emptyBlockers() {
  const walls = buildingCells()
  return {
    blocked: new Set<string>(),
    enemy: new Set<string>(),
    ally: new Set<string>(),
    terrain: new Set<string>(),
    buildingWall: walls,
    entrance: new Set<string>(),
    elevation: new Map<string, number>(),
  }
}

export const useGameStore = defineStore('game', () => {
  const game = ref<LocalGame | null>(null)
  const selectedUnitId = ref<string | null>(null)
  const mode = ref<'offline' | 'online'>('offline')
  const mySeat = ref<'A' | 'B' | null>('A')

  const selectedUnit = computed(() =>
    game.value?.units.find((u) => u.id === selectedUnitId.value) ?? null,
  )

  const reachable = computed(() => {
    const g = game.value
    const u = selectedUnit.value
    if (!g || !u || u.downed || u.seat !== g.activeSeat) return new Map<string, number>()
    const blockers = emptyBlockers()
    for (const other of g.units) {
      if (other.downed) continue
      const k = cellKey(other.pos.x, other.pos.y)
      if (other.seat === u.seat) blockers.ally.add(k)
      else blockers.enemy.add(k)
    }
    const character = getCharacter(u.characterId)
    const hasFlight = Boolean(character?.keywords.some((k) => k.toLowerCase() === 'flight'))
    const budget = u.freeMoveRemaining + u.energy
    return reachableSquares({
      from: u.pos,
      budget,
      mapSize: MAP_SIZE,
      hasFlight,
      blockers,
      constants: gameConstants,
    })
  })

  const reachableKeys = computed(() => {
    const keys = new Set<string>()
    for (const [k, cost] of reachable.value) {
      if (cost > 0) keys.add(k)
    }
    return keys
  })

  function createLocal(name = 'Host') {
    const code = code6()
    game.value = {
      id: `local-${code}`,
      code,
      contentVersion: contentVersion.version,
      status: 'lobby',
      players: {
        A: { uid: 'local-a', name, faction: null, ready: false },
        B: { uid: null, name: '', faction: null, ready: false },
      },
      lists: { A: null, B: null },
      round: 1,
      phase: 'action',
      activeSeat: 'A',
      scenarioId: 'control-point',
      scores: { A: 0, B: 0 },
      units: [],
      log: [{ id: '1', text: `Room ${code} created`, at: Date.now() }],
      lastRoll: null,
    }
    mode.value = 'offline'
    mySeat.value = 'A'
    return code
  }

  function joinLocal(code: string, name: string) {
    if (!game.value || game.value.code !== code.toUpperCase()) {
      // create a stub joinable lobby for demo
      createLocal('Host')
      game.value!.code = code.toUpperCase()
    }
    game.value!.players.B = {
      uid: 'local-b',
      name,
      faction: game.value!.players.A.faction === 'heroes' ? 'villains' : game.value!.players.A.faction === 'villains' ? 'heroes' : null,
      ready: false,
    }
    mySeat.value = 'B'
    pushLog(`${name} joined as Player B`)
  }

  function setReady(seat: 'A' | 'B', ready: boolean) {
    if (!game.value) return
    game.value.players[seat].ready = ready
  }

  function setFaction(seat: 'A' | 'B', faction: Faction) {
    if (!game.value) return
    game.value.players[seat].faction = faction
    const other = seat === 'A' ? 'B' : 'A'
    game.value.players[other].faction = faction === 'heroes' ? 'villains' : 'heroes'
    if (game.value.lists[seat]?.faction !== faction) game.value.lists[seat] = null
    if (game.value.lists[other]?.faction === faction) game.value.lists[other] = null
    game.value.players[seat].ready = false
    game.value.players[other].ready = false
  }

  function assignTeam(seat: 'A' | 'B', list: TeamList) {
    if (!game.value) return
    if (!game.value.players[seat].faction) {
      setFaction(seat, list.faction)
    }
    if (game.value.players[seat].faction && list.faction !== game.value.players[seat].faction) {
      pushLog(`${list.name} is a ${list.faction} list — seat ${seat} is ${game.value.players[seat].faction}.`)
      return
    }
    game.value.lists[seat] = {
      ...list,
      units: list.units.map((u) => ({ characterId: u.characterId, upgradeIds: [...u.upgradeIds] })),
      epicIds: [...list.epicIds],
    }
    game.value.players[seat].faction = list.faction
    game.value.players[seat].ready = list.units.length > 0
    if (!game.value.players.B.uid) {
      game.value.players.B = {
        uid: 'local-b',
        name: game.value.players.B.name || 'Player B',
        faction: list.faction === 'heroes' ? 'villains' : 'heroes',
        ready: Boolean(game.value.lists.B),
      }
    }
    pushLog(`${seat} selected ${list.name}`)
  }

  function clearTeam(seat: 'A' | 'B') {
    if (!game.value) return
    game.value.lists[seat] = null
    game.value.players[seat].ready = false
  }

  function placeList(seat: 'A' | 'B', list: TeamList): UnitState[] {
    const squares = startingSquares(seat)
    return list.units.map((u, i) => {
      const spot = squares[i % squares.length]
      const extra = Math.floor(i / squares.length)
      return makeUnit(seat, u.characterId, spot.x + extra, spot.y, u.upgradeIds)
    })
  }

  function canStart() {
    const g = game.value
    return Boolean(g?.lists.A?.units.length && g.lists.B?.units.length)
  }

  function startMatch() {
    if (!game.value || !canStart()) return
    const a = game.value.lists.A!
    const b = game.value.lists.B!
    const units = [...placeList('A', a), ...placeList('B', b)]
    game.value.units = units
    game.value.status = 'playing'
    game.value.players.A.ready = true
    game.value.players.B.ready = true
    if (!game.value.players.B.uid) {
      game.value.players.B.uid = 'local-b'
      game.value.players.B.name = game.value.players.B.name || 'Player B'
    }
    selectedUnitId.value = units.find((u) => u.seat === 'A')?.id ?? units[0]?.id ?? null
    pushLog(`${a.name} vs ${b.name} — deploy in 3×3 starting zones.`)
  }

  function quickStart() {
    if (!game.value) return
    const heroes = allCharacters.filter((c) => c.faction === 'heroes' && c.draftable !== false).slice(0, 3)
    const villains = allCharacters.filter((c) => c.faction === 'villains' && c.draftable !== false).slice(0, 3)
    assignTeam('A', {
      name: 'Sample Heroes',
      faction: 'heroes',
      units: heroes.map((c) => ({ characterId: c.id, upgradeIds: [] })),
      epicIds: [],
    })
    assignTeam('B', {
      name: 'Sample Villains',
      faction: 'villains',
      units: villains.map((c) => ({ characterId: c.id, upgradeIds: [] })),
      epicIds: [],
    })
    startMatch()
    pushLog('Practice lists deployed.')
  }

  function selectUnit(id: string) {
    selectedUnitId.value = id
  }

  function moveSelectedTo(x: number, y: number) {
    const g = game.value
    const u = selectedUnit.value
    if (!g || !u || u.downed) return
    if (u.seat !== g.activeSeat) return
    const sx = clampCell(x)
    const sy = clampCell(y)
    const key = cellKey(sx, sy)
    const cost = reachable.value.get(key)
    if (cost === undefined || cost <= 0) return
    const occupant = g.units.find((o) => o.id !== u.id && o.pos.x === sx && o.pos.y === sy && !o.downed)
    if (occupant) {
      selectUnit(occupant.id)
      return
    }
    let remaining = cost
    if (u.freeMoveRemaining > 0) {
      const free = Math.min(u.freeMoveRemaining, remaining)
      u.freeMoveRemaining -= free
      remaining -= free
    }
    if (remaining > 0) {
      if (u.energy < remaining) return
      u.energy -= remaining
    }
    u.pos = { x: sx, y: sy, elev: 0 }
    const name = getCharacter(u.characterId)?.name ?? u.characterId
    pushLog(`${name} moved to ${sx},${sy}`)
  }

  function adjustStat(unitId: string, stat: 'hp' | 'energy', delta: number) {
    const u = game.value?.units.find((x) => x.id === unitId)
    if (!u) return
    if (stat === 'hp') {
      u.hp = Math.max(0, Math.min(u.maxHp, u.hp + delta))
      if (u.hp === 0) u.downed = true
      if (u.hp > 0) u.downed = false
    } else {
      u.energy = Math.max(0, Math.min(u.maxEnergy, u.energy + delta))
    }
  }

  function toggleStatus(unitId: string, status: keyof UnitState['statuses']) {
    const u = game.value?.units.find((x) => x.id === unitId)
    if (!u) return
    if (u.statuses[status]) delete u.statuses[status]
    else u.statuses[status] = 1
  }

  function rollAttack(abilityDice: number, modifier = 0) {
    const u = selectedUnit.value
    if (!u || !game.value) return
    const faces = rollD6(abilityDice)
    const result = resolveAttackDice({
      faces,
      modifier,
      defense: 3,
    })
    game.value.lastRoll = {
      faces,
      hits: result.hits,
      damage: result.suggestedDamage,
      crits: result.crits,
    }
    pushLog(`Rolled [${faces.join(', ')}] → ${result.hits} hits (${result.suggestedDamage} dmg)`)
  }

  async function rollAttackOnline(abilityDice: number, modifier = 0) {
    if (!firebaseConfigured || mode.value !== 'online' || !game.value) {
      rollAttack(abilityDice, modifier)
      return
    }
    await ensureSignedIn()
    const fn = httpsCallable(getFirebaseFunctions(), 'rollDice')
    const res = await fn({
      gameId: game.value.id,
      kind: 'generic',
      count: abilityDice,
    })
    const data = res.data as { faces: number[]; hits: number; damage: number; crits: number[] }
    game.value.lastRoll = data
    pushLog(`Server rolled [${data.faces.join(', ')}]`)
  }

  function endActivation() {
    const u = selectedUnit.value
    const g = game.value
    if (!u || !g) return
    u.activated = true
    u.freeMoveRemaining = 0
    const next = g.activeSeat === 'A' ? 'B' : 'A'
    const waiting = g.units.filter((x) => x.seat === next && !x.activated && !x.downed)
    if (waiting.length === 0) {
      const still = g.units.filter((x) => x.seat === g.activeSeat && !x.activated && !x.downed)
      if (still.length === 0) {
        // recovery
        for (const unit of g.units) {
          if (unit.downed) continue
          unit.activated = false
          unit.energy = unit.maxEnergy
          unit.freeMoveRemaining = gameConstants.freeMovement
        }
        g.round += 1
        g.phase = 'action'
        pushLog(`Round ${g.round} — Recovery complete`)
      }
    }
    g.activeSeat = next
    pushLog(`Activation ended. ${next}'s turn`)
  }

  function pushLog(text: string) {
    game.value?.log.unshift({ id: String(Date.now()), text, at: Date.now() })
  }

  async function createOnline() {
    if (!firebaseConfigured) {
      return createLocal()
    }
    await ensureSignedIn()
    const fn = httpsCallable(getFirebaseFunctions(), 'createGame')
    const res = await fn({})
    const data = res.data as { gameId: string; code: string }
    mode.value = 'online'
    createLocal()
    game.value!.id = data.gameId
    game.value!.code = data.code
    return data.code
  }

  return {
    game,
    selectedUnitId,
    selectedUnit,
    reachableKeys,
    mode,
    mySeat,
    createLocal,
    joinLocal,
    createOnline,
    setReady,
    setFaction,
    assignTeam,
    clearTeam,
    canStart,
    startMatch,
    quickStart,
    selectUnit,
    moveSelectedTo,
    adjustStat,
    toggleStatus,
    rollAttack,
    rollAttackOnline,
    endActivation,
  }
})
