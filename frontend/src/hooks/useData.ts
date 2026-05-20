import { useState, useEffect, useCallback } from 'react'

export function useData<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res as T)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}
