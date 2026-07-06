import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: 480,
            padding: '2rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Something broke on this page</h2>
            <p style={{ color: 'rgba(230,233,239,0.6)', marginBottom: '1.25rem' }}>
              The page hit an unexpected error. Try reloading. If it keeps happening,
              email <a href="mailto:support@r6coaching.com" style={{ color: '#00f5ff' }}>support@r6coaching.com</a> with
              what you were doing.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#00f5ff',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            {import.meta.env.DEV && (
              <pre style={{
                marginTop: '1.25rem',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: '#ffb3a6',
                textAlign: 'left',
                overflow: 'auto',
              }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
