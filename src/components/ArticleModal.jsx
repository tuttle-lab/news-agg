import { useEffect, useState } from 'react'

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
  'JMLR':           '#7c3aed',
  'NBER':           '#1d4ed8',
  'arXiv q-fin':    '#b45309',
  'arXiv econ':     '#0f766e',
}

const OBSIDIAN_VAULT = 'Prometheus'

function formatDate(published) {
  if (!published) return ''
  try {
    return new Date(published).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return published }
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* silent */ }
  }
  return (
    <button onClick={copy} style={secondaryBtn}>
      {copied ? '✓ Copied' : label}
    </button>
  )
}

const secondaryBtn = {
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  padding: '0.4rem 0.75rem',
  borderRadius: 'var(--radius)',
  fontWeight: 600,
  fontSize: '0.78rem',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontFamily: 'inherit',
}

export function ArticleModal({ article, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const color = SOURCE_COLORS[article.source] || 'var(--accent)'
  const isHN  = article.source === 'Hacker News'
  const hasDistinctArticle = article.article_url && article.article_url !== article.url

  const mdLink      = `[${article.title}](${article.url})`
  const obsidianUrl = `obsidian://new?vault=${encodeURIComponent(OBSIDIAN_VAULT)}&name=${encodeURIComponent(article.title)}&content=${encodeURIComponent(`# ${article.title}\n\nSource: ${article.source}\nURL: ${article.url}\n\n${article.summary || ''}`)}`
  const raindropUrl = `https://app.raindrop.io/create?link=${encodeURIComponent(article.url)}&title=${encodeURIComponent(article.title)}`

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              background: color, color: '#fff',
              fontSize: '0.62rem', fontWeight: 700,
              letterSpacing: '0.06em', padding: '0.15rem 0.5rem',
              borderRadius: '2px', textTransform: 'uppercase',
            }}>
              {article.source}
            </span>
            {article.published && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                {formatDate(article.published)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.4rem', lineHeight: 1,
              padding: '0 0.2rem', flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Title */}
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4 }}>
          {article.title}
        </h2>

        {/* Summary / abstract */}
        {article.summary && (
          <p style={{
            margin: 0,
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            borderTop: '1px solid var(--border)',
            paddingTop: '0.85rem',
            whiteSpace: 'pre-line',
          }}>
            {article.summary}
          </p>
        )}

        {/* Primary read links */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--accent)', color: '#fff',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius)',
              fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            {isHN ? 'HN Discussion →' : 'Read article →'}
          </a>
          {hasDistinctArticle && (
            <a
              href={article.article_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...secondaryBtn, textDecoration: 'none' }}
            >
              Original article →
            </a>
          )}
        </div>

        {/* Share / save row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '0.2rem' }}>
            Save to
          </span>
          <CopyButton text={mdLink} label="Copy [[md]]" />
          <a
            href={obsidianUrl}
            style={{ ...secondaryBtn, textDecoration: 'none' }}
            title="Open in Obsidian (requires app)"
          >
            Obsidian
          </a>
          <a
            href={raindropUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...secondaryBtn, textDecoration: 'none' }}
          >
            Raindrop
          </a>
          <CopyButton text={article.url} label="Copy URL" />
        </div>
      </div>
    </div>
  )
}
