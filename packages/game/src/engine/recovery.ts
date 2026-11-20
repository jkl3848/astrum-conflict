import type { StatusId, UnitState } from '../types.js'

const REFRESH_REMOVABLE: StatusId[] = ['bleed', 'slow', 'stunned', 'stealth', 'heat', 'exposed']

export function applyBleedDamage(units: UnitState[]): UnitState[] {
  return units.map((u) => {
    if (u.downed) return u
    const bleed = u.statuses.bleed ?? 0
    if (bleed <= 0) return u
    const hp = Math.max(0, u.hp - bleed)
    return {
      ...u,
      hp,
      downed: hp === 0 ? true : u.downed,
    }
  })
}

export function refreshPhase(units: UnitState[]): UnitState[] {
  return units.map((u) => {
    if (u.downed) return u
    const statuses = { ...u.statuses }
    for (const id of REFRESH_REMOVABLE) {
      const n = statuses[id]
      if (n === undefined) continue
      if (n <= 1) delete statuses[id]
      else statuses[id] = n - 1
    }
    // Shield is NOT removed during refresh
    return {
      ...u,
      energy: u.statuses.stunned ? 0 : u.maxEnergy,
      activated: false,
      exhausted: [],
      freeMoveRemaining: 2,
      statuses,
    }
  })
}
