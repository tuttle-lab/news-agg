import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { TickerBar } from './components/TickerBar'
import { DailySection } from './components/DailySection'
import { NewsFeed } from './components/NewsFeed'

export default function App() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />
      <TickerBar />

      <main className="container" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <DailySection />

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <NewsFeed />
        </div>
      </main>
    </div>
  )
}
