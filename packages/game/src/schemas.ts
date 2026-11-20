import { z } from 'zod'

export const rangeSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(0),
})

export const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['melee', 'ranged', 'heal', 'special']),
  dice: z.number().int().min(0),
  energy: z.number().int().min(0),
  range: rangeSchema,
  modifier: z.number().int().optional(),
  text: z.string().optional(),
  exhaust: z.boolean().optional(),
  usage: z.number().int().optional(),
})

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  faction: z.enum(['heroes', 'villains']),
  points: z.number().int().min(0),
  hp: z.number().int().positive(),
  energy: z.number().int().min(0),
  defense: z.number().int().min(0),
  keywords: z.array(z.string()),
  copies: z.number().int().positive().optional(),
  slots: z.object({
    gear: z.number().int().min(0),
    trait: z.number().int().min(0),
  }),
  abilities: z.array(abilitySchema),
  passive: z.string().optional(),
  artKey: z.string().optional(),
  draftable: z.boolean().optional(),
})

export const upgradeEffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stat'),
    stat: z.enum(['hp', 'energy', 'defense', 'points']),
    delta: z.number().int(),
  }),
  z.object({
    type: z.literal('grantAbility'),
    ability: abilitySchema,
  }),
  z.object({
    type: z.literal('modifyAbility'),
    abilityId: z.string(),
    dice: z.number().int().optional(),
    energy: z.number().int().optional(),
    modifier: z.number().int().optional(),
    range: rangeSchema.optional(),
  }),
  z.object({
    type: z.literal('keyword'),
    keyword: z.string(),
  }),
  z.object({
    type: z.literal('text'),
  }),
])

export const upgradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number().int().min(0),
  slot: z.enum(['gear', 'trait']),
  restrictions: z
    .object({
      factions: z.array(z.enum(['heroes', 'villains'])).optional(),
      characters: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  text: z.string(),
  effects: z.array(upgradeEffectSchema),
  attackLine: z
    .object({
      dice: z.number().int().optional(),
      range: rangeSchema.optional(),
      energy: z.number().int().optional(),
      modifier: z.number().int().optional(),
      kind: z.enum(['melee', 'ranged', 'heal', 'special']).optional(),
    })
    .optional(),
})

export const epicSchema = z.object({
  id: z.string(),
  name: z.string(),
  characterId: z.string().optional(),
  text: z.string(),
})

export const statusSchema = z.object({
  id: z.string(),
  name: z.string(),
  short: z.string(),
  stacks: z.boolean().optional(),
  max: z.number().int().optional(),
  removedOnRefresh: z.boolean().optional(),
})

export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  setup: z.string(),
  gameplay: z.string(),
  scoring: z.string(),
  startingPlayer: z.enum(['A', 'B', 'villains', 'heroes']),
  objectivePoints: z.number().int(),
})

export const constantsSchema = z.object({
  teamPointCap: z.number().int(),
  freeMovement: z.number().int(),
  maxRounds: z.number().int(),
  epicDeckSize: z.number().int(),
  defendEnergyCost: z.number().int(),
  objectiveActionCost: z.number().int(),
  mapSize: z.number().int(),
  tileSize: z.number().int(),
  startingZoneSize: z.number().int(),
  healThreshold: z.number().int(),
  rerollEnergyCost: z.number().int(),
  diagonalAlternating: z.boolean(),
})

export const glossaryEntrySchema = z.object({
  id: z.string(),
  term: z.string(),
  aliases: z.array(z.string()).optional(),
  short: z.string(),
  icon: z.string().optional(),
  section: z.string().optional(),
})
