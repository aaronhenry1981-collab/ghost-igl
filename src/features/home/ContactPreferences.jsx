import { useEffect, useId, useState } from 'react'

// Contact preferences. Account and billing notices always reach you;
// everything else is your choice. Marketing is off until you opt in.
export default function ContactPreferences({ api }) {
  const [prefs, setPrefs] = useState(null)
  const [state, setState] = useState({ saving: false, error: null, saved: false })
  const titleId = useId()
  const tipsId = useId()
  const newsId = useId()

  useEffect(() => {
    let cancelled = false
    api.get('/cs/me/contact-preferences')
      .then((data) => { if (!cancelled) setPrefs(data) })
      .catch((err) => { if (!cancelled) setState({ saving: false, error: err.message, saved: false }) })
    return () => { cancelled = true }
  }, [api])

  async function save(patch) {
    setState({ saving: true, error: null, saved: false })
    try {
      const next = await api.put('/cs/me/contact-preferences', patch)
      setPrefs(next)
      setState({ saving: false, error: null, saved: true })
    } catch (err) {
      setState({ saving: false, error: err.message, saved: false })
    }
  }

  return (
    <section className="ph-card" id="contact-preferences" aria-labelledby={titleId}>
      <h2 id={titleId} className="ph-card-title">Email preferences</h2>
      {!prefs && !state.error && <p className="ph-muted">Loading…</p>}
      {prefs && (
        <div className="ph-prefs">
          {prefs.doNotContact && <p className="ph-source">You asked us not to contact you. Only messages you start will get a reply.</p>}
          <label htmlFor={tipsId} className="ph-toggle">
            <input id={tipsId} type="checkbox" checked={prefs.relationship === 'subscribed'} disabled={state.saving || prefs.doNotContact} onChange={(e) => save({ relationship: e.target.checked ? 'subscribed' : 'opted_out' })} />
            <span>Coaching nudges and check-ins about your progress</span>
          </label>
          <label htmlFor={newsId} className="ph-toggle">
            <input id={newsId} type="checkbox" checked={prefs.marketing === 'opted_in'} disabled={state.saving || prefs.doNotContact} onChange={(e) => save({ marketing: e.target.checked ? 'opted_in' : 'opted_out' })} />
            <span>Offers, new features and come-back reminders</span>
          </label>
          <p className="ph-source">Account and billing notices are always sent.</p>
        </div>
      )}
      {state.error && <p className="ph-error" role="alert">{state.error}</p>}
      {state.saved && <p className="ph-source" role="status">Saved.</p>}
    </section>
  )
}
