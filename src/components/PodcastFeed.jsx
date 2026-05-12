import { useState, useRef } from 'react'
import { usePodcasts } from '../hooks/usePodcasts'
import { ArticleModal } from './ArticleModal'

const SHOW_COLORS = {
  'Odd Lots':          '#f59e0b',
  'Ezra Klein':        '#6366f1',
  'Dwarkesh':          '#0ea5e9',
  'EconTalk':          '#16a34a',
  'Money Stuff':       '#dc2626',
  'Eye on the Market': '#1d4ed8',
  'Huberman Lab':      '#7c3aed',
}

const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000
const DISMISSED_KEY   = 'news-agg:dismissed-podcasts'
const MAX_DISMISSED   = 200
const SWIPE_THRESHOLD = 72
const MIN_TRAVEL      = 12
const HORIZ_RATIO     = 3

function loadDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) }
  catch { return new Set() }
}
function persistDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set].slice(-MAX_DISMISSED)))
}

function formatDuration(raw) {
  if (!raw) return ''
  if (raw.includes(':')) return raw
  const secs = parseInt(raw, 10)
  if (isNaN(secs)) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const d    = new Date(published)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 86400)  return `${Math.round(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.round(diff / 86400)}d ago`
    return d.toLocaleDateString()
  } catch { return '' }
}

function EpisodeCard({ episode, show, onClick, onDismiss, onSave }) {
  const startX  = useRef(null)
  const startY  = useRef(null)
  const axis    = useRef(null)
  const tapped  = useRef(true)
  const [offsetX, setOffsetX]       = useState(0)
  const [dismissing, setDismissing] = useState(false)

  function triggerDismiss() {
    setDismissing(true)
    setTimeout(onDismiss, 220)
  }
  function triggerSave() {
    setDismissing(true)
    setTimeout(() => { onSave(); onDismiss() }, 220)
  }

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    axis.current   = null
    tapped.current = true
    setOffsetX(0)
  }

  function onTouchMove(e) {
    if (startX.current === null) return
    const dx   = e.touches[0].clientX - startX.current
    const dy   = e.touches[0].clientY - startY.current
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (!axis.current) {
      if (dist < MIN_TRAVEL) return
      axis.current = Math.abs(dx) > Math.abs(dy) * HORIZ_RATIO ? 'h' : 'v'
    }

    if (axis.current === 'h') {
      e.preventDefault()
      tapped.current = false
      setOffsetX(dx)
    }
  }

  function onTouchEnd(e) {
    if (tapped.current && axis.current !== 'h') {
      e.preventDefault()
      onClick()
    } else if (axis.current === 'h') {
      if (offsetX >= SWIPE_THRESHOLD) {
        triggerSave()
      } else if (offsetX <= -SWIPE_THRESHOLD) {
        triggerDismiss()
      } else {
        setOffsetX(0)
      }
    } else {
      setOffsetX(0)
    }
    startX.current = null
    axis.current   = null
  }

  const isSwiping  = axis.current === 'h' && Math.abs(offsetX) > 8
  const swipeRight = offsetX > 0
  const hintAlpha  = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1) * 0.5

  const opacity = dismissing ? 0 : Math.max(0, 1 - Math.abs(offsetX) / 200)
  const tx      = dismissing ? (offsetX >= 0 ? 140 : -140) : offsetX

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
      <div
        onClick={onClick}
        className="news-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.85rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isSwiping && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
            background: swipeRight
              ? `rgba(34,197,94,${hintAlpha})`
              : `rgba(239,68,68,${hintAlpha})`,
            display: 'flex', alignItems: 'center',
            justifyContent: swipeRight ? 'flex-start' : 'flex-end',
            padding: '0 1rem',
            borderRadius: 'var(--radius)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{swipeRight ? '★' : '✕'}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: SHOW_COLORS[show.name] || '#1db954', color: '#fff',
            fontSize: '0.62rem', fontWeight: 700,
            letterSpacing: '0.06em', padding: '0.1rem 0.4rem',
            borderRadius: '2px', textTransform: 'uppercase', flexShrink: 0,
          }}>
            {show.name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: 'auto', flexShrink: 0 }}>
            {formatDuration(episode.duration)}{episode.duration && episode.published ? ' · ' : ''}{timeAgo(episode.published)}
          </span>
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.35 }}>
          {episode.title}
        </p>
        {episode.summary && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
            {episode.summary.slice(0, 200)}{episode.summary.length > 200 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export function PodcastFeed({ onSave }) {
  const { podcasts, loading } = usePodcasts()
  const [filter, setFilter]     = useState('All')
  const [selected, setSelected] = useState(null)
  const [dismissed, setDismissed] = useState(loadDismissed)

  const showNames = podcasts.map(p => p.name)
  const cutoff    = Date.now() - THIRTY_DAYS_MS

  function dismiss(key) {
    setDismissed(prev => {
      const next = new Set([...prev, key])
      persistDismissed(next)
      return next
    })
  }

  const allEpisodes = podcasts
    .filter(p => filter === 'All' || p.name === filter)
    .flatMap(p => p.episodes.map(ep => ({ ...ep, show: p })))
    .filter(ep => {
      try { return new Date(ep.published).getTime() >= cutoff }
      catch { return true }
    })
    .filter(ep => !dismissed.has(ep.url || `${ep.show.name}:${ep.title}`))

  allEpisodes.sort((a, b) => {
    try { return new Date(b.published) - new Date(a.published) }
    catch { return 0 }
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Show</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                background: 'var(--bg-surface)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '0.35rem 0.65rem', fontSize: '0.82rem',
                fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="All">All shows</option>
              {showNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          {dismissed.size > 0 && (
            <button
              onClick={() => {
                const next = new Set()
                persistDismissed(next)
                setDismissed(next)
              }}
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

        {loading && (
          <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
            Fetching episodes…
          </div>
        )}

        {!loading && allEpisodes.length === 0 && (
          <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
            No episodes found — RSS feeds may need updating.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
          {allEpisodes.map((ep, i) => {
            const key = ep.url || `${ep.show.name}:${ep.title}`
            return (
              <EpisodeCard
                key={`${key}-${i}`}
                episode={ep}
                show={ep.show}
                onClick={() => setSelected(ep)}
                onDismiss={() => dismiss(key)}
                onSave={() => onSave({
                  source:      ep.show.name,
                  title:       ep.title,
                  url:         key,
                  article_url: ep.url,
                  summary:     ep.summary,
                  published:   ep.published,
                })}
              />
            )
          })}
        </div>
      </div>

      {selected && (
        <ArticleModal
          article={{
            source:      selected.show.name,
            title:       selected.title,
            summary:     selected.summary,
            published:   selected.published,
            url:         selected.show.spotify,
            article_url: selected.url,
          }}
          onClose={() => setSelected(null)}
          primaryLabel="Open in Spotify →"
          secondaryLabel={selected.url !== selected.show.spotify ? 'Episode page →' : null}
        />
      )}
    </>
  )
}
