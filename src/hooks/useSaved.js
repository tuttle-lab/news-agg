import { useState, useCallback } from 'react'

const KEY = 'news-agg:saved'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}
function persist(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

export function useSaved() {
  const [saved, setSaved] = useState(load)

  const save = useCallback((article) => {
    setSaved(prev => {
      if (prev.some(a => a.url === article.url)) return prev
      const next = [article, ...prev]
      persist(next)
      return next
    })
  }, [])

  const unsave = useCallback((url) => {
    setSaved(prev => {
      const next = prev.filter(a => a.url !== url)
      persist(next)
      return next
    })
  }, [])

  const isSaved = useCallback((url) => saved.some(a => a.url === url), [saved])

  return { saved, save, unsave, isSaved }
}
