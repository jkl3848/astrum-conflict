import { gameConstants } from '@astrum/game'
import type { Pos } from '@astrum/game'

export const MAP_SIZE = gameConstants.mapSize
export const TILE_SIZE = gameConstants.tileSize
export const STARTING_ZONE = gameConstants.startingZoneSize
export const BOARD_CENTER = MAP_SIZE / 2 - 0.5
export const BUILDING_EDGE_GAP = 2

export type EntranceDir = 'N' | 'S' | 'E' | 'W'

export interface BoardBuilding {
  id: string
  x: number
  y: number
  w: number
  h: number
  entrance: EntranceDir
}

export const DEFAULT_BUILDINGS: BoardBuilding[] = [
  { id: 'b1', x: 8, y: 8, w: 3, h: 3, entrance: 'S' },
  { id: 'b2', x: 13, y: 8, w: 3, h: 3, entrance: 'S' },
  { id: 'b3', x: 8, y: 13, w: 3, h: 3, entrance: 'N' },
  { id: 'b4', x: 13, y: 13, w: 3, h: 3, entrance: 'N' },
]

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function clampCell(n: number): number {
  return Math.max(0, Math.min(MAP_SIZE - 1, Math.round(n)))
}

export function startingOrigin(seat: 'A' | 'B'): Pos {
  if (seat === 'A') return { x: 0, y: 0 }
  return { x: MAP_SIZE - STARTING_ZONE, y: MAP_SIZE - STARTING_ZONE }
}

export function startingSquares(seat: 'A' | 'B'): Pos[] {
  const origin = startingOrigin(seat)
  const out: Pos[] = []
  for (let y = 0; y < STARTING_ZONE; y++) {
    for (let x = 0; x < STARTING_ZONE; x++) {
      out.push({ x: origin.x + x, y: origin.y + y })
    }
  }
  return out
}

export function isStartingZone(x: number, y: number, seat?: 'A' | 'B'): boolean {
  const seats: Array<'A' | 'B'> = seat ? [seat] : ['A', 'B']
  return seats.some((s) => {
    const o = startingOrigin(s)
    return x >= o.x && x < o.x + STARTING_ZONE && y >= o.y && y < o.y + STARTING_ZONE
  })
}

export function footprintKeys(b: BoardBuilding): string[] {
  const keys: string[] = []
  for (let x = b.x; x < b.x + b.w; x++) {
    for (let y = b.y; y < b.y + b.h; y++) {
      keys.push(cellKey(x, y))
    }
  }
  return keys
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by))
}

export function placementError(b: BoardBuilding, others: BoardBuilding[]): string | null {
  if (b.x < BUILDING_EDGE_GAP || b.y < BUILDING_EDGE_GAP) {
    return 'Buildings must sit at least 2 squares from the map edge.'
  }
  if (b.x + b.w > MAP_SIZE - BUILDING_EDGE_GAP || b.y + b.h > MAP_SIZE - BUILDING_EDGE_GAP) {
    return 'Buildings must sit at least 2 squares from the map edge.'
  }
  const startCells = [...startingSquares('A'), ...startingSquares('B')]
  for (let x = b.x; x < b.x + b.w; x++) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (const s of startCells) {
        if (chebyshev(x, y, s.x, s.y) <= BUILDING_EDGE_GAP) {
          return 'Buildings cannot be within 2 squares of a starting zone.'
        }
      }
    }
  }
  for (const o of others) {
    const overlap = !(
      b.x + b.w <= o.x ||
      o.x + o.w <= b.x ||
      b.y + b.h <= o.y ||
      o.y + o.h <= b.y
    )
    if (overlap) return 'Buildings cannot overlap.'
  }
  return null
}

export function isMapTileSeam(x: number, y: number): boolean {
  return x % TILE_SIZE === 0 || y % TILE_SIZE === 0
}

export function diceFormula(dice: number, modifier = 0): string {
  if (dice <= 0) return '—'
  if (!modifier) return `${dice}d6`
  return `${dice}d6${modifier > 0 ? '+' : ''}${modifier}`
}
