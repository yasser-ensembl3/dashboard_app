// Server-side in-memory cache with TTL and fingerprint-based invalidation

const DEFAULT_TTL = 30 * 60 * 1000 // 30 minutes

interface CacheEntry<T> {
  data: T
  fingerprint: string
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, fingerprint: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  // Expired
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }

  // Fingerprint mismatch = data changed in Notion
  if (entry.fingerprint !== fingerprint) {
    store.delete(key)
    return null
  }

  return entry.data
}

export function setCache<T>(key: string, data: T, fingerprint: string, ttl = DEFAULT_TTL): void {
  store.set(key, {
    data,
    fingerprint,
    expiresAt: Date.now() + ttl,
  })
}

// Build a fingerprint from item IDs + last edited times
export function buildFingerprint(items: Array<{ id: string; lastEdited?: string }>): string {
  return items
    .map(i => `${i.id}:${i.lastEdited || ''}`)
    .sort()
    .join('|')
}
