import type { Scenario } from '../types.js'

export function scoreEliminations(
  eliminatedEnemyPoints: number,
  objectiveTokens: number,
  scenario: Scenario,
): number {
  return objectiveTokens * scenario.objectivePoints + eliminatedEnemyPoints
}
