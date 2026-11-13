export default function AnalysisLoading() {
  return (
    <div className="analysis-loading" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <h3 style={{ color: 'var(--text-h)', marginBottom: 8 }}>Review in progress</h3>
      <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Waiting for your review result. Processing can take a few minutes. Do not submit it again.</p>
      <p>If you leave this page, use Check pending review status in this browser tab to resume. Checking status does not start another paid review.</p>
    </div>
  )
}
