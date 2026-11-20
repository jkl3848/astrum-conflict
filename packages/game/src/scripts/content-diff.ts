import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { contentRoot, loadCharacters, loadUpgrades, loadVersion } from '../content/loader.js'

function latestArchive(): string | null {
  const dir = join(contentRoot, 'archive')
  if (!existsSync(dir)) return null
  const versions = readdirSync(dir).sort()
  return versions.at(-1) ?? null
}

const current = loadVersion().version
const archiveVer = latestArchive()
if (!archiveVer) {
  console.log('No archive yet — nothing to diff.')
  process.exit(0)
}

const archRoot = join(contentRoot, 'archive', archiveVer)
const oldChars = JSON.parse(readFileSync(join(archRoot, 'cards/characters.json'), 'utf8')) as Array<{ id: string; name: string; points: number }>
const oldUps = JSON.parse(readFileSync(join(archRoot, 'cards/upgrades.json'), 'utf8')) as Array<{ id: string; name: string; points: number; text: string }>
const newChars = loadCharacters()
const newUps = loadUpgrades()

const oldCharMap = new Map(oldChars.map((c) => [c.id, c]))
const oldUpMap = new Map(oldUps.map((u) => [u.id, u]))

console.log(`# Diff ${archiveVer} → ${current}\n`)

for (const c of newChars) {
  const o = oldCharMap.get(c.id)
  if (!o) {
    console.log(`- Added character: ${c.name}`)
    continue
  }
  if (o.points !== c.points) console.log(`- ${c.name}: points ${o.points} → ${c.points}`)
}
for (const o of oldChars) {
  if (!newChars.find((c) => c.id === o.id)) console.log(`- Removed character: ${o.name}`)
}

for (const u of newUps) {
  const o = oldUpMap.get(u.id)
  if (!o) {
    console.log(`- Added upgrade: ${u.name}`)
    continue
  }
  if (o.points !== u.points) console.log(`- ${u.name}: points ${o.points} → ${u.points}`)
  if (o.text !== u.text) console.log(`- ${u.name}: text changed`)
}
for (const o of oldUps) {
  if (!newUps.find((u) => u.id === o.id)) console.log(`- Removed upgrade: ${o.name}`)
}
