import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 10 * 60_000

export function usePodcasts() {
  const [podcasts, setPodcasts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let alive = true
    async function fetch_() {
      try {
        const res  = await fetch(`${API}/podcasts`)
        const json = await res.json()
        if (alive) { setPodcasts(json.podcasts); setLoading(false) }
      } catch {
        if (alive) setLoading(false)
      }
    }
    fetch_()
    const id = setInterval(fetch_, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { podcasts, loading }
}
