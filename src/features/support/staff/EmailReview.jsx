import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { Ago, Chip, EmptyState, RoundInterrupted, Skeleton } from '../ui/bits'

// Why a message landed here (service recordUnmatched / email engine reasons).
const REASONS = {
  sender_unverified: ['danger', 'Sender not verified (DMARC did not pass)'],
  unverified_sender: ['danger', 'Sender not verified'],
  sender_multiple_mailboxes: ['danger', 'From header names more than one sender'],
  sender_group: ['danger', 'From header uses group syntax'],
  sender_trailing_text: ['danger', 'From header has text after the address'],
  sender_multiple_from_headers: ['danger', 'Message has more than one From header'],
  sender_unparseable: ['danger', 'From header could not be parsed'],
  sender_not_case_owner: ['danger', 'Reply token belongs to someone else’s case'],
  case_owner_mismatch: ['danger', 'Case belongs to another player'],
  contact_mismatch: ['danger', 'Sender does not match the matched player'],
  no_matching_account: ['warning', 'No account matches this address'],
  no_account: ['warning', 'No account matches this address'],
  uncertain_match: ['info', 'No confident match'],
  case_not_found: ['info', 'Referenced case not found'],
  empty_body: ['muted', 'Empty message'],
  rate_limited: ['muted', 'Daily case or message limit reached for this player'],
  invalid_sender: ['muted', 'Unparseable sender'],
}

// GET /cs/admin/support/email/unmatched -> { items: [{ id, senderEmail,
// senderVerified, subject, text, reason, suggestedCaseNumber,
// suggestedContactKey, status, receivedAt }] }. Never auto-attached: a person
// picks the case, and the email is added to it as a STAFF-ONLY event.
export default function EmailReview({ client, to }) {
  const res = useSupportResource(client, 'unmatchedEmail')
  const [done, setDone] = useState([])
  if (res.status === 'loading') return <Skeleton lines={4} label="Loading email review…" />
  if (res.status === 'error') return <RoundInterrupted message={errorMessage(res.error, "Couldn't load unmatched email.")} onRetry={res.reload} />
  const items = (res.data?.items || []).filter((i) => !done.includes(i.id))
  return (
    <div className="sc-email">
      <p className="sp-muted">Inbound mail we couldn&apos;t match with confidence. Nothing here is attached to a case until you do it by hand, and then only as a staff-only note.</p>
      {items.length === 0 ? <EmptyState title="Nothing to review">Every inbound email matched a case or was classified as automated.</EmptyState> : (
        <ul className="sc-email-list">
          {items.map((m) => <EmailItem key={m.id} m={m} client={client} to={to} onDone={() => setDone((d) => [...d, m.id])} />)}
        </ul>
      )}
    </div>
  )
}

function EmailItem({ m, client, to, onDone }) {
  const [caseNumber, setCaseNumber] = useState(m.suggestedCaseNumber || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const inputId = useId()
  const [tone, label] = REASONS[m.reason] || ['muted', String(m.reason || 'unmatched').replace(/_/g, ' ')]
  async function attach() {
    const target = caseNumber.trim().toUpperCase()
    if (!/^R6-\d{6}$/.test(target)) { setError('Enter a case number like R6-000123.'); return }
    setBusy(true)
    setError(null)
    try {
      await client.assignUnmatchedEmail(m.id, { caseNumber: target })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }
  return (
    <li className="sc-email-item">
      <header className="sc-email-head">
        <Chip tone={tone}>{label}</Chip>
        {m.senderVerified ? <Chip tone="ok">sender verified</Chip> : <Chip tone="muted">sender not verified</Chip>}
        <span className="sp-muted sp-small"><Ago at={m.receivedAt} /></span>
      </header>
      <p className="sc-email-subject">{m.subject || '(no subject)'}</p>
      <p className="sp-muted sp-small sc-wrap">From {m.senderEmail || 'unknown sender'}</p>
      <blockquote className="sc-draft-text">{m.text}</blockquote>
      {m.suggestedCaseNumber && (
        <p className="sp-small">
          Possible match (not verified): <Link to={to(`cases/${m.suggestedCaseNumber}`)} className="sp-mono sc-link">{m.suggestedCaseNumber}</Link>
          <span className="sp-muted"> · from the reply address token</span>
        </p>
      )}
      <div className="sc-email-actions">
        <label htmlFor={inputId} className="sp-visually-hidden">Attach to case number</label>
        <input id={inputId} className="sp-input" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="R6-000123" maxLength={16} />
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={attach}>{busy ? 'Attaching…' : 'Attach as staff note'}</button>
      </div>
      {!m.senderVerified && <p className="sp-note sp-note-warn">Sender failed verification. Don&apos;t act on account or billing requests from this message.</p>}
      {error && <p className="sp-field-error" role="alert">{error}</p>}
    </li>
  )
}
