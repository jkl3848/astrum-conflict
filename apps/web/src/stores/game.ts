import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  allCharacters,
  contentVersion,
  gameConstants,
  resolveAttackDice,
  rollD6,
  type Faction,
  type UnitState,
} from '@astrum/game'
import { ensureSignedIn, firebaseConfigured, getFirebaseFunctions } from '../firebase'
import { httpsCallable } from 'firebase/functions'

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

function makeUnit(seat: 'A' | 'B', characterId: string, x: number, y: number): UnitState {
  const c = allCharacters.find((ch) => ch.id === characterId)!
  return {
    id: `${seat}-${characterId}-${Math.random().toString(36).slice(2, 7)}`,
    seat,
    characterId,
    upgradeIds: [],
    pos: { x, y, elev: 0 },
    hp: c.hp,
    maxHp: c.hp,
    energy: c.energy,
    maxEnergy: c.energy,
    defense: c.defense,
    statuses: {},
    activated: false,
    exhausted: [],
    downed: false,
    freeMoveRemaining: gameConstants.freeMovement,
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

  function createLocal(name = 'Host') {
    const code = code6()
    game.value = {
      id: `local-${code}`,
      code,
      contentVersion: contentVersion.version,
      status: 'lobby',
      players: {
        A: { uid: 'local-a', name, faction: 'heroes', ready: false },
        B: { uid: null, name: '', faction: null, ready: false },
      },
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
      faction: 'villains',
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
  }

  function quickStart() {
    if (!game.value) return
    const heroes = allCharacters.filter((c) => c.faction === 'heroes').slice(0, 3)
    const villains = allCharacters.filter((c) => c.faction === 'villains').slice(0, 3)
    const units: UnitState[] = []
    heroes.forEach((c, i) => units.push(makeUnit('A', c.id, 1 + i, 1)))
    villains.forEach((c, i) => units.push(makeUnit('B', c.id, 22 - i, 22)))
    game.value.units = units
    game.value.status = 'playing'
    game.value.players.A.ready = true
    game.value.players.B.ready = true
    if (!game.value.players.B.uid) {
      game.value.players.B = { uid: 'bot', name: 'Opponent', faction: 'villains', ready: true }
    }
    selectedUnitId.value = units[0]?.id ?? null
    pushLog('Quick setup — fight!')
  }

  function selectUnit(id: string) {
    selectedUnitId.value = id
  }

  function moveSelectedTo(x: number, y: number) {
    const g = game.value
    const u = selectedUnit.value
    if (!g || !u || u.downed) return
    if (u.seat !== g.activeSeat) return
    const occupied = g.units.some((o) => o.id !== u.id && o.pos.x === x && o.pos.y === y && !o.downed)
    if (occupied) return
    const dx = Math.abs(u.pos.x - x)
    const dy = Math.abs(u.pos.y - y)
    const steps = Math.max(dx, dy)
    if (steps === 0) return

    let remaining = steps
    if (u.freeMoveRemaining > 0) {
      const free = Math.min(u.freeMoveRemaining, remaining)
      u.freeMoveRemaining -= free
      remaining -= free
    }
    if (remaining > 0) {
      if (u.energy < remaining) return
      u.energy -= remaining
    }
    u.pos = { ...u.pos, x, y }
    pushLog(`${u.characterId} moved to ${x},${y}`)
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

  async function rollAttackOnline(abilityDice: number) {
    if (!firebaseConfigured || mode.value !== 'online' || !game.value) {
      rollAttack(abilityDice)
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
    mode,
    mySeat,
    createLocal,
    joinLocal,
    createOnline,
    setReady,
    setFaction,
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
