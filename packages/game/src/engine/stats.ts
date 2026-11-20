import type { Ability, Character, Upgrade } from '../types.js'

export interface DerivedUnitStats {
  character: Character
  hp: number
  energy: number
  defense: number
  points: number
  keywords: string[]
  abilities: Ability[]
}

export function deriveUnitStats(
  character: Character,
  upgrades: Upgrade[],
): DerivedUnitStats {
  let hp = character.hp
  let energy = character.energy
  let defense = character.defense
  let points = character.points
  const keywords = [...character.keywords]
  const abilities: Ability[] = character.abilities.map((a) => ({ ...a, range: { ...a.range } }))

  for (const u of upgrades) {
    points += u.points
    for (const effect of u.effects) {
      if (effect.type === 'stat') {
        if (effect.stat === 'hp') hp += effect.delta
        if (effect.stat === 'energy') energy += effect.delta
        if (effect.stat === 'defense') defense += effect.delta
        if (effect.stat === 'points') points += effect.delta
      } else if (effect.type === 'keyword') {
        if (!keywords.includes(effect.keyword)) keywords.push(effect.keyword)
      } else if (effect.type === 'grantAbility') {
        abilities.push({ ...effect.ability, range: { ...effect.ability.range } })
      } else if (effect.type === 'modifyAbility') {
        const ab = abilities.find((a) => a.id === effect.abilityId)
        if (ab) {
          if (effect.dice !== undefined) ab.dice = effect.dice
          if (effect.energy !== undefined) ab.energy = effect.energy
          if (effect.modifier !== undefined) ab.modifier = (ab.modifier ?? 0) + effect.modifier
          if (effect.range) ab.range = { ...effect.range }
        }
      }
    }
  }

  return { character, hp, energy, defense, points, keywords, abilities }
}
