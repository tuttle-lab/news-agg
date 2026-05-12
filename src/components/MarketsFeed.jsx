import { useTickers } from '../hooks/useTickers'
import { useChart }   from '../hooks/useChart'

// ── FRED embed config ──────────────────────────────────────
// Get graph IDs: fred.stlouisfed.org → open any chart → Share → Add to your website → copy the g= value
const FRED_GRAPHS = [
  { id: 'T93G',  title: 'Federal Funds Rate'    },
  { id: 'cfXm',  title: 'Unemployment Rate'     },
  { id: '1jRmh', title: 'CPI (Inflation)'       },
  { id: 'iq8LV', title: '10-Year Treasury Yield' },
]

const EQUITY_SYMBOLS = ['SPY', 'VOO', 'JPM', 'NVDA', 'BTC']

// ── Mini spark chart (SVG, no deps) ───────────────────────
const W = 400, H = 110, PAD = { t: 8, r: 8, b: 22, l: 44 }

function SparkChart({ points }) {
  if (!points || points.length < 2) return (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
      No data
    </div>
  )

  const vals  = points.map(p => p.v)
  const ts    = points.map(p => p.t)
  const minV  = Math.min(...vals), maxV = Math.max(...vals)
  const minT  = Math.min(...ts),   maxT = Math.max(...ts)
  const rangeV = maxV - minV || 1
  const rangeT = maxT - minT || 1

  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  const px = t => PAD.l + ((t - minT) / rangeT) * iw
  const py = v => PAD.t + (1 - (v - minV) / rangeV) * ih

  const polyPts = points.map(p => `${px(p.t)},${py(p.v)}`).join(' ')
  const areaPath = `M${px(points[0].t)},${py(points[0].v)} ` +
    points.slice(1).map(p => `L${px(p.t)},${py(p.v)}`).join(' ') +
    ` L${px(points[points.length-1].t)},${PAD.t+ih} L${px(points[0].t)},${PAD.t+ih} Z`

  const dayLines = []
  let lastDay = null
  for (const p of points) {
    const day = new Date(p.t * 1000).toLocaleDateString(undefined, { weekday: 'short' })
    if (day !== lastDay) { dayLines.push({ x: px(p.t), label: day }); lastDay = day }
  }

  const mid   = (minV + maxV) / 2
  const fmt   = v => v >= 1000 ? `$${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`
  const last  = points[points.length - 1]
  const trend = vals[vals.length - 1] >= vals[0] ? 'var(--success)' : 'var(--error)'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`cg-${last.t}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={trend} stopOpacity="0.3" />
          <stop offset="100%" stopColor={trend} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#cg-${last.t})`} />
      {dayLines.map((dl, i) => i === 0 ? null : (
        <g key={i}>
          <line x1={dl.x} y1={PAD.t} x2={dl.x} y2={PAD.t+ih} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={dl.x+3} y={PAD.t+ih+14} fontSize="9" fill="var(--text-muted)">{dl.label}</text>
        </g>
      ))}
      {dayLines[0] && <text x={dayLines[0].x} y={PAD.t+ih+14} fontSize="9" fill="var(--text-muted)">{dayLines[0].label}</text>}
      <polyline points={polyPts} fill="none" stroke={trend} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={px(last.t)} cy={py(last.v)} r="3" fill={trend} />
      {[minV, mid, maxV].map((v, i) => (
        <text key={i} x={PAD.l-4} y={py(v)+3} fontSize="9" fill="var(--text-muted)" textAnchor="end">{fmt(v)}</text>
      ))}
    </svg>
  )
}

// ── Single equity card ─────────────────────────────────────
function EquityCard({ symbol, tickerData }) {
  const { data, loading } = useChart(symbol)

  const info  = tickerData?.tickers?.[symbol === 'BTC' ? 'BTC' : symbol]
  const price = info?.price
  const chg   = info?.change_pct
  const up    = chg != null && chg >= 0

  const priceStr = price == null
    ? '—'
    : symbol === 'BTC'
      ? `$${Math.round(price).toLocaleString()}`
      : `$${price.toFixed(2)}`

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>{symbol}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1rem' }}>{priceStr}</span>
        {chg != null && (
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: up ? 'var(--success)' : 'var(--error)', marginLeft: 'auto' }}>
            {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
          </span>
        )}
      </div>
      {loading
        ? <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Loading…</div>
        : <SparkChart points={data?.points ?? []} />
      }
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right' }}>5d · hourly</div>
    </div>
  )
}

// ── FRED embed card ────────────────────────────────────────
function FredCard({ id, title }) {
  if (!id) return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: '0.8rem', minHeight: '300px',
    }}>
      Configure graph ID
    </div>
  )

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ background: '#c8102e', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', padding: '0.1rem 0.4rem', borderRadius: '2px', textTransform: 'uppercase' }}>
          FRED
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{title}</span>
        <a
          href={`https://fred.stlouisfed.org/graph/?g=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}
        >
          ↗ FRED
        </a>
      </div>
      <iframe
        src={`https://fred.stlouisfed.org/graph/graph-landing.php?g=${id}&width=600&height=300`}
        style={{ width: '100%', height: '300px', border: 'none', display: 'block' }}
        scrolling="no"
        loading="lazy"
        title={title}
      />
    </div>
  )
}

// ── Section label ──────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.6rem' }}>
      {children}
    </p>
  )
}

// ── Main component ─────────────────────────────────────────
export function MarketsFeed() {
  const { data: tickerData } = useTickers()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div>
        <SectionLabel>Equities · 5-day</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {EQUITY_SYMBOLS.map(sym => (
            <EquityCard key={sym} symbol={sym} tickerData={tickerData} />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Macro · FRED</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {FRED_GRAPHS.map(g => (
            <FredCard key={g.id || g.title} id={g.id} title={g.title} />
          ))}
        </div>
      </div>

    </div>
  )
}
