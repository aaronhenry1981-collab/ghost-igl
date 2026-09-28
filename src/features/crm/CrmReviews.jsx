import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { Badge, Empty, ErrorState, Kpi, Loading, Panel } from './crmUi'
import { fmtAgo } from './crmFormat'

function Candidate({ c, api, basePath }) {
  const [state, setState] = useState({ busy: false, error: null, result: c.decision ? { reviewDecision: c.decision } : null })
  async function decide(decision) {
    setState({ busy: true, error: null, result: null })
    try {
      setState({ busy: false, error: null, result: await api.post('/cs/admin/reviews/decision', { player: c.player.key, feedbackId: c.feedbackId, decision }) })
    } catch (err) {
      setState({ busy: false, error: err.message, result: null })
    }
  }
  const decided = state.result?.reviewDecision
  return (
    <li className="crm-review">
      <div>
        <Link to={`${basePath}/players/${c.player.key}`} className="crm-player-name">{c.player.name}</Link>
        <span className="crm-muted"> · {c.moment.replace(/_/g, ' ')} · {fmtAgo(c.createdAt)}</span>
        {Number.isFinite(c.nps) && <span className="crm-muted"> · recommend {c.nps}/10</span>}
      </div>
      <div className="crm-badges">
        {c.review.mayRequest && <Badge tone="info">May ask for a review</Badge>}
        {c.review.mayPublishQuote ? <Badge tone="ok">May publish quote</Badge> : <Badge tone="neutral">Quote not approved for publishing</Badge>}
      </div>
      {c.review.quote && <p className="crm-quote">“{c.review.quote}” <span className="crm-muted">— {c.review.displayName || 'no display name given'}</span></p>}
      {decided ? (
        <p className={decided.decision === 'approve' ? 'crm-ok' : 'crm-muted'} role="status">
          {decided.decision === 'approve' ? 'Approved' : 'Declined'} by {decided.actor} {fmtAgo(decided.at)}.
        </p>
      ) : (
        <div className="crm-qitem-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('approve')} disabled={state.busy || !c.review.mayPublishQuote}>Approve quote</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => decide('decline')} disabled={state.busy}>Decline</button>
        </div>
      )}
      {state.result?.testimonialDraft && (
        <div className="crm-draft">
          <strong>Draft for Admin → Content → Testimonials (publish manually)</strong>
          <p className="crm-pre">Name: {state.result.testimonialDraft.name}{'\n'}Text: {state.result.testimonialDraft.text}{state.result.testimonialDraft.rank ? `\nRank: ${state.result.testimonialDraft.rank}` : ''}{'\n'}Tier badge: none (only add one if verified against a paid subscription)</p>
        </div>
      )}
      {state.error && <p className="crm-error" role="alert">{state.error}</p>}
    </li>
  )
}

export default function CrmReviews({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/reviews')
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  const r = data.referrals
  return (
    <div className="crm-stack">
      <div className="crm-kpis">
        <Kpi label="Review candidates" value={data.candidates.length} detail="Players who gave permission" />
        <Kpi label="Published testimonials" value={data.testimonials.status === 'ok' ? data.testimonials.published : 'unavailable'} />
        <Kpi label="Referral records" value={r.status === 'ok' ? r.total : 'unavailable'} />
        <Kpi label="Referrers" value={r.status === 'ok' ? r.referrers.length : 'unavailable'} />
      </div>
      <Panel title="Review candidates">
        <ul className="crm-notes">{data.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        {data.candidates.length === 0 ? <Empty>No player has given review permission yet. The month-one and after-coaching feedback prompts ask for it.</Empty> : (
          <ul className="crm-list">{data.candidates.map((c) => <Candidate key={c.feedbackId} c={c} api={api} basePath={basePath} />)}</ul>
        )}
      </Panel>
      <Panel title="Referrals">
        {r.status !== 'ok' ? <p className="crm-warn">Referral records could not be read ({r.status}).</p> : r.referrers.length === 0 ? <Empty>No referral records.</Empty> : (
          <div className="crm-table-wrap">
            <table className="crm-table crm-table-compact">
              <thead><tr><th scope="col">Referrer</th><th scope="col">Referred</th><th scope="col">Pending</th><th scope="col">Active</th><th scope="col">Churned</th></tr></thead>
              <tbody>
                {r.referrers.map((x) => (
                  <tr key={x.referrer}>
                    <th scope="row" data-label="Referrer">{x.referrer}</th>
                    <td data-label="Referred">{x.total}</td>
                    <td data-label="Pending">{x.pending}</td>
                    <td data-label="Active">{x.active}</td>
                    <td data-label="Churned">{x.churned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="crm-muted crm-small">Referral capture and attribution are being repaired in the separate Acquisition Engine change; treat these counts as a floor.</p>
      </Panel>
    </div>
  )
}
