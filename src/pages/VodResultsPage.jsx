import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useVodAnalysis } from '../hooks/useVodAnalysis'
import SessionResults from '../components/vod/SessionResults'
import AnalysisLoading from '../components/vod/AnalysisLoading'
import './VodPage.css'

// Authentication only: previously admitted results survive membership expiry.
// This route never offers an upload or invokes a new paid submission.
export default function VodResultsPage() {
  const { user, loading: authLoading } = useAuth()
  const { analysis, loading, error, resumeReview, savingEvidence, saveError, retrySave } = useVodAnalysis()
  if (authLoading) return <p>Checking sign-in...</p>
  if (!user) return <section className="page"><h1>Existing review result</h1><p>Sign in to the account that submitted the review.</p><Link to="/auth">Sign in</Link></section>
  return <section className="page vod-page">
    <h1>Existing review result</h1>
    <p>Check the review receipt saved in this browser tab. Membership expiry does not prevent retrieving your admitted review. This does not submit a new review.</p>
    <button type="button" className="btn btn-outline" disabled={loading} onClick={resumeReview}>Check review status</button>
    {loading && <AnalysisLoading />}
    {error && <p role="alert">{error}</p>}
    {analysis && <SessionResults analysis={analysis} />}
    {analysis?.roadmap_retry && <button type="button" disabled={savingEvidence} onClick={retrySave}>{savingEvidence ? 'Saving...' : 'Retry saving review'}</button>}
    {saveError && <p role="alert">{saveError}</p>}
    <p>Receipts expire. A failed or expired job may have used an allowance attempt; no paid retry is made automatically.</p>
    <Link to="/account">Account and saved coaching history</Link>
  </section>
}
