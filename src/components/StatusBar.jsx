/* global __APP_VERSION__ */

export function StatusBar({ theme }) {
  const now = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '0.5rem 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>NEWS-AGG v{__APP_VERSION__} · tuttle-lab</span>
        <span>theme:{theme} · {now}</span>
      </div>
    </footer>
  )
}
