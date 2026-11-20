# Firestore TTL

Create a TTL policy on `games.expiresAt` (Timestamp) so lobbies and finished games are deleted after ~30 days:

```
gcloud firestore fields ttls update expiresAt \
  --collection-group=games \
  --enable-ttl \
  --project=astrum-conflict
```

Set `expiresAt` when creating a game (already done in `createGame`).
