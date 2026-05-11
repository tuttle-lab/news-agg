import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 5 * 60_000

export function useNews() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    async function fetch_() {
      try {
        const res = await fetch(`${API}/news?limit=60`)
        if (!res.ok) throw new Error(res.statusText)
        const json = await res.json()
        if (alive) { setArticles(json.articles); setLoading(false) }
      } catch (e) {
        if (alive) { setError(e.message); setLoading(false) }
      }
    }
    fetch_()
    const id = setInterval(fetch_, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { articles, loading, error }
}
