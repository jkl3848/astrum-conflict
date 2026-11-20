/**
 * Upload game art to Firebase Storage (private). Never commit source art.
 *
 * Usage:
 *   ASSET_SOURCE=D:\projects\minis_game npx tsx scripts/upload-assets.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or `firebase login` + project.
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { createHash } from 'node:crypto'

const SOURCE = process.env.ASSET_SOURCE || 'D:\\projects\\minis_game'
const OUT = join(process.cwd(), '.asset-cache')
const MANIFEST = join(OUT, 'manifest.json')

const MAP: { key: string; src: string }[] = [
  { key: 'logo/astrum_conflict_logo_color_trans.png', src: 'logo/astrum_conflict_logo_color_trans.png' },
  { key: 'logo/space_background.png', src: 'logo/astrum_conflict_space_background.png' },
  { key: 'logo/card_back.png', src: 'printables/cards/version_0_1/card_back.png' },
]

function walkPortraits() {
  const dir = join(SOURCE, 'character_portraits')
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir)) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(f)) continue
    const id = basename(f, extname(f))
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-portrait.*$/, '')
    MAP.push({ key: `portraits/${id}${extname(f).toLowerCase()}`, src: `character_portraits/${f}` })
  }
}

function walkTransparent() {
  const dir = join(SOURCE, 'character designs/final/transparent')
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir)) {
    if (!/\.png$/i.test(f)) continue
    const id = basename(f, '.png').toLowerCase().replace(/\s+/g, '-')
    MAP.push({ key: `standees/${id}.png`, src: `character designs/final/transparent/${f}` })
  }
}

async function main() {
  walkPortraits()
  walkTransparent()
  mkdirSync(OUT, { recursive: true })

  const manifest: Record<string, { source: string; sha256: string; storagePath: string }> = {}

  for (const item of MAP) {
    const full = join(SOURCE, item.src)
    if (!existsSync(full)) {
      console.warn('skip missing', item.src)
      continue
    }
    const buf = readFileSync(full)
    const sha = createHash('sha256').update(buf).digest('hex')
    const storagePath = `art/${item.key}`
    manifest[item.key] = { source: item.src, sha256: sha, storagePath }
    // Copy into cache for inspection / future sharp resize pipeline
    const dest = join(OUT, item.key)
    mkdirSync(join(dest, '..'), { recursive: true })
    writeFileSync(dest, buf)
    console.log('cached', storagePath, `(${buf.length} bytes)`)
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`\nWrote ${Object.keys(manifest).length} entries to ${MANIFEST}`)
  console.log('Next: use Firebase Admin or `gsutil -m cp -r .asset-cache/** gs://<bucket>/art/` with private rules.')
  console.log('Client must load via Storage getBlob() — never public download URLs.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
