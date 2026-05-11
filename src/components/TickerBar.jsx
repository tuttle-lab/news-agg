import { useTickers } from '../hooks/useTickers'
import { useKalshi } from '../hooks/useKalshi'

function TickerItem({ label, value, changePct, prefix = '' }) {
  const up = changePct > 0
  const down = changePct < 0
  const color = up ? 'var(--success)' : down ? 'var(--error)' : 'var(--text-muted)'
  const arrow = up ? '▲' : down ? '▼' : '●'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.2rem', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{prefix}{value != null ? value.toLocaleString() : '—'}</span>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.2rem', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>KALSHI</span>
      <span style={{ fontSize: '0.8rem', maxWidth: '18rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{market.title}</span>
      {pct != null && (
        <span style={{ fontWeight: 700, color: pct > 50 ? 'var(--success)' : 'var(--text-muted)' }}>{pct}¢</span>
      )}
    </span>
  )
}

export function TickerBar() {
  const { data: tickerData } = useTickers()
  const { data: kalshiData } = useKalshi()

  const tickers = tickerData?.tickers ?? {}
  const markets = kalshiData?.markets ?? []

  const items = (
    <>
      {tickers.SPY && (
        <TickerItem
          label="SPY"
          value={tickers.SPY.price}
          changePct={tickers.SPY.change_pct}
          prefix="$"
        />
      )}
      {tickers.BTC && (
        <TickerItem
          label="BTC"
          value={tickers.BTC.price}
          changePct={tickers.BTC.change_pct}
          prefix="$"
        />
      )}
      {markets.map(m => <KalshiItem key={m.ticker} market={m} />)}
    </>
  )

  // If nothing loaded yet, show a placeholder shimmer row
  const empty = !tickers.SPY && !tickers.BTC && markets.length === 0

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
            {/* duplicate for seamless loop */}
            {items}
          </div>
        </div>
      )}
    </div>
  )
}
