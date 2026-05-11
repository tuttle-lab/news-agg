import { useState, useEffect } from 'react'
import { useNews } from '../hooks/useNews'
import { NewsCard } from './NewsCard'

const ALL_SOURCES = ['Reuters', 'AP', 'Bloomberg', 'FT', 'Hacker News']
const DISMISSED_KEY = 'news-agg:dismissed'
const MAX_DISMISSED = 500

function loadDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) }
  catch { return new Set() }
}

function saveDismissed(set) {
  const arr = [...set].slice(-MAX_DISMISSED)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr))
}

export function NewsFeed() {
  const { articles, loading, error } = useNews()
  const [active, setActive] = useState('All')
  const [dismissed, setDismissed] = useState(loadDismissed)

  useEffect(() => { saveDismissed(dismissed) }, [dismissed])

  function dismiss(url) {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }

  const sources = ['All', ...ALL_SOURCES]
  const visible = articles.filter(a => !dismissed.has(a.url))
  const filtered = active === 'All' ? visible : visible.filter(a => a.source === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sources.map(s => (
          <button
            key={s}
            onClick={() => setActive(s)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: active === s ? 'var(--accent)' : 'var(--bg-surface)',
              color: active === s ? '#fff' : 'var(--text)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {s}
          </button>
        ))}
        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            style={{
              marginLeft: 'auto',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Restore {dismissed.size} dismissed
          </button>
        )}
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
          Fetching feeds…
        </div>
      )}
      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem' }}>
          Error: {error}
        </div>
      )}
      {!loading && filtered.length === 0 && !error && (
        <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
          No articles found.
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '0.75rem',
      }}>
        {filtered.map((a, i) => (
          <NewsCard
            key={`${a.url}-${i}`}
            article={a}
            onDismiss={() => dismiss(a.url)}
          />
        ))}
      </div>
    </div>
  )
}
