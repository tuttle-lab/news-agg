import { useState } from 'react'
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function formatDuration(raw) {
  if (!raw) return ''
  // Handle HH:MM:SS or MM:SS
  if (raw.includes(':')) return raw
  // Handle seconds as integer
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

function EpisodeCard({ episode, show, onClick }) {
  return (
    <div
      className="news-card"
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.85rem 1rem',
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        cursor: 'pointer',
      }}
    >
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
  )
}

export function PodcastFeed() {
  const { podcasts, loading } = usePodcasts()
  const [filter, setFilter]   = useState('All')
  const [selected, setSelected] = useState(null)

  const showNames = podcasts.map(p => p.name)

  const cutoff = Date.now() - THIRTY_DAYS_MS

  const allEpisodes = podcasts
    .filter(p => filter === 'All' || p.name === filter)
    .flatMap(p => p.episodes.map(ep => ({ ...ep, show: p })))
    .filter(ep => {
      try { return new Date(ep.published).getTime() >= cutoff }
      catch { return true }
    })

  // Sort by published date
  allEpisodes.sort((a, b) => {
    try { return new Date(b.published) - new Date(a.published) }
    catch { return 0 }
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Show filter */}
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
          {allEpisodes.map((ep, i) => (
            <EpisodeCard
              key={`${ep.url}-${i}`}
              episode={ep}
              show={ep.show}
              onClick={() => setSelected(ep)}
            />
          ))}
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
