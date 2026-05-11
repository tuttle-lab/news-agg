import { useRef, useState } from 'react'

export const SOURCE_COLORS = {
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

function timeAgo(published) {
  if (!published) return ''
  try {
    const d = new Date(published)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60)    return `${Math.round(diff)}s ago`
    if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
    return d.toLocaleDateString()
  } catch { return '' }
}

const SWIPE_THRESHOLD = 72

export function NewsCard({ article, onDismiss, onOpen }) {
  const color = SOURCE_COLORS[article.source] || 'var(--accent)'
  const touchStartX = useRef(null)
  const touchMoved  = useRef(false)
  const [offsetX, setOffsetX]     = useState(0)
  const [dismissing, setDismissing] = useState(false)

  function dismiss() {
    setDismissing(true)
    setTimeout(onDismiss, 220)
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchMoved.current  = false
  }
  function onTouchMove(e) {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 8) touchMoved.current = true
    setOffsetX(dx)
  }
  function onTouchEnd(e) {
    if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
      dismiss()
    } else if (!touchMoved.current) {
      // Treat as tap → open modal, prevent ghost click
      e.preventDefault()
      onOpen()
    }
    setOffsetX(0)
    touchStartX.current = null
  }

  const opacity = dismissing ? 0 : Math.max(0, 1 - Math.abs(offsetX) / 200)
  const tx      = dismissing ? (offsetX >= 0 ? 120 : -120) : offsetX

  return (
    <div
      className="card-wrapper"
      style={{
        transform: `translateX(${tx}px)`,
        opacity,
        transition: dismissing
          ? 'transform 0.22s ease, opacity 0.22s ease'
          : offsetX === 0 ? 'transform 0.2s ease' : 'none',
        position: 'relative',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={e => { e.stopPropagation(); dismiss() }}
        className="dismiss-btn"
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '50%', width: '1.4rem', height: '1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)',
          lineHeight: 1, padding: 0,
        }}
      >×</button>

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
