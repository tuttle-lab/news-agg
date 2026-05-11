import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 60_000

export function useKalshi() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    async function fetch_() {
      try {
        const res = await fetch(`${API}/kalshi`)
        if (!res.ok) return
        const json = await res.json()
        if (alive) setData(json)
      } catch { /* silent */ }
    }
    fetch_()
    const id = setInterval(fetch_, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { data }
}
