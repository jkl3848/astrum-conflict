import { describe, expect, it } from 'vitest'
import { validateTeam, teamPoints } from './listValidation.js'
import type { Character, EpicCard, GameConstants, Upgrade } from '../types.js'

const constants: GameConstants = {
  teamPointCap: 700,
  freeMovement: 2,
  maxRounds: 8,
  epicDeckSize: 5,
  defendEnergyCost: 2,
  objectiveActionCost: 2,
  mapSize: 24,
  tileSize: 8,
  startingZoneSize: 3,
  healThreshold: 2,
  rerollEnergyCost: 1,
  diagonalAlternating: true,
}

const eagle: Character = {
  id: 'eagle',
  name: 'Eagle',
  faction: 'heroes',
  points: 140,
  hp: 8,
  energy: 5,
  defense: 4,
  keywords: ['LEADER', 'META', 'MEDIUM'],
  slots: { gear: 1, trait: 1 },
  abilities: [],
}

const cardio: Upgrade = {
  id: 'cardio',
  name: 'Cardio',
  points: 10,
  slot: 'trait',
  text: '+1 Free Movement.',
  effects: [{ type: 'text' }],
}

const blazeOnly: Upgrade = {
  id: 'burning-splash',
  name: 'Burning Splash',
  points: 10,
  slot: 'trait',
  restrictions: { characters: ['blaze'] },
  text: '…',
  effects: [{ type: 'text' }],
}

const epics: EpicCard[] = [
  { id: 'e1', name: 'E1', text: 't' },
  { id: 'e2', name: 'E2', text: 't' },
  { id: 'e3', name: 'E3', text: 't' },
  { id: 'e4', name: 'E4', text: 't' },
  { id: 'e5', name: 'E5', text: 't' },
  { id: 'wolffe-epic', name: 'Wolffe Epic', characterId: 'wolffe', text: 't' },
]

const ctx = {
  constants,
  characters: new Map([['eagle', eagle]]),
  upgrades: new Map([['cardio', cardio], ['burning-splash', blazeOnly]]),
  epics: new Map(epics.map((e) => [e.id, e])),
}

describe('listValidation', () => {
  it('accepts a valid small team', () => {
    const issues = validateTeam({
      name: 'Test',
      faction: 'heroes',
      units: [{ characterId: 'eagle', upgradeIds: ['cardio'] }],
      epicIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
    }, ctx)
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
    expect(teamPoints({
      name: 'Test',
      faction: 'heroes',
      units: [{ characterId: 'eagle', upgradeIds: ['cardio'] }],
      epicIds: [],
    }, ctx)).toBe(150)
  })

  it('rejects restricted upgrades', () => {
    const issues = validateTeam({
      name: 'Test',
      faction: 'heroes',
      units: [{ characterId: 'eagle', upgradeIds: ['burning-splash'] }],
      epicIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
    }, ctx)
    expect(issues.some((i) => i.message.includes('cannot equip'))).toBe(true)
  })

  it('rejects non-draftable characters', () => {
    const corrupted: Character = {
      ...eagle,
      id: 'corrupted',
      name: 'Corrupted',
      faction: 'villains',
      points: 0,
      draftable: false,
    }
    const villainCtx = {
      ...ctx,
      characters: new Map([['corrupted', corrupted]]),
    }
    const issues = validateTeam(
      {
        name: 'Test',
        faction: 'villains',
        units: [{ characterId: 'corrupted', upgradeIds: [] }],
        epicIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
      },
      villainCtx,
    )
    expect(issues.some((i) => i.message.includes('building a team'))).toBe(true)
  })

  it('rejects unit-specific epic without unit', () => {
    const issues = validateTeam({
      name: 'Test',
      faction: 'heroes',
      units: [{ characterId: 'eagle', upgradeIds: [] }],
      epicIds: ['e1', 'e2', 'e3', 'e4', 'wolffe-epic'],
    }, ctx)
    expect(issues.some((i) => i.message.includes('requires'))).toBe(true)
  })
})
