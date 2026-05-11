import { useState } from 'react'
import { useNews } from '../hooks/useNews'
import { NewsCard } from './NewsCard'

const ALL_SOURCES = ['Reuters', 'AP', 'Hacker News', 'FT']

export function NewsFeed() {
  const { articles, loading, error } = useNews()
  const [active, setActive] = useState('All')

  const sources = ['All', ...ALL_SOURCES]
  const filtered = active === 'All' ? articles : articles.filter(a => a.source === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Source filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
        {filtered.map((a, i) => <NewsCard key={`${a.url}-${i}`} article={a} />)}
      </div>
    </div>
  )
}
