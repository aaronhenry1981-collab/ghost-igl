import { useState } from 'react'
import { Link } from 'react-router-dom'
import { normalizeYoutubeUrl } from '../../../lambda/customer-success/support/youtube-url.mjs'
import { createLiveSupportTransport, errorMessage } from '../../features/support/supportApi'

const transport = createLiveSupportTransport()

export default function YoutubeSubmission() {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError(''); setReceipt(null)
    let normalized
    try { normalized = normalizeYoutubeUrl(url).url } catch (err) { setError(err.message); return }
    setBusy(true)
    try {
      const saved = await transport.request('POST', '/cs/me/support/youtube-vods', { body: { url: normalized } })
      if (!/^R6-\d+$/.test(saved.caseNumber || '')) throw new Error('Submission status is uncertain. Check My Support cases before retrying.')
      setReceipt(saved)
    } catch (err) {
      setError(`${errorMessage(err, 'Could not save your link.')} Check My Support cases if the request timed out; retrying the same video reuses its request.`)
    } finally { setBusy(false) }
  }
  return <section aria-labelledby="youtube-review-title" style={{ marginBottom: '2rem' }}>
    <h2 id="youtube-review-title">Send a YouTube replay</h2>
    <p>Submit a public or unlisted Siege video link to Support for manual review. This does not run video analysis or use a screenshot review. Review availability and timing are not guaranteed.</p>
    <form onSubmit={submit}>
      <label htmlFor="youtube-review-url">YouTube video link</label>
      <div className="link-input-wrap">
        <input id="youtube-review-url" className="link-input" type="url" required maxLength={2048} placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={event => { setUrl(event.target.value); setReceipt(null) }} disabled={busy} aria-describedby="youtube-review-help" />
        <button className="link-input-btn" type="submit" disabled={busy || !url.trim()}>{busy ? 'Saving link…' : 'Submit for manual review'}</button>
      </div>
      <p id="youtube-review-help">Use a video you own or have permission to share. Private videos cannot be viewed by the reviewer. Extra link parameters, including timestamps, are removed.</p>
    </form>
    {error && <p role="alert">{error}</p>}
    {receipt && <p role="status">{receipt.replayed ? 'This link already has a request.' : 'Link saved for manual review.'} No video analysis has run. <Link to={`/support/cases/${receipt.caseNumber}`}>Open request {receipt.caseNumber}</Link>.</p>}
    <Link to="/support">My Support cases</Link>
  </section>
}
