import { defineStore } from 'pinia'
import { ref } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { ensureSignedIn, firebaseConfigured, getFirebaseAuth, initAppCheck } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)
  const offline = ref(!firebaseConfigured)

  async function init() {
    if (!firebaseConfigured) {
      ready.value = true
      offline.value = true
      return
    }
    initAppCheck()
    const auth = getFirebaseAuth()
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        user.value = u
        ready.value = true
        resolve()
        unsub()
        onAuthStateChanged(auth, (next) => {
          user.value = next
        })
      })
    })
    if (!user.value) {
      await ensureSignedIn()
    }
  }

  return { user, ready, offline, init }
})
