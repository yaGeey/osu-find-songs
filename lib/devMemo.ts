const store = new Map<string, { value: unknown; expiresAt: number }>()

// Every HMR update clears the `'use cache'` entries in dev, so data rendered on
// every page (footer stats, banners) is fetched again after each save. Keep the
// last result around for a while so saving a file doesn't stall the page for ~1s.
export default async function devMemo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
   if (process.env.NODE_ENV !== 'development') return load()

   const cached = store.get(key)
   if (cached && cached.expiresAt > Date.now()) return cached.value as T

   const value = await load()
   store.set(key, { value, expiresAt: Date.now() + ttlMs })
   return value
}
