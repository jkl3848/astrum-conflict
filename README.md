# Astrum Conflict (Web)

Vue 3 + Vite + Firebase online tabletop for **Astrum Conflict**. Comic-book UI, share-link multiplayer, web cards, 3D board, server dice, and versioned rules content.

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/web` | Vue 3 client |
| `packages/game` | Shared types, card/rules content, rules engine |
| `functions` | Cloud Functions (rooms, dice, epic draws) |
| `scripts/` | Asset upload (art never committed) |

## Quick start (offline / no Firebase)

```bash
npm install
npm run dev
```

Open http://localhost:5173 — Create Game → Quick Setup & Play works fully offline.

## Content edits (rules & cards)

Everything balance-related lives in `packages/game/content/`:

- `rules/*.md` — searchable rulebook
- `glossary.yaml` — keyword hover tips
- `cards/*.json` — characters, upgrades, epics, statuses, scenarios
- `constants.json` — point cap, free movement, rounds, etc.
- `changelog/` — What's New copy

```bash
npm run content:check
npm run content:diff
npm run content:release -- 0.2.0
```

## Firebase

Project **`astrum-conflict`** is created and wired in `.firebaserc`. Web app config lives in `apps/web/.env.local` (gitignored).

### One-time Console steps

1. Open https://console.firebase.google.com/project/astrum-conflict
2. **Upgrade to Blaze** and set a budget alert ($5–10 is plenty for friends-scale play)
3. Enable **Cloud Firestore API** if prompted, then create the `(default)` database (Native, `nam5`)
4. Confirm **Anonymous** auth is on (optional: Google)
5. Storage: create the default bucket if missing
6. App Check: add reCAPTCHA Enterprise, put the site key in `VITE_RECAPTCHA_SITE_KEY`, then enforce on Firestore/Storage/Functions
7. Deploy:

```bash
firebase login
firebase use astrum-conflict
npm run deploy
```

Offline play works without these steps (`npm run dev` → Create Game → Quick Setup).

### Art (private)

```bash
ASSET_SOURCE=D:\projects\minis_game npm run upload-assets
# then upload .asset-cache contents to gs://<bucket>/art/ (not public)
```

Clients load art with Storage `getBlob()` (see `apps/web/src/lib/art.ts`). Do **not** commit PDFs, PSDs, or card PNGs to GitHub.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm test` | Engine unit tests |
| `npm run content:check` | Validate content schemas |
| `npm run emulators` | Firebase emulators |
| `npm run deploy` | Build + Firebase deploy |
