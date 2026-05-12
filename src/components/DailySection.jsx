import { useState } from 'react'
import { useDaily } from '../hooks/useDaily'

const STORAGE_KEY = 'news-agg:daily-dismissed'

function loadDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function saveDismissed(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
}

export function DailySection() {
  const { data, loading } = useDaily()
  const [dismissed, setDismissed] = useState(loadDismissed)

  if (loading || (!data?.apod && !data?.wiki)) return null

  const today = data.date  // e.g. "May 10, 2026"

  function dismiss(key) {
    setDismissed(prev => {
      const next = { ...prev, [`${today}:${key}`]: true }
      saveDismissed(next)
      return next
    })
  }

  const apodDismissed = dismissed[`${today}:apod`]
  const wikiDismissed = dismissed[`${today}:wiki`]

  if (apodDismissed && wikiDismissed) return null

  return (
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Today · {today}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
        {data.apod && !apodDismissed && (
          <DismissableCard onDismiss={() => dismiss('apod')}>
            <ApodCard apod={data.apod} />
          </DismissableCard>
        )}
        {data.wiki && !wikiDismissed && (
          <DismissableCard onDismiss={() => dismiss('wiki')}>
            <WikiCard wiki={data.wiki} />
          </DismissableCard>
        )}
      </div>
    </div>
  )
}

function DismissableCard({ onDismiss, children }) {
  const [gone, setGone] = useState(false)

  function dismiss() {
    setGone(true)
    setTimeout(onDismiss, 200)
  }

  return (
    <div
      className="card-wrapper"
      style={{
        position: 'relative',
        opacity: gone ? 0 : 1,
        transform: gone ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
    >
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); dismiss() }}
        className="dismiss-btn"
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          zIndex: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '1.4rem',
          height: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
      {children}
    </div>
  )
}

function ApodCard({ apod }) {
  return (
    <a href={apod.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="daily-card" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {apod.image_url && (
          <div style={{ height: '160px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={apod.image_url} alt={apod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ background: '#0b3d91', color: '#fff', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.1rem 0.4rem', borderRadius: '2px', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            NASA · APOD
          </span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{apod.title}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>{apod.explanation}…</p>
        </div>
      </div>
    </a>
  )
}

function WikiCard({ wiki }) {
  return (
    <a href={wiki.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="daily-card" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {wiki.thumbnail && (
          <div style={{ height: '160px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={wiki.thumbnail} alt={wiki.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ background: '#636466', color: '#fff', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.1rem 0.4rem', borderRadius: '2px', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Wikipedia · Today
          </span>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{wiki.title}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>{wiki.extract}</p>
        </div>
      </div>
    </a>
  )
}
