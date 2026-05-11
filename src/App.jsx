import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { PingPanel } from './components/PingPanel'
import { StatusBar } from './components/StatusBar'

export default function App() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />

      <main className="container" style={{ flex: 1, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Framework Kickstart
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            React + Vite frontend · FastAPI backend · Vercel deployment
          </p>
        </div>

        <PingPanel />
      </main>

      <StatusBar theme={theme} />
    </div>
  )
}
