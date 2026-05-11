import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 30_000

export function useTickers() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    async function fetch_() {
      try {
        const res = await fetch(`${API}/tickers`)
        if (!res.ok) throw new Error(res.statusText)
        const json = await res.json()
        if (alive) setData(json)
      } catch (e) {
        if (alive) setError(e.message)
      }
    }
    fetch_()
    const id = setInterval(fetch_, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { data, error }
}
