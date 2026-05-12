import { useState } from 'react'
import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { useSaved } from './hooks/useSaved'
import { Header } from './components/Header'
import { TickerBar } from './components/TickerBar'
import { TabNav } from './components/TabNav'
import { DailySection } from './components/DailySection'
import { NewsFeed } from './components/NewsFeed'
import { PodcastFeed } from './components/PodcastFeed'
import { SavedFeed } from './components/SavedFeed'
import { MarketsFeed } from './components/MarketsFeed'
import { StatusBar } from './components/StatusBar'

export default function App() {
  const { theme, setTheme, themes } = useTheme()
  const { saved, save, unsave, isSaved } = useSaved()
  const [tab, setTab] = useState('news')

  const tabs = [
    { id: 'news',     label: 'News' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'markets',  label: 'Markets' },
    { id: 'saved',    label: saved.length ? `Saved (${saved.length})` : 'Saved' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />
      <TickerBar />

      <main className="container" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        {tab === 'news' && <DailySection />}

        <div style={{ marginTop: tab === 'news' ? '1.25rem' : 0 }}>
          <TabNav tabs={tabs} active={tab} onChange={setTab} />
          {tab === 'news'     && <NewsFeed onSave={save} isSaved={isSaved} />}
          {tab === 'podcasts' && <PodcastFeed onSave={save} />}
          {tab === 'markets'  && <MarketsFeed />}
          {tab === 'saved'    && <SavedFeed saved={saved} unsave={unsave} isSaved={isSaved} onSave={save} />}
        </div>
      </main>

      <StatusBar theme={theme} />
    </div>
  )
}
