import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { TickerBar } from './components/TickerBar'
import { NewsFeed } from './components/NewsFeed'

export default function App() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />
      <TickerBar />

      <main className="container" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            News Feed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Reuters · AP · Hacker News · FT — refreshes every 5 min
          </p>
        </div>
        <NewsFeed />
      </main>
    </div>
  )
}
