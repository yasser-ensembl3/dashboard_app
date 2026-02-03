import { useState, useEffect, useCallback } from 'react'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const { data, timestamp }: CacheEntry<T> = JSON.parse(item)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearCache(key?: string): void {
  if (typeof window === 'undefined') return

  if (key) {
    localStorage.removeItem(key)
  } else {
    // Clear all notion-related cache
    const keys = Object.keys(localStorage)
    keys.forEach(k => {
      if (k.startsWith('notion-')) {
        localStorage.removeItem(k)
      }
    })
  }
}

interface UseNotionDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useNotionData<T>(endpoint: string, cacheKey?: string): UseNotionDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const key = cacheKey || `notion-${endpoint}`

  const fetchData = useCallback(async (skipCache = false) => {
    setLoading(true)
    setError(null)

    // Check cache first (unless skipCache)
    if (!skipCache) {
      const cached = getCached<T>(key)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setCache(key, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [endpoint, key])

  const refetch = useCallback(async () => {
    await fetchData(true) // Skip cache on manual refetch
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Hook for multiple endpoints at once
interface UseMultipleNotionDataResult<T extends Record<string, unknown>> {
  data: T | null
  loading: boolean
  errors: Record<string, string | null>
  refetch: () => Promise<void>
}

export function useMultipleNotionData<T extends Record<string, unknown>>(
  endpoints: Record<string, string>
): UseMultipleNotionDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const fetchAll = useCallback(async (skipCache = false) => {
    setLoading(true)

    const results: Record<string, unknown> = {}
    const newErrors: Record<string, string | null> = {}

    await Promise.all(
      Object.entries(endpoints).map(async ([key, endpoint]) => {
        const cacheKey = `notion-${endpoint}`

        // Check cache
        if (!skipCache) {
          const cached = getCached(cacheKey)
          if (cached) {
            results[key] = cached
            newErrors[key] = null
            return
          }
        }

        try {
          const response = await fetch(endpoint)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const result = await response.json()
          results[key] = result
          setCache(cacheKey, result)
          newErrors[key] = null
        } catch (err) {
          newErrors[key] = err instanceof Error ? err.message : 'Failed'
          results[key] = null
        }
      })
    )

    setData(results as T)
    setErrors(newErrors)
    setLoading(false)
  }, [endpoints])

  const refetch = useCallback(async () => {
    await fetchAll(true)
  }, [fetchAll])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, loading, errors, refetch }
}
