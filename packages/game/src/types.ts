export type Faction = 'heroes' | 'villains'
export type SlotType = 'gear' | 'trait'
export type AttackKind = 'melee' | 'ranged' | 'heal' | 'special'
export type StatusId =
  | 'bleed'
  | 'slow'
  | 'stunned'
  | 'shield'
  | 'stealth'
  | 'heat'
  | 'exposed'

export interface RangeSpec {
  min: number
  max: number
}

export interface Ability {
  id: string
  name: string
  kind: AttackKind
  dice: number
  energy: number
  range: RangeSpec
  modifier?: number
  text?: string
  exhaust?: boolean
  usage?: number
}

export interface CharacterSlots {
  gear: number
  trait: number
}

export interface Character {
  id: string
  name: string
  faction: Faction
  points: number
  hp: number
  energy: number
  defense: number
  keywords: string[]
  copies?: number
  slots: CharacterSlots
  abilities: Ability[]
  passive?: string
  artKey?: string
  /** When false, unit cannot appear on a team list (e.g. Corrupted tokens). Default true. */
  draftable?: boolean
}

export interface UpgradeRestriction {
  factions?: Faction[]
  characters?: string[]
  keywords?: string[]
}

export type UpgradeEffect =
  | { type: 'stat'; stat: 'hp' | 'energy' | 'defense' | 'points'; delta: number }
  | { type: 'grantAbility'; ability: Ability }
  | { type: 'modifyAbility'; abilityId: string; dice?: number; energy?: number; modifier?: number; range?: RangeSpec }
  | { type: 'keyword'; keyword: string }
  | { type: 'text' }

export interface Upgrade {
  id: string
  name: string
  points: number
  slot: SlotType
  restrictions?: UpgradeRestriction
  text: string
  effects: UpgradeEffect[]
  /** Optional attack line shown on card (dice / range / energy) */
  attackLine?: {
    dice?: number
    range?: RangeSpec
    energy?: number
    modifier?: number
    kind?: AttackKind
  }
}

export interface EpicCard {
  id: string
  name: string
  characterId?: string
  text: string
}

export interface StatusDef {
  id: StatusId
  name: string
  short: string
  stacks?: boolean
  max?: number
  removedOnRefresh?: boolean
}

export interface Scenario {
  id: string
  name: string
  setup: string
  gameplay: string
  scoring: string
  startingPlayer: 'A' | 'B' | 'villains' | 'heroes'
  objectivePoints: number
}

export interface GameConstants {
  teamPointCap: number
  freeMovement: number
  maxRounds: number
  epicDeckSize: number
  defendEnergyCost: number
  objectiveActionCost: number
  mapSize: number
  tileSize: number
  startingZoneSize: number
  healThreshold: number
  rerollEnergyCost: number
  diagonalAlternating: boolean
}

export interface ContentVersion {
  version: string
  date: string
}

export interface GlossaryEntry {
  id: string
  term: string
  aliases?: string[]
  short: string
  icon?: string
  section?: string
}

export interface ListUnit {
  characterId: string
  upgradeIds: string[]
}

export interface TeamList {
  name: string
  faction: Faction
  units: ListUnit[]
  epicIds: string[]
  contentVersion?: string
}

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
  path?: string
}

export interface Pos {
  x: number
  y: number
  elev?: number
}

export interface UnitState {
  id: string
  seat: 'A' | 'B'
  characterId: string
  upgradeIds: string[]
  pos: Pos
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  defense: number
  statuses: Partial<Record<StatusId, number>>
  activated: boolean
  exhausted: string[]
  downed: boolean
  freeMoveRemaining: number
}

export interface DiceRollResult {
  faces: number[]
  modified: number[]
  hits: number
  crits: number[]
  suggestedDamage: number
}
