# Firestore rules checks (emulator)

```bash
firebase emulators:start --only firestore
# in another terminal, with @firebase/rules-unit-testing:
```

Expected behavior:

1. Unauthenticated: cannot read `lists` or `games`
2. Owner can CRUD own `lists/{id}`
3. Non-player cannot write `games/{id}/units`
4. `games/{id}/log` client creates only allowed when `type == 'chat'`
5. `games/{id}/private/{uid}` readable only by that uid; never client-writable
6. Game create is Functions-only (`allow create: if false`)
