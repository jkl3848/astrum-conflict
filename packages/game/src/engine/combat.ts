import type { DiceRollResult, GameConstants } from '../types.js'

export function resolveAttackDice(opts: {
  faces: number[]
  modifier?: number
  defense: number
  armor?: number
  ignoreArmor?: boolean
}): DiceRollResult {
  const modifier = opts.modifier ?? 0
  const armor = opts.ignoreArmor ? 0 : opts.armor ?? 0
  const modified = opts.faces.map((f) => f + modifier)
  const crits: number[] = []
  let hits = 0
  opts.faces.forEach((face, i) => {
    if (face === 6) {
      crits.push(i)
      hits++
      return
    }
    if (modified[i] > opts.defense) hits++
  })
  const suggestedDamage = Math.max(0, hits - armor)
  return {
    faces: opts.faces,
    modified,
    hits,
    crits,
    suggestedDamage,
  }
}

export function resolveHealDice(opts: {
  faces: number[]
  constants: GameConstants
}): number {
  return opts.faces.filter((f) => f > opts.constants.healThreshold).length
}

export function rollD6(count: number, rng: () => number = () => Math.random()): number[] {
  const faces: number[] = []
  for (let i = 0; i < count; i++) {
    faces.push(1 + Math.floor(rng() * 6))
  }
  return faces
}
