import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'
const W = 500, H = 140, PAD = { t: 10, r: 10, b: 28, l: 48 }

function SparkChart({ points }) {
  if (!points || points.length < 2) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      No data
    </div>
  )

  const vals = points.map(p => p.v)
  const ts   = points.map(p => p.t)
  const minV = Math.min(...vals), maxV = Math.max(...vals)
  const minT = Math.min(...ts),   maxT = Math.max(...ts)
  const rangeV = maxV - minV || 1
  const rangeT = maxT - minT || 1

  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  function px(t) { return PAD.l + ((t - minT) / rangeT) * iw }
  function py(v) { return PAD.t + (1 - (v - minV) / rangeV) * ih }

  const polyPts = points.map(p => `${px(p.t)},${py(p.v)}`).join(' ')
  const areaPath = `M${px(points[0].t)},${py(points[0].v)} ` +
    points.slice(1).map(p => `L${px(p.t)},${py(p.v)}`).join(' ') +
    ` L${px(points[points.length-1].t)},${PAD.t+ih} L${px(points[0].t)},${PAD.t+ih} Z`

  // Day boundary lines
  const dayLines = []
  let lastDay = null
  for (const p of points) {
    const d = new Date(p.t * 1000)
    const day = d.toLocaleDateString(undefined, { weekday: 'short' })
    if (day !== lastDay) {
      dayLines.push({ x: px(p.t), label: day })
      lastDay = day
    }
  }

  // Y-axis labels
  const mid = (minV + maxV) / 2
  const fmt = (v) => v >= 1000 ? `$${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`

  const last = points[points.length - 1]
  const trend = vals[vals.length-1] >= vals[0] ? 'var(--success)' : 'var(--error)'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trend} stopOpacity="0.35" />
          <stop offset="100%" stopColor={trend} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Area */}
      <path d={areaPath} fill="url(#cg)" />

      {/* Day separators */}
      {dayLines.map((dl, i) => i === 0 ? null : (
        <g key={i}>
          <line x1={dl.x} y1={PAD.t} x2={dl.x} y2={PAD.t+ih} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={dl.x + 3} y={PAD.t+ih+14} fontSize="9" fill="var(--text-muted)">{dl.label}</text>
        </g>
      ))}
      {dayLines[0] && (
        <text x={dayLines[0].x} y={PAD.t+ih+14} fontSize="9" fill="var(--text-muted)">{dayLines[0].label}</text>
      )}

      {/* Line */}
      <polyline points={polyPts} fill="none" stroke={trend} strokeWidth="1.5" strokeLinejoin="round" />

      {/* Current price dot */}
      <circle cx={px(last.t)} cy={py(last.v)} r="3" fill={trend} />

      {/* Y-axis labels */}
      {[minV, mid, maxV].map((v, i) => (
        <text key={i} x={PAD.l - 4} y={py(v) + 3} fontSize="9" fill="var(--text-muted)" textAnchor="end">{fmt(v)}</text>
      ))}
    </svg>
  )
}

export function ChartModal({ symbol, onClose }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`${API}/chart/${symbol}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ error: 'Failed to load', points: [] }))
  }, [symbol])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const last = data?.points?.[data.points.length - 1]
  const first = data?.points?.[0]
  const changePct = last && first ? ((last.v - first.v) / first.v * 100) : null
  const up = changePct != null && changePct >= 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
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
          padding: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>{symbol}</span>
            {last && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700 }}>
                {symbol === 'BTC'
                  ? `$${Math.round(last.v).toLocaleString()}`
                  : `$${last.v.toFixed(2)}`}
              </span>
            )}
            {changePct != null && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: up ? 'var(--success)' : 'var(--error)' }}>
                {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>5d</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.3rem', lineHeight: 1 }}
          >×</button>
        </div>

        {!data && (
          <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Loading…
          </div>
        )}
        {data && <SparkChart points={data.points} />}
      </div>
    </div>
  )
}
