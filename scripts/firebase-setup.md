# Firebase project setup (Blaze)

1. `firebase login`
2. `firebase projects:create astrum-conflict` (or use an existing project id)
3. `firebase use astrum-conflict`
4. In Console:
   - Upgrade to **Blaze** and set a **budget alert** (e.g. $5–10/month)
   - Enable **Anonymous** + optional **Google** Auth
   - Create **Firestore** (production mode; deploy rules from repo)
   - Create **Storage** default bucket; deploy `storage.rules`
   - Enable **App Check** with reCAPTCHA Enterprise; add the web site key to `VITE_RECAPTCHA_SITE_KEY`
   - Enforce App Check on Firestore, Storage, and Functions when ready
5. Copy web config into `apps/web/.env.local`
6. `firebase deploy --only firestore:rules,storage,functions,hosting`
7. TTL: see `firestore.ttl.md`
