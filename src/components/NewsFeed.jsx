import { useState, useEffect } from 'react'
import { useNews } from '../hooks/useNews'
import { NewsCard } from './NewsCard'

const ALL_SOURCES = ['Bloomberg', 'NYT', 'WSJ', 'FT', 'NPR', 'Hacker News', 'NoahPinion', 'Derek Thompson', 'Marginal Rev', 'NBER', 'JMLR', 'arXiv q-fin', 'arXiv econ']
const DISMISSED_KEY = 'news-agg:dismissed'
const MAX_DISMISSED = 500

function loadDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) }
  catch { return new Set() }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set].slice(-MAX_DISMISSED)))
}

export function NewsFeed() {
  const { articles, loading, error } = useNews()
  const [active, setActive]       = useState('All')
  const [dismissed, setDismissed] = useState(loadDismissed)

  useEffect(() => { saveDismissed(dismissed) }, [dismissed])

  function dismiss(url) {
    setDismissed(prev => new Set([...prev, url]))
  }

  const visible  = articles.filter(a => !dismissed.has(a.url))
  const filtered = active === 'All' ? visible : visible.filter(a => a.source === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Source</span>
          <select
            value={active}
            onChange={e => setActive(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.35rem 0.65rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="All">All sources</option>
            {ALL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            style={{
              marginLeft: 'auto',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius)',
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
        <div style={{ color: 'var(--error)', padding: '1rem' }}>Error: {error}</div>
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
          <NewsCard key={`${a.url}-${i}`} article={a} onDismiss={() => dismiss(a.url)} />
        ))}
      </div>
    </div>
  )
}
