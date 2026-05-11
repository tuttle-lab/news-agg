import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const POLL_MS = 10 * 60_000

let _cache = null
let _listeners = []

function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn) } }
function notify(state) { _cache = state; _listeners.forEach(f => f(state)) }

let _fetching = false
async function fetchPodcasts() {
  if (_fetching) return
  _fetching = true
  try {
    const res  = await fetch(`${API}/podcasts`)
    const json = await res.json()
    notify({ podcasts: json.podcasts, loading: false })
  } catch {
    notify({ podcasts: _cache?.podcasts ?? [], loading: false })
  } finally {
    _fetching = false
  }
}

if (!_cache) {
  _cache = { podcasts: [], loading: true }
  fetchPodcasts()
  setInterval(fetchPodcasts, POLL_MS)
}

export function usePodcasts() {
  const [state, setState] = useState(() => _cache)
  useEffect(() => subscribe(setState), [])
  return state
}
