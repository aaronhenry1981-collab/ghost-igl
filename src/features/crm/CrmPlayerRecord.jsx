import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import PlayerHome from '../home/PlayerHome'
import { useCrmResource } from './useCrmResource'
import { QueueItem } from './CrmQueue'
import { Badge, Empty, ErrorState, HealthBadge, Loading, Panel, PlanBadge, SourceStatus, StageBadge } from './crmUi'
import { billingLabel, fmtAgo, fmtDate, fmtDateTime } from './crmFormat'

function Field({ label, value, empty = 'Not provided' }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? <span className="crm-muted">{empty}</span> : value}</dd>
    </>
  )
}

function ContactPanel({ api, basePath, playerKey, email, cs, onChanged }) {
  const [reason, setReason] = useState('')
  const [state, setState] = useState({ busy: false, error: null })
  const reasonId = useId()
  const consent = cs.consent

  async function setDnc(value) {
    setState({ busy: true, error: null })
    try {
      await api.put(`/cs/admin/players/${playerKey}/contact`, { doNotContact: value, email, reason: reason || null })
      setReason('')
      onChanged()
    } catch (err) {
      setState({ busy: false, error: err.message })
    }
  }

  return (
    <Panel title="Messages, outreach and consent" action={<Link to={`${basePath}/conversations?thread=${playerKey}`} className="crm-link">Open conversation</Link>}>
      <dl className="crm-dl">
        <Field label="Coaching nudges" value={consent.relationship === 'opted_out' ? 'Opted out' : 'Subscribed'} />
        <Field label="Marketing" value={consent.marketing === 'opted_in' ? 'Opted in' : consent.marketing === 'opted_out' ? 'Opted out' : 'No consent recorded'} />
        <Field label="Do not contact" value={consent.doNotContact ? `Yes${consent.suppressedReason ? ` (${consent.suppressedReason})` : ''}` : 'No'} />
      </dl>
      <div className="crm-qitem-actions">
        <label htmlFor={reasonId} className="crm-visually-hidden">Reason for the audit log</label>
        <input id={reasonId} className="crm-input" placeholder="Reason (kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        {consent.doNotContact
          ? <button type="button" className="btn btn-ghost btn-sm" disabled={state.busy} onClick={() => setDnc(false)}>Allow contact again</button>
          : <button type="button" className="btn btn-ghost btn-sm" disabled={state.busy || !reason.trim()} onClick={() => setDnc(true)}>Mark do not contact</button>}
      </div>
      {state.error && <p className="crm-error" role="alert">{state.error}</p>}
      <h3 className="crm-subhead">Recent messages</h3>
      {cs.messages.length === 0 ? <p className="crm-muted">No messages.</p> : (
        <ul className="crm-list">
          {cs.messages.slice(-5).reverse().map((m) => (
            <li key={m.id}>
              <strong>{m.direction === 'inbound' ? 'Player' : 'Recon'}</strong> · {m.channel === 'email' ? 'email' : 'in-app'} · {fmtAgo(m.at)}
              {m.direction === 'outbound' && <span className="crm-muted"> · {m.status === 'delivered' ? 'delivered' : 'not delivered'}</span>}
              {m.direction === 'inbound' && !m.answeredAt && <Badge tone="warning">needs reply</Badge>}
              <br /><span className="crm-muted">{m.preview}</span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="crm-subhead">Outreach</h3>
      {cs.outreach.length === 0 ? <p className="crm-muted">No outreach recorded.</p> : (
        <ul className="crm-list">
          {cs.outreach.map((o) => <li key={o.key}>{o.workflowName} · <Badge tone={o.status === 'delivered' ? 'ok' : o.status === 'failed' ? 'danger' : 'neutral'}>{o.status.replace(/_/g, ' ')}</Badge> <span className="crm-muted">{fmtAgo(o.at)} · {o.triggerReason}</span></li>)}
        </ul>
      )}
    </Panel>
  )
}

const ACCESS_LABEL = {
  ok: 'Login works',
  no_account: 'No login (Stripe-only)',
  force_change_password: 'First login not finished',
  unconfirmed: 'Email not confirmed',
  reset_required: 'Password reset required',
  disabled: 'Login disabled',
  unknown: 'Unknown',
}

export default function CrmPlayerRecord({ api, basePath, playerKey }) {
  const { status, data, error, reload } = useCrmResource(api, `/cs/admin/players/${playerKey}`)
  const [showHome, setShowHome] = useState(false)
  const [decided, setDecided] = useState([])
  if (status === 'loading') return <Loading label="Loading player…" />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />

  const r = data
  const s = r.summary
  const b = r.billing
  const queue = (r.queue || []).filter((i) => !decided.includes(i.key))

  return (
    <div className="crm-stack">
      <nav aria-label="Breadcrumb" className="crm-breadcrumb"><Link to={`${basePath}/players`}>Players</Link> <span aria-hidden="true">/</span> <span>{s.name || s.displayName || 'Player'}</span></nav>

      <header className="crm-record-head">
        <div>
          <h2 className="crm-record-name">{s.name || s.displayName || s.email}</h2>
          <p className="crm-muted">{[s.displayName, s.email, s.platform?.toUpperCase(), s.rank].filter(Boolean).join(' · ')}</p>
          <div className="crm-badges">
            <PlanBadge plan={s.plan} label={s.planLabel} />
            <Badge tone={b.hasAccess ? 'ok' : 'warning'}>{billingLabel(b.status)}</Badge>
            <StageBadge stage={s.stage} label={`Stage: ${s.stageLabel}`} />
            <HealthBadge health={s.health} label={`Health: ${s.healthLabel}`} />
          </div>
        </div>
        <div className="crm-next-card">
          <span className="crm-eyebrow">Recommended next action</span>
          <strong>{s.nextAction.label}</strong>
          {s.nextAction.detail && <span className="crm-muted">{s.nextAction.detail}</span>}
          {s.nextAction.automated && <Badge tone="neutral">Automated</Badge>}
        </div>
      </header>

      {r.lifecycle.risks.length > 0 && (
        <Panel title="Why this health status">
          <ul className="crm-risks">
            {r.lifecycle.risks.map((risk) => (
              <li key={risk.code}>
                <Badge tone={risk.severity === 'critical' ? 'danger' : risk.severity === 'high' ? 'warning' : 'info'}>{risk.severity}</Badge>
                <span>{risk.reason}</span>
                {risk.evidence?.length > 0 && <span className="crm-muted"> ({risk.evidence.join('; ')})</span>}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {queue.length > 0 && (
        <div className="crm-queue">
          {queue.map((item) => <QueueItem key={item.key} item={item} api={api} basePath={basePath} compact onDecided={(it) => setDecided((d) => [...d, it.key])} />)}
        </div>
      )}

      <div className="crm-record-grid">
        <Panel title="Identity and gamer profile">
          <dl className="crm-dl">
            <Field label="Name" value={[r.identity.firstName, r.identity.lastName].filter(Boolean).join(' ')} />
            <Field label="Gamertag" value={r.identity.displayName} />
            <Field label="Platform" value={r.identity.platform} />
            <Field label="Region" value={r.identity.region} />
            <Field label="Rank → goal" value={r.identity.rank ? `${r.identity.rank}${r.identity.goalRank ? ` → ${r.identity.goalRank}` : ''}` : null} />
            <Field label="Role" value={r.identity.mainRole} />
            <Field label="Ubisoft name" value={r.identity.ubisoftUsername} />
            <Field label="Discord" value={r.identity.discord} />
            <Field label="Came from" value={r.identity.referralSource} />
            <Field label="Recon player ID" value={r.identity.reconPlayerId} />
          </dl>
        </Panel>

        <Panel title="Account access">
          <dl className="crm-dl">
            <Field label="Login" value={ACCESS_LABEL[r.access.status] || r.access.status} />
            <Field label="Account created" value={fmtDate(r.access.createdAt)} />
            <Field label="Last opened app" value={r.access.lastSeenAt ? fmtAgo(r.access.lastSeenAt) : 'Never recorded'} />
            <Field label="Profile" value={r.access.profileComplete === null ? 'Unknown' : r.access.profileComplete ? 'Complete' : 'Incomplete'} />
          </dl>
          {r.access.cognitoUsers.length > 1 && <p className="crm-warn">{r.access.cognitoUsers.length} logins share this email with different casing.</p>}
          {r.access.problems.length === 0 ? <p className="crm-ok">No access problems detected.</p> : (
            <ul className="crm-risks">{r.access.problems.map((p) => <li key={p.code}><Badge tone="danger">{p.severity}</Badge> {p.reason}</li>)}</ul>
          )}
        </Panel>

        <Panel title="Subscription and billing">
          <dl className="crm-dl">
            <Field label="Plan" value={b.available ? `${b.planLabel}${b.priceName ? ` (${b.priceName})` : ''}` : 'Unavailable'} />
            <Field label="Status" value={billingLabel(b.status)} />
            <Field label="Paid through" value={fmtDate(b.currentPeriodEnd)} />
            <Field label="Price" value={b.amount ? `$${b.amount}/${b.interval}` : null} />
            <Field label="Stripe customer" value={b.stripeCustomerId} />
          </dl>
          {b.rows.length > 0 && (
            <div className="crm-table-wrap">
              <table className="crm-table crm-table-compact">
                <thead><tr><th scope="col">Row</th><th scope="col">Plan</th><th scope="col">Status</th><th scope="col">Paid through</th></tr></thead>
                <tbody>
                  {b.rows.map((row) => (
                    <tr key={row.stripeCustomerId}>
                      <th scope="row" data-label="Row"><span className="crm-mono">{row.stripeCustomerId}</span>{row.comp && ' (comp)'}{row.trial && ' (trial)'}</th>
                      <td data-label="Plan">{row.plan}</td>
                      <td data-label="Status">{row.status}</td>
                      <td data-label="Paid through">{fmtDate(row.currentPeriodEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="crm-muted crm-small">{b.note}</p>
        </Panel>

        <Panel title={`Setup (${r.activation.done} of ${r.activation.total})`}>
          <ul className="crm-checklist">
            {r.activation.steps.map((step) => (
              <li key={step.id} className={step.done ? 'is-done' : ''}>
                <span aria-hidden="true">{step.done ? '✓' : step.done === null ? '?' : '○'}</span>
                <span>{step.label}</span>
                <span className="crm-visually-hidden">{step.done ? 'done' : step.done === null ? 'unknown' : 'not done'}</span>
              </li>
            ))}
          </ul>
          <p className="crm-muted crm-small">Player sees next: <strong>{r.customerMission.title}</strong></p>
        </Panel>

        <Panel title="Product use">
          <dl className="crm-dl">
            <Field label="VOD reviews (period)" value={r.usage.vod ? `${r.usage.vod.used}${r.usage.vod.limit ? ` of ${r.usage.vod.limit}` : ''}` : 'Not on plan'} />
            <Field label="Last VOD review" value={r.activity.vod.lastAt ? fmtDate(r.activity.vod.lastAt) : null} empty="None recorded" />
            <Field label="Round plans (7d)" value={r.activity.usageEvidence === 'recorded' ? r.activity.strategy.count7 : 'Not recorded yet'} />
            <Field label="Match prep (7d)" value={r.activity.usageEvidence === 'recorded' ? r.activity.matchPrep.count7 : 'Not recorded yet'} />
            <Field label="Live round guide (7d)" value={r.activity.usageEvidence === 'recorded' ? r.activity.liveCoach.count7 : 'Not recorded yet'} />
            <Field label="Road to Champion" value={r.roadToChampion ? `${r.roadToChampion.tasksDone}/40 · ${r.roadToChampion.currentTier?.rank || 'complete'}` : 'Not started'} />
            <Field label="Active days (14d)" value={r.activity.activeDays14} />
          </dl>
        </Panel>

        <Panel title="Coaching">
          {r.coaching.bookings.length === 0 ? <Empty>No coaching bookings.</Empty> : (
            <ul className="crm-list">
              {r.coaching.bookings.map((bk) => <li key={bk.slotId}>{fmtDateTime(String(bk.slotId).split('#')[0])} · {bk.status}{bk.type ? ` · ${bk.type}` : ''}{bk.payment ? ` · ${bk.payment}` : ''}</li>)}
            </ul>
          )}
          {r.coaching.summary?.credits !== null && r.coaching.summary?.credits !== undefined && <p className="crm-muted crm-small">{r.coaching.summary.credits} credit(s) available</p>}
        </Panel>

        <Panel title="Skill signals">
          {r.skill.vodWeaknesses.length === 0 && !r.skill.coachingWeakness ? <Empty>No VOD or coaching signals yet.</Empty> : (
            <ul className="crm-list">
              {r.skill.coachingWeakness && <li>{r.skill.coachingWeakness.value} <span className="crm-muted">(coached match)</span></li>}
              {r.skill.vodWeaknesses.map((w) => <li key={w}>{w} <span className="crm-muted">(VOD review)</span></li>)}
            </ul>
          )}
        </Panel>

        <Panel title="Referrals and past outreach">
          <dl className="crm-dl">
            <Field label="Referral code" value={r.identity.referralCode} empty="None yet" />
            <Field label="Referred by" value={r.identity.referredBy} empty="Nobody" />
            <Field label="Referred players" value={r.referrals ? r.referrals.asReferrer?.length ?? 0 : 'Unavailable'} />
            <Field label="Welcome email" value={r.legacyOutreach?.welcome_sent_at ? fmtDate(r.legacyOutreach.welcome_sent_at) : 'Not sent'} />
            <Field label="Win-back email" value={r.legacyOutreach?.winback_sent_at ? fmtDate(r.legacyOutreach.winback_sent_at) : 'Not sent'} />
          </dl>
        </Panel>
      </div>

      <ContactPanel api={api} basePath={basePath} playerKey={playerKey} email={s.email} cs={r.cs} onChanged={reload} />

      <Panel
        title="What the player sees"
        action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHome((v) => !v)} aria-expanded={showHome}>{showHome ? 'Hide' : 'View as player (read-only)'}</button>}
      >
        {showHome ? (
          <div className="crm-home-preview">
            <PlayerHome state={{ status: 'ready', view: r.homePreview, error: null, reload: () => {}, authLoading: false, signedIn: true }} preview />
          </div>
        ) : <p className="crm-muted">Opens their home exactly as they see it. Nothing is marked read or changed.</p>}
      </Panel>

      <Panel title="Timeline">
        {r.timeline.length === 0 ? <Empty>No recorded events.</Empty> : (
          <ol className="crm-timeline">
            {r.timeline.map((t, i) => (
              <li key={`${t.at}-${i}`} className={`crm-tl-${t.kind}`}>
                <time dateTime={t.at}>{fmtDateTime(t.at)}</time>
                <div>
                  <strong>{t.title}</strong>
                  {t.detail && <span className="crm-muted"> · {t.detail}</span>}
                  <span className="crm-tl-source">{t.source}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <SourceStatus status={r.sources} />
    </div>
  )
}
