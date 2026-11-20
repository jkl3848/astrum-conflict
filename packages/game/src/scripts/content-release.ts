import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { contentRoot, loadVersion } from '../content/loader.js'

const next = process.argv[2]
if (!next || !/^\d+\.\d+\.\d+$/.test(next)) {
  console.error('Usage: content:release <semver>   e.g. 0.2.0')
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const versionPath = join(contentRoot, 'version.json')
const prev = loadVersion()

writeFileSync(versionPath, JSON.stringify({ version: next, date: today }, null, 2) + '\n')

const archiveDir = join(contentRoot, 'archive', next)
mkdirSync(archiveDir, { recursive: true })
cpSync(join(contentRoot, 'cards'), join(archiveDir, 'cards'), { recursive: true })
cpSync(join(contentRoot, 'rules'), join(archiveDir, 'rules'), { recursive: true })
cpSync(join(contentRoot, 'constants.json'), join(archiveDir, 'constants.json'))
cpSync(join(contentRoot, 'glossary.yaml'), join(archiveDir, 'glossary.yaml'))
writeFileSync(join(archiveDir, 'version.json'), JSON.stringify({ version: next, date: today }, null, 2) + '\n')

const changelogDir = join(contentRoot, 'changelog')
mkdirSync(changelogDir, { recursive: true })
const changelogPath = join(changelogDir, `${next}.md`)
if (!existsSync(changelogPath)) {
  writeFileSync(
    changelogPath,
    `---\nversion: ${next}\ndate: ${today}\nheadline: "Update from ${prev.version}"\n---\n\n## Highlights\n\n- (edit me)\n\n## Changed cards\n\nRun \`npm run content:diff\` and paste notes here.\n`,
  )
}

console.log(`Released content v${next} (from ${prev.version})`)
console.log(`  archive → content/archive/${next}`)
console.log(`  changelog → content/changelog/${next}.md`)
