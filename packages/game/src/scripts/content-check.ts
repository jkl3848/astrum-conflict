import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  contentRoot,
  loadCharacters,
  loadConstants,
  loadEpics,
  loadGlossary,
  loadRules,
  loadScenarios,
  loadStatuses,
  loadUpgrades,
  loadVersion,
} from '../content/loader.js'

const errors: string[] = []

function fail(msg: string) {
  errors.push(msg)
}

try {
  const version = loadVersion()
  loadConstants()
  const characters = loadCharacters()
  const upgrades = loadUpgrades()
  const epics = loadEpics()
  const statuses = loadStatuses()
  const scenarios = loadScenarios()
  const glossary = loadGlossary()
  const rules = loadRules()

  const charIds = new Set(characters.map((c) => c.id))
  const upIds = new Set(upgrades.map((u) => u.id))
  const epicIds = new Set(epics.map((e) => e.id))
  const ruleIds = new Set(rules.map((r) => r.id))

  if (charIds.size !== characters.length) fail('Duplicate character ids')
  if (upIds.size !== upgrades.length) fail('Duplicate upgrade ids')
  if (epicIds.size !== epics.length) fail('Duplicate epic ids')

  for (const e of epics) {
    if (e.characterId && !charIds.has(e.characterId)) {
      fail(`Epic ${e.id} references missing character ${e.characterId}`)
    }
  }
  for (const u of upgrades) {
    for (const cid of u.restrictions?.characters ?? []) {
      if (!charIds.has(cid)) fail(`Upgrade ${u.id} references missing character ${cid}`)
    }
  }
  for (const g of glossary) {
    if (g.section && !ruleIds.has(g.section) && !rules.some((r) => r.filename.includes(g.section))) {
      // soft: section may match id partially
      if (![...ruleIds].some((id) => id.includes(g.section!) || g.section!.includes(id))) {
        fail(`Glossary ${g.id} section '${g.section}' not found in rules`)
      }
    }
  }

  const archiveDir = join(contentRoot, 'archive', version.version)
  if (!existsSync(archiveDir)) {
    console.warn(`Warning: no archive snapshot for ${version.version}`)
  }

  console.log(`Content check OK — v${version.version}`)
  console.log(`  characters=${characters.length} upgrades=${upgrades.length} epics=${epics.length}`)
  console.log(`  statuses=${statuses.length} scenarios=${scenarios.length}`)
  console.log(`  glossary=${glossary.length} rules=${rules.length}`)
  console.log(`  rules files: ${readdirSync(join(contentRoot, 'rules')).filter((f) => f.endsWith('.md')).length}`)
} catch (e) {
  fail(e instanceof Error ? e.message : String(e))
}

if (errors.length) {
  console.error('Content check FAILED:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
