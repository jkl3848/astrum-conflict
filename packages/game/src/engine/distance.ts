import type { GameConstants, Pos } from '../types.js'

/** Alternating diagonal cost: 1st = 1, 2nd = 2, 3rd = 1, ... */
export function distance(a: Pos, b: Pos, alternatingDiagonal = true): number {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  if (!alternatingDiagonal) return Math.max(dx, dy)
  const ortho = Math.abs(dx - dy)
  const diags = Math.min(dx, dy)
  let cost = ortho
  for (let i = 0; i < diags; i++) {
    cost += i % 2 === 0 ? 1 : 2
  }
  return cost
}

export function inRange(
  a: Pos,
  b: Pos,
  min: number,
  max: number,
  alternatingDiagonal = true,
): boolean {
  const d = distance(a, b, alternatingDiagonal)
  return d >= min && d <= max
}

export interface BoardBlockers {
  blocked: Set<string> // "x,y"
  enemy: Set<string>
  ally: Set<string>
  terrain: Set<string>
  buildingWall: Set<string>
  entrance: Set<string>
  elevation: Map<string, number>
}

function key(x: number, y: number): string {
  return `${x},${y}`
}

export function neighbors(x: number, y: number, mapSize: number): Pos[] {
  const out: Pos[] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= mapSize || ny >= mapSize) continue
      out.push({ x: nx, y: ny })
    }
  }
  return out
}

export interface ReachOptions {
  from: Pos
  budget: number
  mapSize: number
  hasFlight: boolean
  blockers: BoardBlockers
  constants: GameConstants
}

/** Dijkstra reachability with alternating diagonal step costs. */
export function reachableSquares(opts: ReachOptions): Map<string, number> {
  const { from, budget, mapSize, hasFlight, blockers, constants } = opts
  const dist = new Map<string, number>()
  const start = key(from.x, from.y)
  dist.set(start, 0)
  const queue: { x: number; y: number; cost: number; diagsUsed: number }[] = [
    { x: from.x, y: from.y, cost: 0, diagsUsed: 0 },
  ]

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost)
    const cur = queue.shift()!
    for (const n of neighbors(cur.x, cur.y, mapSize)) {
      const k = key(n.x, n.y)
      if (blockers.enemy.has(k)) continue
      if (blockers.buildingWall.has(k) && !blockers.entrance.has(k)) continue
      if (blockers.terrain.has(k) && !hasFlight) continue
      if (blockers.blocked.has(k) && !blockers.ally.has(k)) continue

      const isDiag = n.x !== cur.x && n.y !== cur.y
      let step = 1
      let nextDiags = cur.diagsUsed
      if (isDiag && constants.diagonalAlternating) {
        step = cur.diagsUsed % 2 === 0 ? 1 : 2
        nextDiags = cur.diagsUsed + 1
      }
      const nextCost = cur.cost + step
      if (nextCost > budget) continue
      const prev = dist.get(k)
      if (prev !== undefined && prev <= nextCost) continue
      // Cannot end on ally-occupied square
      dist.set(k, nextCost)
      queue.push({ x: n.x, y: n.y, cost: nextCost, diagsUsed: nextDiags })
    }
  }

  // Filter: cannot end on ally or start
  for (const [k] of [...dist]) {
    if (k === start) continue
    if (blockers.ally.has(k)) dist.delete(k)
  }
  return dist
}

/** Simple LOS: Bresenham; blocked by terrain, building walls (not entrances), other units. */
export function hasLineOfSight(
  a: Pos,
  b: Pos,
  blockers: BoardBlockers,
): boolean {
  let x0 = a.x
  let y0 = a.y
  const x1 = b.x
  const y1 = b.y
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
    if (x0 === x1 && y0 === y1) break
    const k = key(x0, y0)
    if (blockers.terrain.has(k)) return false
    if (blockers.buildingWall.has(k) && !blockers.entrance.has(k)) return false
    if (blockers.enemy.has(k) || blockers.ally.has(k)) return false
  }
  return true
}
