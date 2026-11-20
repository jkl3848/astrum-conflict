import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  allCharacters,
  allEpics,
  allUpgrades,
  contentVersion,
  deriveUnitStats,
  gameConstants,
  getCharacter,
  getEpic,
  reachableSquares,
  resolveAttackDice,
  resolveHealDice,
  rollD6,
  type Ability,
  type Faction,
  type TeamList,
  type UnitState,
} from '@astrum/game'
import { ensureSignedIn, firebaseConfigured, getFirebaseFunctions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import {
  cellKey,
  clampCell,
  DEFAULT_BUILDINGS,
  diceFormula,
  MAP_SIZE,
  placementError,
  startingSquares,
  type BoardBuilding,
} from '../board/layout'

export type GameStatus = 'lobby' | 'setup' | 'playing' | 'finished'

export interface Seat {
  uid: string | null
  name: string
  faction: Faction | null
  ready: boolean
}

export interface DiceRollView {
  faces: number[]
  modified: number[]
  modifier: number
  formula: string
  abilityName: string
  energySpent: number
  hits: number
  damage: number
  crits: number[]
  kind: Ability['kind'] | 'generic'
}

export interface EpicZone {
  deck: string[]
  hand: string[]
  discard: string[]
}

export interface ReachCell {
  key: string
  x: number
  y: number
  cost: number
  energyCost: number
  free: boolean
}

export interface LocalGame {
  id: string
  code: string
  contentVersion: string
  status: GameStatus
  playMode: 'local' | 'online'
  players: { A: Seat; B: Seat }
  lists: { A: TeamList | null; B: TeamList | null }
  buildings: BoardBuilding[]
  round: number
  phase: 'action' | 'recovery'
  activeSeat: 'A' | 'B'
  scenarioId: string | null
  scores: { A: number; B: number }
  units: UnitState[]
  epics: { A: EpicZone; B: EpicZone }
  log: { id: string; text: string; at: number }[]
  lastRoll: DiceRollView | null
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

function shuffleIds(ids: string[]) {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyEpic(): EpicZone {
  return { deck: [], hand: [], discard: [] }
}

function epicsForList(list: TeamList): string[] {
  if (list.epicIds.length) return shuffleIds(list.epicIds)
  const unitIds = new Set(list.units.map((u) => u.characterId))
  const pool = allEpics.filter((e) => !e.characterId || unitIds.has(e.characterId)).map((e) => e.id)
  return shuffleIds(pool).slice(0, gameConstants.epicDeckSize)
}

function emptyBlockers() {
  return {
    blocked: new Set<string>(),
    enemy: new Set<string>(),
    ally: new Set<string>(),
    terrain: new Set<string>(),
    buildingWall: new Set<string>(),
    entrance: new Set<string>(),
    elevation: new Map<string, number>(),
  }
}

export const useGameStore = defineStore('game', () => {
  const game = ref<LocalGame | null>(null)
  const selectedUnitId = ref<string | null>(null)
  const selectedBuildingId = ref<string | null>(null)
  const activatingUnitId = ref<string | null>(null)
  const moveOrigin = ref<{ x: number; y: number } | null>(null)
  const moveFreeBudget = ref(0)
  const moveEnergyBudget = ref(0)
  const abilityEnergySpent = ref(0)
  const mode = ref<'offline' | 'online'>('offline')
  const mySeat = ref<'A' | 'B' | null>('A')

  const selectedUnit = computed(() =>
    game.value?.units.find((u) => u.id === selectedUnitId.value) ?? null,
  )

  const reachable = computed(() => {
    const g = game.value
    const u = selectedUnit.value
    if (!g || g.status !== 'playing' || !u || u.downed || u.activated) return new Map<string, number>()
    if (u.seat !== g.activeSeat) return new Map<string, number>()
    if (activatingUnitId.value && activatingUnitId.value !== u.id) return new Map<string, number>()
    const blockers = emptyBlockers()
    for (const other of g.units) {
      if (other.downed || other.id === u.id) continue
      const k = cellKey(other.pos.x, other.pos.y)
      if (other.seat === u.seat) blockers.ally.add(k)
      else blockers.enemy.add(k)
    }
    const character = getCharacter(u.characterId)
    const hasFlight = Boolean(character?.keywords.some((k) => k.toLowerCase() === 'flight'))
    const origin = moveAnchor(u)
    return reachableSquares({
      from: origin,
      budget: origin.free + origin.energy,
      mapSize: MAP_SIZE,
      hasFlight,
      blockers,
      constants: gameConstants,
    })
  })

  const reachCells = computed((): ReachCell[] => {
    const u = selectedUnit.value
    const free = u ? moveAnchor(u).free : 0
    const cells: ReachCell[] = []
    for (const [k, cost] of reachable.value) {
      if (cost < 0) continue
      const [x, y] = k.split(',').map(Number)
      const energyCost = Math.max(0, cost - free)
      cells.push({ key: k, x, y, cost, energyCost, free: energyCost === 0 })
    }
    return cells
  })

  const reachableKeys = computed(() => new Set(reachCells.value.map((c) => c.key)))

  function canActWith(u: UnitState | null) {
    const g = game.value
    if (!g || !u || g.status !== 'playing' || u.downed || u.activated) return false
    if (u.seat !== g.activeSeat) return false
    if (activatingUnitId.value && activatingUnitId.value !== u.id) return false
    return true
  }

  function moveAnchor(u: UnitState) {
    if (activatingUnitId.value === u.id && moveOrigin.value) {
      return {
        x: moveOrigin.value.x,
        y: moveOrigin.value.y,
        free: moveFreeBudget.value,
        energy: Math.max(0, moveEnergyBudget.value - abilityEnergySpent.value),
      }
    }
    return { x: u.pos.x, y: u.pos.y, free: u.freeMoveRemaining, energy: u.energy }
  }

  function beginActivation(u: UnitState) {
    if (activatingUnitId.value) return
    activatingUnitId.value = u.id
    moveOrigin.value = { x: u.pos.x, y: u.pos.y }
    moveFreeBudget.value = u.freeMoveRemaining
    moveEnergyBudget.value = u.energy
    abilityEnergySpent.value = 0
  }

  function clearMoveAnchor() {
    activatingUnitId.value = null
    moveOrigin.value = null
    moveFreeBudget.value = 0
    moveEnergyBudget.value = 0
    abilityEnergySpent.value = 0
  }

  function canSeeEpicHand(seat: 'A' | 'B') {
    const g = game.value
    if (!g) return false
    if (g.playMode === 'local') return seat === g.activeSeat
    return seat === mySeat.value
  }

  function canPlayEpicNow() {
    const g = game.value
    if (!g || g.status !== 'playing') return false
    if (activatingUnitId.value) return false
    if (g.playMode === 'local') return true
    return mySeat.value === g.activeSeat
  }

  function createLocal(name = 'Host') {
    const code = code6()
    game.value = {
      id: `local-${code}`,
      code,
      contentVersion: contentVersion.version,
      status: 'lobby',
      playMode: 'local',
      players: {
        A: { uid: 'local-a', name, faction: null, ready: false },
        B: { uid: 'local-b', name: 'Player B', faction: null, ready: false },
      },
      lists: { A: null, B: null },
      buildings: DEFAULT_BUILDINGS.map((b) => ({ ...b })),
      round: 1,
      phase: 'action',
      activeSeat: 'A',
      scenarioId: 'control-point',
      scores: { A: 0, B: 0 },
      units: [],
      epics: { A: emptyEpic(), B: emptyEpic() },
      log: [{ id: '1', text: `Room ${code} created`, at: Date.now() }],
      lastRoll: null,
    }
    mode.value = 'offline'
    mySeat.value = 'A'
    selectedBuildingId.value = null
    clearMoveAnchor()
    return code
  }

  function setPlayMode(playMode: 'local' | 'online') {
    if (!game.value) return
    game.value.playMode = playMode
    if (playMode === 'local') {
      mode.value = 'offline'
      if (!game.value.players.B.uid) {
        game.value.players.B.uid = 'local-b'
        game.value.players.B.name = game.value.players.B.name || 'Player B'
      }
    } else {
      mode.value = 'online'
      game.value.players.B.uid = null
      game.value.players.B.name = ''
      game.value.lists.B = null
      game.value.players.B.ready = false
    }
    pushLog(playMode === 'local' ? 'Local match — you pick both teams.' : 'Online match — pick your team and share the link.')
  }

  function canEditSeat(seat: 'A' | 'B') {
    if (!game.value) return false
    if (game.value.playMode === 'local') return true
    return seat === mySeat.value
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
    if (game.value.playMode === 'local' && !game.value.players.B.uid) {
      game.value.players.B.uid = 'local-b'
      game.value.players.B.name = game.value.players.B.name || 'Player B'
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
    if (!g?.lists.A?.units.length) return false
    if (g.playMode === 'online') return Boolean(g.lists.B?.units.length)
    return Boolean(g.lists.B?.units.length)
  }

  function startMatch() {
    if (!game.value || !canStart()) return
    const a = game.value.lists.A!
    const b = game.value.lists.B!
    const units = [...placeList('A', a), ...placeList('B', b)]
    game.value.units = units
    game.value.buildings = DEFAULT_BUILDINGS.map((bldg) => ({ ...bldg }))
    game.value.status = 'setup'
    game.value.players.A.ready = true
    game.value.players.B.ready = true
    if (game.value.playMode === 'local' && !game.value.players.B.uid) {
      game.value.players.B.uid = 'local-b'
      game.value.players.B.name = game.value.players.B.name || 'Player B'
    }
    selectedUnitId.value = null
    selectedBuildingId.value = null
    pushLog(`${a.name} vs ${b.name} — place buildings, then begin.`)
  }

  function selectBuilding(id: string) {
    selectedUnitId.value = null
    selectedBuildingId.value = selectedBuildingId.value === id ? null : id
  }

  function clearBuildingSelection() {
    selectedBuildingId.value = null
  }

  function moveBuildingTo(x: number, y: number) {
    const g = game.value
    if (!g || g.status !== 'setup' || !selectedBuildingId.value) return
    const current = g.buildings.find((b) => b.id === selectedBuildingId.value)
    if (!current) return
    const next: BoardBuilding = { ...current, x: Math.round(x), y: Math.round(y) }
    const others = g.buildings.filter((b) => b.id !== current.id)
    const err = placementError(next, others)
    if (err) {
      pushLog(err)
      return
    }
    current.x = next.x
    current.y = next.y
    pushLog(`Moved building to ${next.x},${next.y}`)
  }

  function rotateBuildingEntrance() {
    const g = game.value
    if (!g || g.status !== 'setup' || !selectedBuildingId.value) return
    const current = g.buildings.find((b) => b.id === selectedBuildingId.value)
    if (!current) return
    const order = ['N', 'E', 'S', 'W'] as const
    const i = order.indexOf(current.entrance)
    current.entrance = order[(i + 1) % order.length]
    pushLog(`Entrance now faces ${current.entrance}`)
  }

  function confirmSetup() {
    const g = game.value
    if (!g || g.status !== 'setup') return
    g.status = 'playing'
    g.activeSeat = 'A'
    g.epics.A = { deck: epicsForList(g.lists.A!), hand: [], discard: [] }
    g.epics.B = { deck: epicsForList(g.lists.B!), hand: [], discard: [] }
    selectedBuildingId.value = null
    clearMoveAnchor()
    selectedUnitId.value = g.units.find((u) => u.seat === 'A' && !u.activated && !u.downed)?.id ?? null
    pushLog('Buildings locked. Player A chooses one unit to activate.')
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
    selectedBuildingId.value = null
  }

  function moveSelectedTo(x: number, y: number) {
    const g = game.value
    const u = selectedUnit.value
    if (!g || !canActWith(u) || !u) return
    const sx = clampCell(x)
    const sy = clampCell(y)
    if (sx === u.pos.x && sy === u.pos.y) return
    beginActivation(u)
    const key = cellKey(sx, sy)
    const cost = reachable.value.get(key)
    if (cost === undefined || cost < 0) return
    const occupant = g.units.find((o) => o.id !== u.id && o.pos.x === sx && o.pos.y === sy && !o.downed)
    if (occupant) {
      selectUnit(occupant.id)
      return
    }
    const freeUsed = Math.min(moveFreeBudget.value, cost)
    const energyUsed = Math.max(0, cost - moveFreeBudget.value)
    const energyAvail = Math.max(0, moveEnergyBudget.value - abilityEnergySpent.value)
    if (energyUsed > energyAvail) return
    u.freeMoveRemaining = moveFreeBudget.value - freeUsed
    u.energy = energyAvail - energyUsed
    u.pos = { x: sx, y: sy, elev: 0 }
    const name = getCharacter(u.characterId)?.name ?? u.characterId
    const parts = []
    if (freeUsed) parts.push(`${freeUsed} free`)
    if (energyUsed) parts.push(`${energyUsed} EN`)
    pushLog(`${name} moved to ${sx},${sy}${parts.length ? ` (${parts.join(' + ')} from start)` : ' (back to start)'}`)
  }

  function adjustStat(unitId: string, stat: 'hp' | 'energy', delta: number) {
    const u = game.value?.units.find((x) => x.id === unitId)
    if (!u) return
    if (stat === 'hp') {
      const wasDown = u.downed
      u.hp = Math.max(0, Math.min(u.maxHp, u.hp + delta))
      if (u.hp === 0) u.downed = true
      if (u.hp > 0) u.downed = false
      if (!wasDown && u.downed) {
        awardElimination(u)
        drawEpicForSeat(u.seat)
      }
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

  function awardElimination(u: UnitState) {
    const g = game.value
    if (!g) return
    const char = getCharacter(u.characterId)
    const upgrades = u.upgradeIds
      .map((id) => allUpgrades.find((up) => up.id === id))
      .filter((up): up is NonNullable<typeof up> => Boolean(up))
    const pts = char ? deriveUnitStats(char, upgrades).points : 0
    const other = u.seat === 'A' ? 'B' : 'A'
    g.scores[other] += pts
    pushLog(`${char?.name ?? u.characterId} downed. ${other} scores ${pts} pts.`)
  }

  function useAbility(ability: Ability) {
    const g = game.value
    const u = selectedUnit.value
    if (!g || !u) return
    if (!canActWith(u)) {
      if (u.seat !== g.activeSeat) pushLog(`It is ${g.activeSeat}'s activation.`)
      else if (activatingUnitId.value && activatingUnitId.value !== u.id) {
        pushLog('Finish this activation first — one unit per turn.')
      } else if (u.activated) pushLog('That unit has already activated this round.')
      return
    }
    if (u.energy < ability.energy) {
      pushLog(`Not enough energy for ${ability.name} (need ${ability.energy}).`)
      return
    }
    beginActivation(u)
    abilityEnergySpent.value += ability.energy
    u.energy -= ability.energy
    const modifier = ability.modifier ?? 0
    const formula = diceFormula(ability.dice, modifier)
    if (ability.dice <= 0) {
      g.lastRoll = {
        faces: [],
        modified: [],
        modifier,
        formula,
        abilityName: ability.name,
        energySpent: ability.energy,
        hits: 0,
        damage: 0,
        crits: [],
        kind: ability.kind,
      }
      pushLog(`${getCharacter(u.characterId)?.name} used ${ability.name} (−${ability.energy} EN).`)
      return
    }
    const faces = rollD6(ability.dice)
    if (ability.kind === 'heal') {
      const healed = resolveHealDice({ faces, constants: gameConstants })
      g.lastRoll = {
        faces,
        modified: faces.map((f) => f + modifier),
        modifier,
        formula,
        abilityName: ability.name,
        energySpent: ability.energy,
        hits: healed,
        damage: healed,
        crits: faces.map((f, i) => (f === 6 ? i : -1)).filter((i) => i >= 0),
        kind: ability.kind,
      }
      pushLog(`${ability.name} ${formula}: [${faces.join(', ')}] → ${healed} heal successes (−${ability.energy} EN)`)
      return
    }
    const result = resolveAttackDice({
      faces,
      modifier,
      defense: 3,
    })
    g.lastRoll = {
      faces,
      modified: result.modified,
      modifier,
      formula,
      abilityName: ability.name,
      energySpent: ability.energy,
      hits: result.hits,
      damage: result.suggestedDamage,
      crits: result.crits,
      kind: ability.kind,
    }
    pushLog(`${ability.name} ${formula}: [${faces.join(', ')}] (−${ability.energy} EN)`)
  }

  function drawEpicForSeat(seat: 'A' | 'B') {
    const g = game.value
    if (!g) return
    const zone = g.epics?.[seat]
    if (!zone) return
    if (!zone.deck.length) {
      pushLog(`${g.players[seat].name || seat} has no Epic Cards left to draw.`)
      return
    }
    const maxTries = zone.deck.length
    for (let i = 0; i < maxTries; i++) {
      const id = zone.deck.shift()
      if (!id) break
      const card = getEpic(id)
      if (card?.characterId) {
        const owner = g.units.find((u) => u.seat === seat && u.characterId === card.characterId)
        if (owner?.downed) {
          zone.deck.push(id)
          continue
        }
      }
      zone.hand.push(id)
      pushLog(`${g.players[seat].name || seat} drew an Epic Card (${zone.hand.length} in hand).`)
      return
    }
    pushLog(`${g.players[seat].name || seat} could not draw a usable Epic Card.`)
  }

  function playEpic(cardId: string) {
    const g = game.value
    if (!g || !canPlayEpicNow()) {
      pushLog('Epic Cards are played at the start of your turn, before activating a unit.')
      return
    }
    const seat = g.activeSeat
    const zone = g.epics[seat]
    const idx = zone.hand.indexOf(cardId)
    if (idx < 0) return
    const card = getEpic(cardId)
    if (!card) return
    let target = selectedUnit.value
    if (card.characterId) {
      target = g.units.find((u) => u.seat === seat && u.characterId === card.characterId && !u.downed) ?? null
      if (!target) {
        pushLog(`${card.name} needs ${getCharacter(card.characterId)?.name ?? card.characterId} on the board.`)
        return
      }
    } else if (!target || target.seat !== seat || target.downed) {
      pushLog('Select an ally, then play that Epic Card on them.')
      return
    }
    target.activated = false
    target.exhausted = []
    target.energy = target.maxEnergy
    target.freeMoveRemaining = gameConstants.freeMovement
    zone.hand.splice(idx, 1)
    zone.discard.push(cardId)
    selectedUnitId.value = target.id
    pushLog(`Played ${card.name} on ${getCharacter(target.characterId)?.name}. They are ready to activate.`)
  }

  function rollAttack(abilityDice: number, modifier = 0) {
    useAbility({
      id: 'basic-roll',
      name: 'Attack',
      kind: 'ranged',
      dice: abilityDice,
      energy: 0,
      range: { min: 0, max: 0 },
      modifier,
    })
  }

  async function rollAttackOnline(abilityDice: number, modifier = 0) {
    rollAttack(abilityDice, modifier)
  }

  function hasReadyUnit(seat: 'A' | 'B') {
    return Boolean(game.value?.units.some((x) => x.seat === seat && !x.activated && !x.downed))
  }

  function endActivation() {
    const g = game.value
    if (!g || g.status !== 'playing') return
    const selected = selectedUnit.value
    const acting =
      g.units.find((x) => x.id === activatingUnitId.value) ??
      (selected && canActWith(selected) ? selected : null)
    if (!acting) {
      pushLog('Choose one of your unactivated units, then end their activation.')
      return
    }
    acting.activated = true
    acting.freeMoveRemaining = 0
    clearMoveAnchor()
    const name = getCharacter(acting.characterId)?.name ?? acting.characterId
    const other = g.activeSeat === 'A' ? 'B' : 'A'
    let next: 'A' | 'B' = other
    if (hasReadyUnit(other)) {
      next = other
    } else if (hasReadyUnit(g.activeSeat)) {
      next = g.activeSeat
    } else {
      for (const unit of g.units) {
        if (unit.downed) continue
        unit.activated = false
        unit.energy = unit.maxEnergy
        unit.freeMoveRemaining = gameConstants.freeMovement
      }
      g.round += 1
      g.phase = 'action'
      next = other
      pushLog(`${name} finished. Round ${g.round} — Recovery complete.`)
    }
    g.activeSeat = next
    selectedUnitId.value = g.units.find((x) => x.seat === next && !x.activated && !x.downed)?.id ?? null
    const nextName = g.players[next].name || `Player ${next}`
    pushLog(`${name} activated. ${nextName}'s turn — one unit.`)
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
    game.value!.playMode = 'online'
    game.value!.players.B.uid = null
    game.value!.players.B.name = ''
    return data.code
  }

  return {
    game,
    selectedUnitId,
    selectedUnit,
    selectedBuildingId,
    activatingUnitId,
    reachableKeys,
    reachCells,
    canActWith,
    canSeeEpicHand,
    canPlayEpicNow,
    mode,
    mySeat,
    createLocal,
    joinLocal,
    createOnline,
    setPlayMode,
    canEditSeat,
    setReady,
    setFaction,
    assignTeam,
    clearTeam,
    canStart,
    startMatch,
    confirmSetup,
    selectBuilding,
    clearBuildingSelection,
    moveBuildingTo,
    rotateBuildingEntrance,
    quickStart,
    selectUnit,
    moveSelectedTo,
    adjustStat,
    toggleStatus,
    useAbility,
    playEpic,
    drawEpicForSeat,
    rollAttack,
    rollAttackOnline,
    endActivation,
  }
})
