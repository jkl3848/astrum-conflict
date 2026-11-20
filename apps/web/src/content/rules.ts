import type { GlossaryEntry } from '@astrum/game'
import { parse as parseYaml } from 'yaml'

const ruleModules = import.meta.glob('../../../../packages/game/content/rules/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, unknown>

const changelogModules = import.meta.glob('../../../../packages/game/content/changelog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, unknown>

import glossaryYaml from '../../../../packages/game/content/glossary.yaml?raw'

export interface RulesSection {
  id: string
  title: string
  order: number
  body: string
}

function moduleRaw(mod: unknown): string {
  if (typeof mod === 'string') return mod
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const d = (mod as { default: unknown }).default
    if (typeof d === 'string') return d
  }
  return ''
}

function slugFromRulePath(path: string): string {
  const base = path.replace(/\\/g, '/').split('/').pop() ?? path
  return base.replace(/^\d+-/, '').replace(/\.md$/i, '')
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseFrontmatter(raw: string): { meta: Record<string, string | number>; body: string } {
  if (!raw.startsWith('---')) return { meta: {}, body: raw }
  const end = raw.indexOf('\n---', 3)
  if (end < 0) return { meta: {}, body: raw }
  const fm = raw.slice(3, end).trim()
  const body = raw.slice(end + 4).replace(/^\r?\n/, '')
  const meta: Record<string, string | number> = {}
  try {
    const parsed = parseYaml(fm) as Record<string, unknown> | null
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' || typeof v === 'number') meta[k] = v
      }
    }
  } catch {
    for (const line of fm.split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/)
      if (!m) continue
      let val: string | number = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      } else if (/^\d+$/.test(val)) val = Number(val)
      meta[m[1]] = val
    }
  }
  return { meta, body }
}

function buildSections(modules: Record<string, unknown>): RulesSection[] {
  return Object.entries(modules)
    .map(([path, mod]) => {
      const raw = moduleRaw(mod)
      const { meta, body } = parseFrontmatter(raw)
      const slug = slugFromRulePath(path)
      return {
        id: String(meta.id ?? slug),
        title: String(meta.title ?? titleFromSlug(slug)),
        order: Number(meta.order ?? 999),
        body,
      }
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export const rulesSections: RulesSection[] = buildSections(ruleModules)

export const glossary: GlossaryEntry[] = (() => {
  const raw = parseYaml(glossaryYaml)
  return (Array.isArray(raw) ? raw : []) as GlossaryEntry[]
})()

export interface ChangelogEntry {
  version: string
  date: string
  headline: string
  body: string
}

export const changelog: ChangelogEntry[] = Object.entries(changelogModules)
  .map(([, mod]) => {
    const raw = moduleRaw(mod)
    const { meta, body } = parseFrontmatter(raw)
    return {
      version: String(meta.version ?? ''),
      date: String(meta.date ?? ''),
      headline: String(meta.headline ?? ''),
      body,
    }
  })
  .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))