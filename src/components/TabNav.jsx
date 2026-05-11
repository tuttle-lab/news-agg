export function TabNav({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--border)',
      marginBottom: '1.25rem',
      gap: '0',
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
