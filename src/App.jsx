import { useState } from 'react'
import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { TickerBar } from './components/TickerBar'
import { TabNav } from './components/TabNav'
import { DailySection } from './components/DailySection'
import { NewsFeed } from './components/NewsFeed'
import { PodcastFeed } from './components/PodcastFeed'

const TABS = [
  { id: 'news',     label: 'News' },
  { id: 'podcasts', label: 'Podcasts' },
]

export default function App() {
  const { theme, setTheme, themes } = useTheme()
  const [tab, setTab] = useState('news')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />
      <TickerBar />

      <main className="container" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        {tab === 'news' && <DailySection />}

        <div style={{ marginTop: tab === 'news' ? '1.25rem' : 0 }}>
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
          {tab === 'news'     && <NewsFeed />}
          {tab === 'podcasts' && <PodcastFeed />}
        </div>
      </main>
    </div>
  )
}
