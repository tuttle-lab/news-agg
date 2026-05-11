import { useEffect } from 'react'

export function KalshiModal({ market, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const yesPct  = market.yes_price != null ? Math.round(market.yes_price * 100) : null
  const noPct   = market.no_price  != null ? Math.round(market.no_price  * 100) : null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <span style={{
              display: 'inline-block',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              padding: '0.1rem 0.5rem',
              borderRadius: '2px',
              marginBottom: '0.5rem',
            }}>
              KALSHI
            </span>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
              {market.title}
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              {market.ticker}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1,
              padding: '0.1rem', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Single implied probability bar */}
        {yesPct != null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Implied probability</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: yesPct >= 66 ? 'var(--success)' : yesPct >= 34 ? '#f59e0b' : 'var(--error)' }}>
                {yesPct}%
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${yesPct}%`, height: '100%', borderRadius: '4px',
                background: yesPct >= 66 ? 'var(--success)' : yesPct >= 34 ? '#f59e0b' : 'var(--error)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {market.volume != null && market.volume > 0 && (
            <Stat label="Volume" value={`$${Number(market.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          )}
          {yesPct != null && (
            <Stat label="Yes price" value={`${yesPct}¢`} />
          )}
        </div>

        {/* CTA */}
        <a
          href={market.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          View on Kalshi →
        </a>
      </div>
    </div>
  )
}

function ProbBar({ label, pct, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{label}</div>
      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{value}</div>
    </div>
  )
}
