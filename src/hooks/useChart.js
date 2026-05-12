import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

export function useChart(symbol) {
  const [data, setData] = useState(null)

  useEffect(() => {
    setData(null)
    fetch(`${API}/chart/${symbol}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ points: [] }))
  }, [symbol])

  return { data, loading: data === null }
}
