import { useDaily } from '../hooks/useDaily'

export function DailySection() {
  const { data, loading } = useDaily()

  if (loading) return null
  if (!data?.apod && !data?.wiki) return null

  return (
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Today · {data.date}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
        {data.apod && <ApodCard apod={data.apod} />}
        {data.wiki && <WikiCard wiki={data.wiki} />}
      </div>
    </div>
  )
}

function ApodCard({ apod }) {
  return (
    <a href={apod.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="daily-card" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {apod.image_url && (
          <div style={{ height: '160px', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={apod.image_url}
              alt={apod.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              background: '#0b3d91',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '0.1rem 0.4rem',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>NASA · APOD</span>
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{apod.title}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>
            {apod.explanation}…
          </p>
        </div>
      </div>
    </a>
  )
}

function WikiCard({ wiki }) {
  return (
    <a href={wiki.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="daily-card" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        {wiki.thumbnail && (
          <div style={{ height: '160px', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={wiki.thumbnail}
              alt={wiki.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              background: '#636466',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '0.1rem 0.4rem',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}>Wikipedia · Today</span>
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{wiki.title}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>
            {wiki.extract}
          </p>
        </div>
      </div>
    </a>
  )
}
