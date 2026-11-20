import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { randomInt } from 'node:crypto'
import {
  contentVersion,
  resolveAttackDice,
  resolveHealDice,
  gameConstants,
} from '@astrum/game'

initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 20 })

const db = getFirestore()

function code6() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[randomInt(alphabet.length)]
  return s
}

function requireAuth(request: { auth?: { uid: string } | null }) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required')
  return request.auth.uid
}

export const createGame = onCall(async (request) => {
  const uid = requireAuth(request)
  const code = code6()
  const ref = db.collection('games').doc()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await ref.set({
    code,
    contentVersion: contentVersion.version,
    status: 'lobby',
    players: {
      A: { uid, name: request.data?.name || 'Host', faction: null, ready: false },
      B: { uid: null, name: '', faction: null, ready: false },
    },
    round: 1,
    phase: 'action',
    activeSeat: 'A',
    scenario: null,
    scores: { A: 0, B: 0 },
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
  })
  return { gameId: ref.id, code }
})

export const joinGame = onCall(async (request) => {
  const uid = requireAuth(request)
  const code = String(request.data?.code || '').toUpperCase()
  if (!code) throw new HttpsError('invalid-argument', 'code required')
  const snap = await db.collection('games').where('code', '==', code).limit(1).get()
  if (snap.empty) throw new HttpsError('not-found', 'Game not found')
  const doc = snap.docs[0]
  const data = doc.data()
  if (data.players?.B?.uid && data.players.B.uid !== uid) {
    throw new HttpsError('failed-precondition', 'Game is full')
  }
  await doc.ref.update({
    'players.B': {
      uid,
      name: request.data?.name || 'Guest',
      faction: null,
      ready: false,
    },
  })
  return { gameId: doc.id, code }
})

export const rollOff = onCall(async (request) => {
  const uid = requireAuth(request)
  const gameId = String(request.data?.gameId || '')
  const ref = db.collection('games').doc(gameId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Game not found')
  const g = snap.data()!
  if (g.players.A.uid !== uid && g.players.B.uid !== uid) {
    throw new HttpsError('permission-denied', 'Not a player')
  }
  const a = randomInt(1, 7)
  const b = randomInt(1, 7)
  const first = a >= b ? 'A' : 'B'
  await ref.collection('log').add({
    type: 'roll',
    kind: 'rolloff',
    faces: { A: a, B: b },
    first,
    at: FieldValue.serverTimestamp(),
  })
  await ref.update({ activeSeat: first })
  return { A: a, B: b, first }
})

export const startGame = onCall(async (request) => {
  const uid = requireAuth(request)
  const gameId = String(request.data?.gameId || '')
  const ref = db.collection('games').doc(gameId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Game not found')
  const g = snap.data()!
  if (g.players.A.uid !== uid && g.players.B.uid !== uid) {
    throw new HttpsError('permission-denied', 'Not a player')
  }

  // Shuffle epic decks into private docs
  for (const seat of ['A', 'B'] as const) {
    const player = g.players[seat]
    if (!player?.uid) continue
    const epicIds: string[] = player.list?.epicIds || []
    const shuffled = [...epicIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    await ref.collection('private').doc(player.uid).set({
      epicDeck: shuffled,
      hand: [],
    })
  }

  await ref.update({
    status: 'playing',
    contentVersion: contentVersion.version,
  })
  return { ok: true }
})

export const rollDice = onCall(async (request) => {
  const uid = requireAuth(request)
  const { gameId, kind, count, modifier, defense, armor, ignoreArmor, rerollIndices } = request.data || {}
  if (!gameId) throw new HttpsError('invalid-argument', 'gameId required')
  const ref = db.collection('games').doc(String(gameId))
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Game not found')
  const g = snap.data()!
  if (g.players.A.uid !== uid && g.players.B.uid !== uid) {
    throw new HttpsError('permission-denied', 'Not a player')
  }

  const n = Math.min(20, Math.max(1, Number(count) || 1))
  let faces = Array.from({ length: n }, () => randomInt(1, 7))

  if (kind === 'reroll' && Array.isArray(rerollIndices)) {
    faces = Array.isArray(request.data.faces) ? [...request.data.faces] : faces
    for (const idx of rerollIndices) {
      if (idx >= 0 && idx < faces.length) faces[idx] = randomInt(1, 7)
    }
  }

  let hits = 0
  let damage = 0
  let crits: number[] = []
  let healed = 0

  if (kind === 'heal') {
    healed = resolveHealDice({ faces, constants: gameConstants })
  } else {
    const result = resolveAttackDice({
      faces,
      modifier: Number(modifier) || 0,
      defense: Number(defense) || 3,
      armor: Number(armor) || 0,
      ignoreArmor: Boolean(ignoreArmor),
    })
    hits = result.hits
    damage = result.suggestedDamage
    crits = result.crits
  }

  await ref.collection('log').add({
    type: 'roll',
    kind: kind || 'generic',
    uid,
    faces,
    hits,
    damage,
    crits,
    healed,
    at: FieldValue.serverTimestamp(),
  })

  return { faces, hits, damage, crits, healed }
})

export const drawEpic = onCall(async (request) => {
  const uid = requireAuth(request)
  const gameId = String(request.data?.gameId || '')
  const priv = db.collection('games').doc(gameId).collection('private').doc(uid)
  const snap = await priv.get()
  if (!snap.exists) throw new HttpsError('not-found', 'No private deck')
  const data = snap.data()!
  const deck: string[] = data.epicDeck || []
  if (!deck.length) throw new HttpsError('failed-precondition', 'Deck empty')
  const card = deck.shift()!
  const hand: string[] = data.hand || []
  hand.push(card)
  await priv.update({ epicDeck: deck, hand })
  return { cardId: card, handSize: hand.length }
})
