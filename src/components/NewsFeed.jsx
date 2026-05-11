import { useState, useEffect } from 'react'
import { useNews } from '../hooks/useNews'
import { NewsCard } from './NewsCard'
import { ArticleModal } from './ArticleModal'

const ALL_SOURCES = ['Bloomberg', 'NYT', 'WSJ', 'FT', 'NPR', 'Hacker News', 'NoahPinion', 'Derek Thompson', 'Marginal Rev', 'NBER', 'arXiv ML', 'arXiv q-fin']
const DISMISSED_KEY = 'news-agg:dismissed'
const MAX_DISMISSED = 500
const PAGE_SIZE = 20

function loadDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) }
  catch { return new Set() }
}
function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set].slice(-MAX_DISMISSED)))
}

export function NewsFeed({ onSave, isSaved }) {
  const { articles, loading, error } = useNews()
  const [active, setActive]           = useState('All')
  const [dismissed, setDismissed]     = useState(loadDismissed)
  const [selected, setSelected]       = useState(null)
  const [page, setPage]               = useState(1)

  useEffect(() => { saveDismissed(dismissed) }, [dismissed])
  useEffect(() => { setPage(1) }, [active])

  function dismiss(url) {
    setDismissed(prev => new Set([...prev, url]))
  }

  const visible  = articles.filter(a => !dismissed.has(a.url))
  const filtered = active === 'All' ? visible : visible.filter(a => a.source === active)
  const shown    = filtered.slice(0, page * PAGE_SIZE)
  const hasMore  = filtered.length > shown.length

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Source</span>
            <select
              value={active}
              onChange={e => setActive(e.target.value)}
              style={{
                background: 'var(--bg-surface)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '0.35rem 0.65rem', fontSize: '0.82rem',
                fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
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
                marginLeft: 'auto', padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              Restore {dismissed.size} dismissed
            </button>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>Fetching feeds…</div>}
        {error   && <div style={{ color: 'var(--error)', padding: '1rem' }}>Error: {error}</div>}
        {!loading && filtered.length === 0 && !error && (
          <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>No articles found.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
          {shown.map((a, i) => (
            <NewsCard
              key={`${a.url}-${i}`}
              article={a}
              onDismiss={() => dismiss(a.url)}
              onSave={onSave}
              onOpen={() => setSelected(a)}
            />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            style={{
              alignSelf: 'center', padding: '0.5rem 1.5rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: '0.82rem', cursor: 'pointer',
            }}
          >
            Load more ({filtered.length - shown.length} remaining)
          </button>
        )}
      </div>

      {selected && (
        <ArticleModal
          article={selected}
          onClose={() => setSelected(null)}
          isSaved={isSaved(selected.url)}
          onSave={() => onSave(selected)}
          onUnsave={() => { dismiss(selected.url); setSelected(null) }}
        />
      )}
    </>
  )
}
