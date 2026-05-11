const SOURCE_COLORS = {
  'Reuters':      '#ff6b35',
  'AP':           '#2563eb',
  'Hacker News':  '#ff6600',
  'FT':           '#c9a227',
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const d = new Date(published)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60)   return `${Math.round(diff)}s ago`
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export function NewsCard({ article }) {
  const color = SOURCE_COLORS[article.source] || 'var(--accent)'

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.background = 'var(--bg-elevated)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: color,
            color: '#fff',
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '0.1rem 0.4rem',
            borderRadius: '2px',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {article.source}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: 'auto', flexShrink: 0 }}>
            {timeAgo(article.published)}
          </span>
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.35 }}>
          {article.title}
        </p>
        {article.summary && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
            {article.summary}
          </p>
        )}
      </div>
    </a>
  )
}
