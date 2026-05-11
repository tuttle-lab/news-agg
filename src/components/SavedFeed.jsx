import { useState } from 'react'
import { ArticleModal } from './ArticleModal'

export function SavedFeed({ saved, unsave, isSaved, onSave }) {
  const [selected, setSelected] = useState(null)

  if (saved.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '3rem 0', textAlign: 'center', fontSize: '0.9rem' }}>
        Nothing saved yet — swipe right on an article to save it.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
          {saved.map((article, i) => (
            <SavedCard
              key={`${article.url}-${i}`}
              article={article}
              onOpen={() => setSelected(article)}
              onUnsave={() => unsave(article.url)}
            />
          ))}
        </div>
      </div>

      {selected && (
        <ArticleModal
          article={selected}
          onClose={() => setSelected(null)}
          isSaved={isSaved(selected.url)}
          onSave={() => onSave(selected)}
          onUnsave={() => { unsave(selected.url); setSelected(null) }}
        />
      )}
    </>
  )
}

const SOURCE_COLORS = {
  'Bloomberg':      '#000000',
  'NYT':            '#000000',
  'WSJ':            '#004276',
  'FT':             '#c9a227',
  'NPR':            '#c80000',
  'Hacker News':    '#ff6600',
  'NoahPinion':     '#4f46e5',
  'Derek Thompson': '#0891b2',
  'Marginal Rev':   '#16a34a',
  'NBER':           '#1d4ed8',
  'arXiv ML':       '#7c3aed',
  'arXiv q-fin':    '#b45309',
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const d = new Date(published)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
    return d.toLocaleDateString()
  } catch { return '' }
}

function SavedCard({ article, onOpen, onUnsave }) {
  const color = SOURCE_COLORS[article.source] || 'var(--accent)'
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); onUnsave() }}
        aria-label="Remove from saved"
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '50%', width: '1.4rem', height: '1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '0.75rem', color: '#f59e0b',
          lineHeight: 1, padding: 0,
        }}
      >★</button>
      <div
        onClick={onOpen}
        className="news-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.85rem 2rem 0.85rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.35rem',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: color, color: '#fff',
            fontSize: '0.62rem', fontWeight: 700,
            letterSpacing: '0.06em', padding: '0.1rem 0.4rem',
            borderRadius: '2px', textTransform: 'uppercase', flexShrink: 0,
          }}>
            {article.source}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: 'auto', flexShrink: 0, paddingRight: '0.25rem' }}>
            {timeAgo(article.published)}
          </span>
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.35 }}>
          {article.title}
        </p>
        {article.summary && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
            {article.summary.slice(0, 200)}{article.summary.length > 200 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
