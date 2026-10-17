import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authedFetch } from '../hooks/useTestimonials'
import './TestimonialPage.css'

export default function TestimonialPage() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(null)
  const { user, loading } = useAuth()
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const form = new FormData(event.currentTarget)
      const body = Object.fromEntries(['name', 'text', 'outcome', 'rank', 'hours', 'email', 'displayPreference', 'website'].map(k => [k, form.get(k) || '']))
      for (const field of ['quoteConsent', 'honestExperience']) body[field] = form.get(field) === 'on'
      const data = await authedFetch('/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setReceipt(data.id)
    } catch (err) { setError(err.message || 'Your story was not saved. Please try again.') }
    finally { setBusy(false) }
  }
  return <div className="testimonial-form-page">
    <h1>Share your Recon 6 experience</h1>
    <p>What helped, what did not, and what changed in your Siege matches? Honest feedback is welcome. No rank gain or positive review is required.</p>
    {loading ? <p role="status">Checking your sign-in...</p> : !user ? <section><p>Sign in with your Recon 6 account to send your story. We will return you to this form. A paid plan is not required.</p><a href="/auth?mode=signin&amp;redirect=%2Ftestimonial" className="btn btn-primary">Sign in to share your experience</a></section> : receipt ? <section role="status"><h2>Saved for review</h2><p>Thank you. Nothing has been published. Aaron will review your story and permissions first.</p><p>Keep this reference for corrections or removal: <code>{receipt}</code>.</p><a href="/strats/bank/ceo/defense" className="btn btn-primary">Open the free Bank defense</a></section> :
      <form onSubmit={submit}>
        <label>How should your name appear?<select name="displayPreference" defaultValue="gamertag"><option value="gamertag">Gamertag</option><option value="first_name">First name only</option><option value="initials">Initials only</option></select></label>
        <label>Display name<input name="name" required maxLength={60} autoComplete="off" /><small>Enter only the name or initials you want shown. No full legal name needed.</small></label>
        <label>Your experience<textarea name="text" required minLength={20} maxLength={500} rows={5} /><small>20–500 characters. Describe what you actually used and how it felt.</small></label>
        <label>What changed, if anything? (optional)<textarea name="outcome" maxLength={300} rows={3} /><small>A better decision, a clearer plan, or no change yet are all valid.</small></label>
        <label>Rank context (optional)<input name="rank" maxLength={40} placeholder="Current rank, or a change you actually observed" /></label>
        <label>Siege play time (optional)<input name="hours" maxLength={20} placeholder="For example, about 200 hours" /></label>
        <label>Email for follow-up (optional)<input name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} /><small>Private; never displayed with your story.</small></label>
        <p>Photo follow-up is optional. This form accepts text only. If you want to add a photo later, contact Aaron with your submission reference; publication would require separate permission.</p>
        <label className="testimonial-check"><input name="honestExperience" type="checkbox" required />This describes my own experience with Recon 6.</label>
        <label className="testimonial-check"><input name="quoteConsent" type="checkbox" />Recon 6 may publish my display name, quote and optional rank/play-time context on its website after review. If unchecked, this is private feedback.</label>

        <label className="testimonial-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <p className="testimonial-privacy">Your submission and verified account ID are stored for review. Account ID, email, permissions and unpublished feedback stay private. You can request correction or removal using your reference via <a href="/about#contact">Contact</a>. See our <a href="/privacy">privacy policy</a>. No submission is published automatically.</p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Send for review'}</button>
      </form>}
  </div>
}
