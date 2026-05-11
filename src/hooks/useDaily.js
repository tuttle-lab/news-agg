import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

let _cache = null
let _listeners = []

function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn) } }
function notify(state) { _cache = state; _listeners.forEach(f => f(state)) }

if (!_cache) {
  _cache = { data: null, loading: true }
  fetch(`${API}/daily`)
    .then(r => r.json())
    .then(d => notify({ data: d, loading: false }))
    .catch(() => notify({ data: null, loading: false }))
}

export function useDaily() {
  const [state, setState] = useState(() => _cache)
  useEffect(() => subscribe(setState), [])
  return state
}
