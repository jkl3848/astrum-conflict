import { gameConstants } from '@astrum/game'
import type { Pos } from '@astrum/game'

export const MAP_SIZE = gameConstants.mapSize
export const TILE_SIZE = gameConstants.tileSize
export const STARTING_ZONE = gameConstants.startingZoneSize
export const BOARD_CENTER = MAP_SIZE / 2 - 0.5

export const MAP_BUILDINGS = [
  { x: 8, y: 8, w: 3, h: 3 },
  { x: 13, y: 8, w: 3, h: 3 },
  { x: 8, y: 13, w: 3, h: 3 },
  { x: 13, y: 13, w: 3, h: 3 },
] as const

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

export function buildingCells(): Set<string> {
  const cells = new Set<string>()
  for (const b of MAP_BUILDINGS) {
    for (let x = b.x; x < b.x + b.w; x++) {
      for (let y = b.y; y < b.y + b.h; y++) {
        cells.add(cellKey(x, y))
      }
    }
  }
  return cells
}

export function isMapTileSeam(x: number, y: number): boolean {
  return x % TILE_SIZE === 0 || y % TILE_SIZE === 0
}
