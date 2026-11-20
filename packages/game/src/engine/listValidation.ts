import type {
  Character,
  EpicCard,
  GameConstants,
  TeamList,
  Upgrade,
  ValidationIssue,
} from '../types.js'

export interface ListValidationContext {
  constants: GameConstants
  characters: Map<string, Character>
  upgrades: Map<string, Upgrade>
  epics: Map<string, EpicCard>
}

export function unitPoints(
  characterId: string,
  upgradeIds: string[],
  ctx: ListValidationContext,
): number {
  const c = ctx.characters.get(characterId)
  if (!c) return 0
  let pts = c.points
  for (const uid of upgradeIds) {
    const u = ctx.upgrades.get(uid)
    if (u) pts += u.points
  }
  return pts
}

export function teamPoints(list: TeamList, ctx: ListValidationContext): number {
  return list.units.reduce((sum, u) => sum + unitPoints(u.characterId, u.upgradeIds, ctx), 0)
}

function upgradeAllowed(character: Character, upgrade: Upgrade): boolean {
  const r = upgrade.restrictions
  if (!r) return true
  const checks: boolean[] = []
  if (r.factions?.length) checks.push(r.factions.includes(character.faction))
  if (r.characters?.length) checks.push(r.characters.includes(character.id))
  if (r.keywords?.length) {
    checks.push(r.keywords.some((k) => character.keywords.map((x) => x.toLowerCase()).includes(k.toLowerCase())))
  }
  if (checks.length === 0) return true
  return checks.some(Boolean)
}

export function validateTeam(list: TeamList, ctx: ListValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const pts = teamPoints(list, ctx)
  if (pts > ctx.constants.teamPointCap) {
    issues.push({
      level: 'error',
      message: `Team is ${pts} points (max ${ctx.constants.teamPointCap}).`,
      path: 'points',
    })
  }

  const counts = new Map<string, number>()
  for (const unit of list.units) {
    const c = ctx.characters.get(unit.characterId)
    if (!c) {
      issues.push({ level: 'error', message: `Unknown character: ${unit.characterId}`, path: unit.characterId })
      continue
    }
    if (c.faction !== list.faction) {
      issues.push({
        level: 'error',
        message: `${c.name} is not a ${list.faction} unit.`,
        path: unit.characterId,
      })
    }
    if (c.draftable === false) {
      issues.push({
        level: 'error',
        message: `${c.name} cannot be added while building a team.`,
        path: unit.characterId,
      })
    }
    counts.set(unit.characterId, (counts.get(unit.characterId) ?? 0) + 1)

    const gear = unit.upgradeIds.filter((id) => ctx.upgrades.get(id)?.slot === 'gear')
    const trait = unit.upgradeIds.filter((id) => ctx.upgrades.get(id)?.slot === 'trait')
    if (gear.length > c.slots.gear) {
      issues.push({
        level: 'error',
        message: `${c.name} has ${gear.length} gear upgrades (slots: ${c.slots.gear}).`,
        path: unit.characterId,
      })
    }
    if (trait.length > c.slots.trait) {
      issues.push({
        level: 'error',
        message: `${c.name} has ${trait.length} trait upgrades (slots: ${c.slots.trait}).`,
        path: unit.characterId,
      })
    }

    const seen = new Set<string>()
    for (const uid of unit.upgradeIds) {
      if (seen.has(uid)) {
        issues.push({
          level: 'error',
          message: `${c.name} cannot have two copies of the same upgrade.`,
          path: uid,
        })
      }
      seen.add(uid)
      const u = ctx.upgrades.get(uid)
      if (!u) {
        issues.push({ level: 'error', message: `Unknown upgrade: ${uid}`, path: uid })
        continue
      }
      if (!upgradeAllowed(c, u)) {
        issues.push({
          level: 'error',
          message: `${c.name} cannot equip ${u.name}.`,
          path: uid,
        })
      }
    }
  }

  for (const [id, count] of counts) {
    const c = ctx.characters.get(id)!
    const max = c.copies ?? 1
    if (count > max) {
      issues.push({
        level: 'error',
        message: `Too many copies of ${c.name} (${count}/${max}).`,
        path: id,
      })
    }
  }

  if (list.epicIds.length !== ctx.constants.epicDeckSize) {
    issues.push({
      level: 'error',
      message: `Epic deck must have exactly ${ctx.constants.epicDeckSize} cards (has ${list.epicIds.length}).`,
      path: 'epics',
    })
  }

  const epicSeen = new Set<string>()
  for (const eid of list.epicIds) {
    if (epicSeen.has(eid)) {
      issues.push({ level: 'error', message: `Duplicate epic card: ${eid}`, path: eid })
    }
    epicSeen.add(eid)
    const e = ctx.epics.get(eid)
    if (!e) {
      issues.push({ level: 'error', message: `Unknown epic: ${eid}`, path: eid })
      continue
    }
    if (e.characterId && !list.units.some((u) => u.characterId === e.characterId)) {
      issues.push({
        level: 'error',
        message: `${e.name} requires ${e.characterId} on your team.`,
        path: eid,
      })
    }
  }

  return issues
}
