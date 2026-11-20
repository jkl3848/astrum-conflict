import { getBlob, ref } from 'firebase/storage'
import { firebaseConfigured, getFirebaseStorage } from '../firebase'

const urlCache = new Map<string, string>()

/** Load private Storage art via getBlob (respects auth + App Check). */
export async function loadArtUrl(storagePath: string): Promise<string | null> {
  if (!firebaseConfigured) return null
  if (urlCache.has(storagePath)) return urlCache.get(storagePath)!
  try {
    const storage = getFirebaseStorage()
    const r = ref(storage, storagePath.startsWith('art/') ? storagePath : `art/${storagePath}`)
    const blob = await getBlob(r)
    const url = URL.createObjectURL(blob)
    urlCache.set(storagePath, url)
    return url
  } catch {
    return null
  }
}
