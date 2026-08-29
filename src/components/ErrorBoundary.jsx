import { Component } from 'react'
import './ErrorBoundary.css'

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
        <main className="page-recovery" aria-labelledby="page-recovery-title">
          <section className="page-recovery-card">
            <div className="page-recovery-mark" aria-hidden="true"><span>R6</span></div>
            <span className="page-recovery-kicker">Round interrupted</span>
            <h1 id="page-recovery-title">This page did not finish loading</h1>
            <p>
              Your account is safe. Try the page once more, return to your next task, or send us the page name if it keeps happening.
            </p>
            <div className="page-recovery-actions">
              <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try this page again</button>
              <a className="btn btn-outline" href="/dashboard">Go to dashboard</a>
              <a className="btn btn-ghost" href="mailto:support@r6coaching.com?subject=Recon%206%20page%20error">Report the problem</a>
            </div>
            {import.meta.env.DEV && (
              <pre className="page-recovery-debug">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
