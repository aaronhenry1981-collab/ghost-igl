import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAdminData, useAdminResource } from '../AdminData'
import { adminSend } from '../adminFetch'
import { findMember, fullNameOf, nameStatusOf, NAME_STATUS_LABELS } from '../memberDirectory.mjs'
import {
  PLAN_LABELS, accountStateLabel, billingLabel, formatDate, formatDateTime, formatLastSeen, formatMoney, nameSourceLabel,
} from '../memberFormat.mjs'
import { auditDetailLines, auditLabel, auditTone, timeAgo } from '../auditFormat.mjs'
import { effectiveAccessPlan } from '../../../lib/adminBillingHealth.mjs'
import { bookingStatusLabel, isConfirmedSession } from '../../../lib/bookingDisplay'
import { Badge, CopyButton, Field, Icon, KeyValues, Notice, PageHeader, Panel, Skeleton, StateView } from '../ui'

const PLAN_TONE = { free: 'muted', pro: 'info', elite: 'bone', champion: 'accent' }
const NAME_MAX = 100

function checkNamePart(value, label) {
  const s = value.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (s.length > NAME_MAX) return `${label} must be ${NAME_MAX} characters or fewer.`
  if (s.includes('@')) return `${label} looks like an email address.`
  return null
}

export default function MemberRecordPage() {
  const { accountId: rawId } = useParams()
  const accountId = decodeURIComponent(rawId || '')
  const { users, status, error, reload, base, nowMs, patchMember } = useAdminData()
  const location = useLocation()
  const member = useMemo(() => findMember(users, accountId), [users, accountId])
  const from = location.state?.from || ''
  const back = { to: `${base}/members${from}`, state: { focus: accountId } }

  if (status === 'loading') {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Members', ...back }, { label: 'Loading…' }]} title="Loading member…" />
        <Panel><Skeleton rows={6} /></Panel>
      </>
    )
  }
  if (!member) {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Members', ...back }, { label: 'Not found' }]} title="Member not found" />
        <Panel>
          {status === 'error'
            ? <StateView kind="error" title="Members could not be loaded" onRetry={reload}>{error}</StateView>
            : <StateView kind="empty" title="No member has this account ID">The account may have been removed, or the link is out of date. <Link className="ax-link" to={back.to}>Back to members</Link></StateView>}
        </Panel>
      </>
    )
  }
  return <MemberRecord key={accountId} member={member} accountId={accountId} back={back} base={base} nowMs={nowMs} patchMember={patchMember} />
}

function MemberRecord({ member, accountId, back, base, nowMs, patchMember }) {
  const email = member.email || ''
  const name = fullNameOf(member)
  const history = useAdminResource(email ? `/admin/audit?target=${encodeURIComponent(email)}` : null, { enabled: Boolean(email) })
  const bookings = useAdminResource('/admin/bookings?all=1')
  const events = history.data?.events || []
  const removal = events.find((e) => e.action === 'user.delete') || null

  const plan = effectiveAccessPlan(member)
  const billing = billingLabel(member)
  const account = accountStateLabel(member)
  const seen = formatLastSeen(member.last_seen_at, nowMs)

  const sessions = useMemo(() => {
    const mine = (bookings.data?.bookings || []).filter((b) => String(b.customer?.email || '').toLowerCase() === email.toLowerCase() && b.status !== 'held')
    return mine.sort((a, b) => String(b.start).localeCompare(String(a.start)))
  }, [bookings.data, email])

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Members', ...back }, { label: name || email }]}
        title={name || <span className="ax-muted">No name on file</span>}
        docTitle={name || email}
        meta={
          <>
            <div className="ax-identity">
              <span className="ax-strong">{email || 'No email on file'}</span>
              {email && <CopyButton value={email} label="Copy email" />}
            </div>
            <div className="ax-badges">
              <Badge tone={PLAN_TONE[plan] || 'muted'}>{PLAN_LABELS[plan] || plan}</Badge>
              <Badge tone={billing.tone}>{billing.title}</Badge>
              <Badge tone={account.tone}>{account.title}</Badge>
              {member.is_comp && <Badge tone="info">Complimentary</Badge>}
            </div>
          </>
        }
        actions={member.stripe_customer_id && (
          <a className="ax-btn ax-btn--sm" href={`https://dashboard.stripe.com/customers/${member.stripe_customer_id}`} target="_blank" rel="noreferrer"><Icon name="external" /> Open in Stripe</a>
        )}
      />

      {removal && (
        <Notice tone="warning" title="Removed in the console.">
          This account was removed on {formatDate(removal.timestamp)}. Its remaining records are preserved unchanged until someone decides what to do with them, so editing is turned off.
        </Notice>
      )}

      <div className="ax-record">
        <div className="ax-record__main">
          <IdentityPanel member={member} locked={Boolean(removal)} onSaved={(fields) => { patchMember(accountId, fields); history.reload() }} />

          <Panel title="Access">
            <KeyValues columns={2} items={[
              { label: 'Plan access', value: <Badge tone={PLAN_TONE[plan] || 'muted'}>{PLAN_LABELS[plan] || plan}</Badge>, hint: member.is_comp ? `Complimentary through ${formatDate(member.current_period_end)}` : null },
              { label: 'Site account', value: account.title, hint: account.detail },
              { label: 'Joined', value: formatDate(member.created_at) },
              { label: 'Last active', value: <>{seen.isActive && <span className="ax-dot" aria-hidden="true" />}{seen.label}</> },
              { label: 'Came from', value: member.referral_source || null },
              { label: 'Account ID', value: <span className="ax-mono">{accountId}</span> },
            ]} />
          </Panel>

          <Panel title="Player profile" description="What the member entered in their account.">
            <KeyValues columns={2} items={[
              { label: 'Gamer name', value: member.display_name || null },
              { label: 'Ubisoft username', value: member.r6_ubisoft_username || null },
              { label: 'Platform', value: member.platform || null },
              { label: 'Region', value: member.region || null },
              { label: 'Rank', value: member.r6_rank ? `${member.r6_rank}${member.r6_goal_rank ? ` → goal ${member.r6_goal_rank}` : ''}` : null },
              { label: 'Main role', value: member.r6_main_role || null },
              { label: 'Discord', value: member.discord_username || null },
            ]} />
          </Panel>

          <Panel
            title="Billing"
            description="From live Stripe. Plan changes, refunds and cancellations are made in Stripe so proration applies."
            actions={member.stripe_customer_id && <a className="ax-btn ax-btn--sm" href={`https://dashboard.stripe.com/customers/${member.stripe_customer_id}`} target="_blank" rel="noreferrer"><Icon name="external" /> Stripe customer</a>}
          >
            {Array.isArray(member.billing_alerts) && member.billing_alerts.length > 0 && (
              <Notice tone="danger" title="Billing needs review.">
                {Number(member.live_subscription_count) > 1 ? `${member.live_subscription_count} live subscriptions on this email. ` : ''}
                {Number(member.stripe_customer_count) > 1 ? `${member.stripe_customer_count} Stripe customer records on this email. ` : ''}
                Check Stripe before changing anything.
              </Notice>
            )}
            <KeyValues columns={2} items={[
              { label: 'Status', value: <Badge tone={billing.tone}>{billing.title}</Badge>, hint: billing.detail },
              { label: 'Price', value: member.price_amount_cents ? formatMoney(member.price_amount_cents) : null },
              { label: 'Next charge', value: member.will_renew ? formatDate(member.next_billing_at) : 'None scheduled' },
              { label: 'Payment collected', value: member.has_collected_payment == null ? null : member.has_collected_payment ? 'Yes' : 'Not yet' },
              { label: 'Stripe customer', value: member.stripe_customer_id ? <span className="ax-mono">{member.stripe_customer_id}</span> : null, hint: Number(member.stripe_customer_count) > 1 ? `${member.stripe_customer_count} customer records share this email` : null },
              { label: 'Subscription', value: member.stripe_subscription_id ? <span className="ax-mono">{member.stripe_subscription_id}</span> : null },
            ]} />
          </Panel>

          <Panel title="Coaching" description="Sessions booked with this email." bodyClassName="is-flush" actions={<Link to={`${base}/coaching`} className="ax-btn ax-btn--sm">Open coaching</Link>}>
            {bookings.status === 'loading' ? <Skeleton rows={2} />
              : bookings.status === 'error' ? <StateView kind="error" title="Bookings could not be loaded" onRetry={bookings.reload}>{bookings.error}</StateView>
                : sessions.length === 0 ? <StateView kind="empty" title="No coaching sessions">Nothing has been booked with {email}.</StateView>
                  : (
                    <div className="ax-table-wrap">
                      <table className="ax-table">
                        <thead><tr><th scope="col">When</th><th scope="col">Session</th><th scope="col">Status</th></tr></thead>
                        <tbody>
                          {sessions.map((b) => (
                            <tr key={b.slotId}>
                              <td className="ax-num">{formatDateTime(b.start)}</td>
                              <td>{b.sessionType || 'Coaching session'}{b.type === 'included' && <small>Included with membership</small>}</td>
                              <td><Badge tone={isConfirmedSession(b) ? 'ok' : b.status === 'completed' ? 'muted' : 'info'}>{bookingStatusLabel(b, nowMs)}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
          </Panel>
        </div>

        <div className="ax-record__side">
          <Panel title="History" description="Audited admin changes to this member.">
            {history.status === 'loading' ? <Skeleton rows={3} />
              : history.status === 'error' ? <StateView kind="error" compact title="History could not be loaded" onRetry={history.reload}>{history.error}</StateView>
                : events.length === 0 ? <StateView kind="empty" compact title="No admin changes recorded" />
                  : (
                    <ol className="ax-timeline">
                      {events.map((e) => (
                        <li key={e.id}>
                          <p className="ax-timeline__title"><Badge tone={auditTone(e.action)}>{auditLabel(e.action)}</Badge></p>
                          <p className="ax-timeline__meta">{formatDateTime(e.timestamp)} · {timeAgo(e.timestamp, nowMs)} · by {e.actor || 'system'}</p>
                          {auditDetailLines(e.details).map((line) => <p key={line} className="ax-timeline__meta">{line}</p>)}
                        </li>
                      ))}
                    </ol>
                  )}
          </Panel>

          <Panel title="Danger zone" tone="danger">
            <p className="ax-help">Account deletion is not run from the console. A deletion request is completed with the privacy tool, which removes sign-in, profile, membership rows, player data, coaching and support records and verifies every removal (see docs/PRIVACY-REQUESTS.md).</p>
            <p className="ax-help">Cancellations and refunds are made in Stripe.</p>
            <div className="ax-btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="ax-btn ax-btn--danger ax-btn--sm" disabled title="Deletion runs through the privacy tool">
                <Icon name="lock" /> Delete account
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

function IdentityPanel({ member, locked, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first: member.first_name || '', last: member.last_name || '' })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const nameStatus = nameStatusOf(member)
  const review = Array.isArray(member.name_review) ? member.name_review : []
  const errors = { first: checkNamePart(form.first, 'First name'), last: checkNamePart(form.last, 'Last name') }
  const unchanged = form.first.trim() === (member.first_name || '') && form.last.trim() === (member.last_name || '')

  function startEdit(prefill) {
    setForm(prefill || { first: member.first_name || '', last: member.last_name || '' })
    setResult(null)
    setEditing(true)
  }

  async function save(e) {
    e.preventDefault()
    if (errors.first || errors.last || locked) return
    setSaving(true)
    setResult(null)
    try {
      const r = await adminSend('/admin/users/name', 'POST', { email: member.email, first_name: form.first, last_name: form.last })
      onSaved({ first_name: r.first_name, last_name: r.last_name, name_source: r.name_source, name_updated_at: r.name_updated_at, name_review: r.name_review })
      setEditing(false)
      setResult({ tone: 'ok', text: 'Name saved. Email, billing and access were not changed.' })
    } catch (err) {
      setResult({ tone: 'danger', text: `Name not saved: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="Identity"
      description="Names are for display and search only. The email stays the sign-in and billing identity."
      actions={!editing && !locked && <button type="button" className="ax-btn ax-btn--sm" onClick={() => startEdit()}><Icon name="edit" /> Edit name</button>}
     
    >
      {result && <Notice tone={result.tone} onDismiss={() => setResult(null)}>{result.text}</Notice>}
      {editing ? (
        <form onSubmit={save} className="ax-form-stack" noValidate>
          <div className="ax-form-grid ax-form-grid--2">
            <Field label="First name" error={errors.first}>
              <input className="ax-input" value={form.first} maxLength={NAME_MAX + 20} autoComplete="off" onChange={(e) => setForm({ ...form, first: e.target.value })} aria-invalid={Boolean(errors.first)} autoFocus />
            </Field>
            <Field label="Last name" hint="Leave empty for a member who uses one name." error={errors.last}>
              <input className="ax-input" value={form.last} maxLength={NAME_MAX + 20} autoComplete="off" onChange={(e) => setForm({ ...form, last: e.target.value })} aria-invalid={Boolean(errors.last)} />
            </Field>
          </div>
          <div className="ax-btn-row">
            <button type="submit" className="ax-btn ax-btn--primary ax-btn--sm" disabled={saving || unchanged || Boolean(errors.first || errors.last)}>{saving ? 'Saving…' : 'Save name'}</button>
            <button type="button" className="ax-btn ax-btn--sm ax-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <span className="ax-muted" style={{ fontSize: '0.75rem' }}>Saved to this member only; audited with before and after.</span>
          </div>
        </form>
      ) : (
        <KeyValues columns={2} items={[
          { label: 'First name', value: member.first_name || null },
          { label: 'Last name', value: member.last_name || (member.first_name ? <span className="ax-muted">Single name</span> : null) },
          { label: 'Name status', value: <Badge tone={nameStatus === 'complete' ? 'ok' : nameStatus === 'single' ? 'info' : 'warning'}>{NAME_STATUS_LABELS[nameStatus]}</Badge> },
          { label: 'Name source', value: nameSourceLabel(member.name_source), hint: member.name_updated_at ? `Updated ${formatDate(member.name_updated_at)}` : null },
          { label: 'Email', value: member.email, hint: 'Not editable here' },
          { label: 'Gamer name', value: member.display_name || null, hint: member.display_name ? 'Not used as a real name' : null },
        ]} />
      )}
      {nameStatus === 'review' && review.length > 0 && !editing && (
        <div className="ax-review">
          <p className="ax-strong" style={{ fontSize: '0.8125rem' }}>Possible names to confirm</p>
          <p className="ax-help">Found in linked records but not applied automatically, because it is unclear which part is the first or last name, or the records disagree.</p>
          <ul>
            {review.map((c) => (
              <li key={`${c.source}-${c.value}`}>
                <span><span className="ax-strong">{c.value}</span> <span className="ax-muted">· {c.source === 'stripe' ? 'Stripe customer' : c.source === 'cognito' ? 'Sign-up record' : c.source} · {c.reason}</span></span>
                {!locked && <button type="button" className="ax-btn ax-btn--sm" onClick={() => startEdit({ first: c.value, last: '' })}>Review and edit</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
