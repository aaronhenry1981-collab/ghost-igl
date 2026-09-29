import { useState, useEffect, useCallback } from 'react'
import { adminFetch, adminSend } from '../../features/admin/adminFetch'
import { Badge, Field, Notice, Panel, Skeleton, StateView } from '../../features/admin/ui'

// Comp account manager — grant time-limited Pro/Elite/Champion access without
// charging, then convert to paid or revoke when the trial ends.
//
// Use cases: influencer trials, Discord giveaways, refunds-in-progress,
// support cases, beta testers. Comp rows have `comp: true` so MRR
// calculations exclude them — they don't pollute revenue metrics.
//
// Backend: POST /admin/comp grants, GET /admin/comps lists, POST /admin/uncomp
// revokes early. The subscription Lambda enforces expiry server-side: when
// `current_period_end` passes, the comp stops granting access automatically
// (no cron needed — checked at request time).

const DURATIONS = [
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: 'No end date', days: 0 },
]

const STATUS_TONE = { active: 'ok', expiring: 'warning', expired: 'muted', canceled: 'danger' }

export default function CompManager() {
  const [comps, setComps] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState(null)

  // Grant-form state
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('elite')
  const [durationDays, setDurationDays] = useState(90) // default 3 months — Aaron's primary use case
  const [note, setNote] = useState('')
  const [granting, setGranting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch('/admin/comps')
      setComps(data.comps || [])
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function grant(e) {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus({ tone: 'danger', text: 'Enter a valid email address.' })
      return
    }
    const friendly = DURATIONS.find((d) => d.days === durationDays)?.label || `${durationDays} days`
    if (!window.confirm(`Grant ${plan} access to ${cleanEmail} for ${friendly.toLowerCase()} without charging?`)) return
    setGranting(true)
    setStatus(null)
    try {
      const res = await adminSend('/admin/comp', 'POST', { email: cleanEmail, plan, durationDays, note: note.trim() })
      setStatus({ tone: 'ok', text: `Granted ${res.plan} to ${res.email} until ${res.current_period_end?.slice(0, 10)}.` })
      setEmail('')
      setNote('')
      await load()
    } catch (err) {
      setStatus({ tone: 'danger', text: `Grant failed: ${err.message}` })
    } finally {
      setGranting(false)
    }
  }

  async function revoke(targetEmail) {
    if (!window.confirm(`Revoke complimentary access for ${targetEmail}?\n\nThey lose access immediately. Use this when converting to a paying customer or ending a trial early.`)) return
    setStatus(null)
    try {
      await adminSend('/admin/uncomp', 'POST', { email: targetEmail })
      setStatus({ tone: 'ok', text: `Revoked complimentary access for ${targetEmail}.` })
      await load()
    } catch (err) {
      setStatus({ tone: 'danger', text: `Revoke failed: ${err.message}` })
    }
  }

  const active = comps.filter((c) => c.status === 'active' || c.status === 'expiring')
  const expired = comps.filter((c) => c.status === 'expired')
  const revoked = comps.filter((c) => c.raw_status === 'canceled')

  return (
    <Panel
      title="Complimentary access"
      description="Free Pro, Elite or Champion access for creators, giveaways, refunds in progress and testers. Excluded from revenue; access ends automatically at the end date."
    >
      {status && <Notice tone={status.tone} onDismiss={() => setStatus(null)}>{status.text}</Notice>}

      <form onSubmit={grant} className="ax-form-grid" style={{ marginBottom: 20 }}>
        <Field label="Member email">
          <input className="ax-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@example.com" autoComplete="off" />
        </Field>
        <Field label="Plan">
          <select className="ax-select" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="champion">Champion</option>
            <option value="elite">Elite</option>
            <option value="pro">Pro</option>
          </select>
        </Field>
        <Field label="Duration">
          <select className="ax-select" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}>
            {DURATIONS.map((d) => <option key={d.days} value={d.days}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Reason (kept in the audit log)">
          <input className="ax-input" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Creator trial" maxLength={200} />
        </Field>
        <div>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={granting}>{granting ? 'Granting…' : 'Grant access'}</button>
        </div>
      </form>

      {loading && comps.length === 0 ? <Skeleton rows={3} />
        : loadError ? <StateView kind="error" title="Complimentary access could not be loaded" onRetry={load}>{loadError}</StateView>
          : comps.length === 0 ? <StateView kind="empty" compact title="No complimentary access granted yet" />
            : (
              <>
                <CompTable title={`Active (${active.length})`} comps={active} onRevoke={revoke} showDays />
                {expired.length > 0 && <CompTable title={`Expired (${expired.length})`} comps={expired} onRevoke={revoke} dimmed />}
                {revoked.length > 0 && <CompTable title={`Revoked (${revoked.length})`} comps={revoked} onRevoke={null} dimmed />}
              </>
            )}
    </Panel>
  )
}

function CompTable({ title, comps, onRevoke, showDays = false, dimmed = false }) {
  return (
    <>
      <p className="ax-subhead">{title}</p>
      {comps.length === 0 ? <p className="ax-help">None.</p> : (
        <div className="ax-table-wrap" style={{ border: '1px solid var(--ax-border)', borderRadius: 6, marginBottom: 16 }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Plan</th>
                <th scope="col">Status</th>
                {showDays && <th scope="col">Days left</th>}
                <th scope="col">Ends</th>
                <th scope="col">Reason</th>
                {onRevoke && <th scope="col"><span className="ax-sr">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {comps.map((c) => (
                <tr key={c.stripe_customer_id} className={dimmed ? 'is-dim' : ''}>
                  <td style={{ overflowWrap: 'anywhere' }}>{c.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.plan}</td>
                  <td><Badge tone={STATUS_TONE[c.status] || 'muted'}>{c.status}</Badge></td>
                  {showDays && <td className="ax-num">{c.days_remaining != null ? `${c.days_remaining}` : '—'}</td>}
                  <td className="ax-num">{c.current_period_end ? (c.current_period_end.startsWith('2099') ? 'No end date' : c.current_period_end.slice(0, 10)) : '—'}</td>
                  <td>{c.comp_note || <span className="ax-muted">—</span>}</td>
                  {onRevoke && <td className="ax-cell-actions"><button type="button" onClick={() => onRevoke(c.email)} className="ax-btn ax-btn--sm ax-btn--danger">Revoke</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
