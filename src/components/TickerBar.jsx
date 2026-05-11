import { useTickers } from '../hooks/useTickers'
import { useKalshi } from '../hooks/useKalshi'

const TICKER_ORDER = ['SPY', 'VOO', 'JPM', 'NVDA', 'BTC']

function TickerItem({ label, value, changePct }) {
  const up = changePct > 0
  const down = changePct < 0
  const color = up ? 'var(--success)' : down ? 'var(--error)' : 'var(--text-muted)'
  const arrow = up ? '▲' : down ? '▼' : '●'

  const formatted = value == null ? '—'
    : label === 'BTC'
      ? `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.2rem', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{formatted}</span>
      {changePct != null && (
        <span style={{ color, fontSize: '0.75rem', fontWeight: 600 }}>
          {arrow} {Math.abs(changePct).toFixed(2)}%
        </span>
      )}
    </span>
  )
}

function KalshiItem({ market }) {
  const pct = market.yes_price != null ? Math.round(market.yes_price * 100) : null
  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.2rem', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
        <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>KALSHI</span>
        <span style={{ fontSize: '0.8rem' }}>{market.title}</span>
        {pct != null && (
          <span style={{ fontWeight: 700, color: pct > 50 ? 'var(--success)' : 'var(--text-muted)' }}>{pct}¢</span>
        )}
      </span>
    </a>
  )
}

export function TickerBar() {
  const { data: tickerData } = useTickers()
  const { data: kalshiData } = useKalshi()

  const tickers = tickerData?.tickers ?? {}
  const markets = kalshiData?.markets ?? []

  const stockItems = TICKER_ORDER
    .filter(sym => tickers[sym])
    .map(sym => (
      <TickerItem key={sym} label={sym} value={tickers[sym].price} changePct={tickers[sym].change_pct} />
    ))

  const kalshiItems = markets.map(m => <KalshiItem key={m.ticker} market={m} />)

  const empty = stockItems.length === 0 && kalshiItems.length === 0

  const items = <>{stockItems}{kalshiItems}</>

  return (
    <div style={{
      position: 'sticky',
      top: '2.75rem',
      zIndex: 100,
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: '2.2rem',
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.82rem',
    }}>
      {empty ? (
        <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Loading market data…
        </span>
      ) : (
        <div className="ticker-scroll">
          <div className="ticker-track">
            {items}
            {items}
          </div>
        </div>
      )}
    </div>
  )
}
