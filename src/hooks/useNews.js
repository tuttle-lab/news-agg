import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 5 * 60_000

let _cache = null
let _listeners = []

function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn) } }
function notify(state) { _cache = state; _listeners.forEach(f => f(state)) }

let _fetching = false
async function fetchNews() {
  if (_fetching) return
  _fetching = true
  try {
    const res = await fetch(`${API}/news?limit=60`)
    if (!res.ok) throw new Error(res.statusText)
    const json = await res.json()
    notify({ articles: json.articles, loading: false, error: null })
  } catch (e) {
    notify({ articles: _cache?.articles ?? [], loading: false, error: e.message })
  } finally {
    _fetching = false
  }
}

if (!_cache) {
  _cache = { articles: [], loading: true, error: null }
  fetchNews()
  setInterval(fetchNews, POLL_MS)
}

export function useNews() {
  const [state, setState] = useState(() => _cache)
  useEffect(() => subscribe(setState), [])
  return state
}
