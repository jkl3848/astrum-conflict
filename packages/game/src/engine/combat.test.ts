import { describe, expect, it } from 'vitest'
import { resolveAttackDice, resolveHealDice } from './combat.js'
import { distance } from './distance.js'
import { applyBleedDamage, refreshPhase } from './recovery.js'
import type { UnitState } from '../types.js'

describe('combat', () => {
  it('counts crits as automatic hits', () => {
    const r = resolveAttackDice({ faces: [6, 2, 5], modifier: 0, defense: 4 })
    expect(r.hits).toBe(2)
    expect(r.crits).toEqual([0])
    expect(r.suggestedDamage).toBe(2)
  })

  it('applies armor after hits', () => {
    const r = resolveAttackDice({ faces: [5, 5, 5], defense: 3, armor: 2 })
    expect(r.hits).toBe(3)
    expect(r.suggestedDamage).toBe(1)
  })

  it('heals on dice above threshold', () => {
    expect(resolveHealDice({ faces: [1, 2, 3, 6], constants: {
      teamPointCap: 700, freeMovement: 2, maxRounds: 8, epicDeckSize: 5,
      defendEnergyCost: 2, objectiveActionCost: 2, mapSize: 24, tileSize: 8,
      startingZoneSize: 3, healThreshold: 2, rerollEnergyCost: 1, diagonalAlternating: true,
    } })).toBe(2)
  })
})

describe('distance', () => {
  it('uses alternating diagonal costs', () => {
    expect(distance({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(3) // 1+2
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3)
  })
})

describe('recovery', () => {
  const base = (over: Partial<UnitState> = {}): UnitState => ({
    id: 'u1',
    seat: 'A',
    characterId: 'eagle',
    upgradeIds: [],
    pos: { x: 0, y: 0 },
    hp: 5,
    maxHp: 8,
    energy: 1,
    maxEnergy: 5,
    defense: 4,
    statuses: {},
    activated: true,
    exhausted: ['x'],
    downed: false,
    freeMoveRemaining: 0,
    ...over,
  })

  it('applies bleed then refreshes', () => {
    const bled = applyBleedDamage([base({ statuses: { bleed: 2, shield: 1 } })])
    expect(bled[0].hp).toBe(3)
    const refreshed = refreshPhase(bled)
    expect(refreshed[0].energy).toBe(5)
    expect(refreshed[0].activated).toBe(false)
    expect(refreshed[0].statuses.bleed).toBe(1)
    expect(refreshed[0].statuses.shield).toBe(1)
  })
})
