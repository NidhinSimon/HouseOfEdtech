export function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '24px 0',
      borderTop: '1px solid var(--border-color)',
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <p>Built by <strong>Nidhin</strong></p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="https://github.com/NidhinSimon"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            GitHub Profile
          </a>
          <a
            href="https://www.linkedin.com/in/nidhinsimon/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}
          >
            LinkedIn Profile
          </a>
        </div>
      </div>
    </footer>
  );
}
