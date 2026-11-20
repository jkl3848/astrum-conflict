import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import type {
  Character,
  ContentVersion,
  EpicCard,
  GameConstants,
  GlossaryEntry,
  Scenario,
  StatusDef,
  Upgrade,
} from '../types.js'
import {
  characterSchema,
  constantsSchema,
  epicSchema,
  glossaryEntrySchema,
  scenarioSchema,
  statusSchema,
  upgradeSchema,
} from '../schemas.js'

const here = dirname(fileURLToPath(import.meta.url))
export const contentRoot = join(here, '../../content')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function loadVersion(root = contentRoot): ContentVersion {
  return readJson(join(root, 'version.json'))
}

export function loadConstants(root = contentRoot): GameConstants {
  return constantsSchema.parse(readJson(join(root, 'constants.json')))
}

export function loadCharacters(root = contentRoot): Character[] {
  const data = readJson<unknown>(join(root, 'cards/characters.json'))
  return characterSchema.array().parse(data)
}

export function loadUpgrades(root = contentRoot): Upgrade[] {
  const data = readJson<unknown>(join(root, 'cards/upgrades.json'))
  return upgradeSchema.array().parse(data)
}

export function loadEpics(root = contentRoot): EpicCard[] {
  const data = readJson<unknown>(join(root, 'cards/epics.json'))
  return epicSchema.array().parse(data)
}

export function loadStatuses(root = contentRoot): StatusDef[] {
  const data = readJson<unknown>(join(root, 'cards/statuses.json'))
  return statusSchema.array().parse(data) as StatusDef[]
}

export function loadScenarios(root = contentRoot): Scenario[] {
  const data = readJson<unknown>(join(root, 'cards/scenarios.json'))
  return scenarioSchema.array().parse(data)
}

export function loadGlossary(root = contentRoot): GlossaryEntry[] {
  const path = join(root, 'glossary.yaml')
  if (!existsSync(path)) return []
  const raw = parseYaml(readFileSync(path, 'utf8'))
  const list = Array.isArray(raw) ? raw : raw?.terms ?? []
  return glossaryEntrySchema.array().parse(list)
}

export interface RulesSection {
  id: string
  title: string
  order: number
  body: string
  filename: string
}

function parseFrontmatter(raw: string): { meta: Record<string, string | number>; body: string } {
  if (!raw.startsWith('---')) return { meta: {}, body: raw }
  const end = raw.indexOf('\n---', 3)
  if (end < 0) return { meta: {}, body: raw }
  const fm = raw.slice(3, end).trim()
  const body = raw.slice(end + 4).replace(/^\n/, '')
  const meta: Record<string, string | number> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val: string | number = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    } else if (/^\d+$/.test(val)) {
      val = Number(val)
    }
    meta[key] = val
  }
  return { meta, body }
}

export function loadRules(root = contentRoot): RulesSection[] {
  const dir = join(root, 'rules')
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  return files.map((filename) => {
    const raw = readFileSync(join(dir, filename), 'utf8')
    const { meta, body } = parseFrontmatter(raw)
    return {
      id: String(meta.id ?? filename.replace(/\.md$/, '')),
      title: String(meta.title ?? filename),
      order: Number(meta.order ?? 0),
      body,
      filename,
    }
  }).sort((a, b) => a.order - b.order)
}

export interface GameContent {
  version: ContentVersion
  constants: GameConstants
  characters: Character[]
  upgrades: Upgrade[]
  epics: EpicCard[]
  statuses: StatusDef[]
  scenarios: Scenario[]
  glossary: GlossaryEntry[]
  rules: RulesSection[]
}

export function loadContent(root = contentRoot): GameContent {
  return {
    version: loadVersion(root),
    constants: loadConstants(root),
    characters: loadCharacters(root),
    upgrades: loadUpgrades(root),
    epics: loadEpics(root),
    statuses: loadStatuses(root),
    scenarios: loadScenarios(root),
    glossary: loadGlossary(root),
    rules: loadRules(root),
  }
}

export function characterMap(content: GameContent): Map<string, Character> {
  return new Map(content.characters.map((c) => [c.id, c]))
}

export function upgradeMap(content: GameContent): Map<string, Upgrade> {
  return new Map(content.upgrades.map((u) => [u.id, u]))
}

export function epicMap(content: GameContent): Map<string, EpicCard> {
  return new Map(content.epics.map((e) => [e.id, e]))
}
