import { Link } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { ErrorState, HealthBadge, Kpi, Loading, Panel, SourceStatus } from './crmUi'
import { fmtAgo, fmtMoney, pct } from './crmFormat'

export default function CrmOverview({ api, basePath }) {
  const { status, data, error, reload } = useCrmResource(api, '/cs/admin/overview')
  if (status === 'loading') return <Loading />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />
  const o = data
  const maxStage = Math.max(1, ...o.stages.map((s) => s.count))
  const queue = o.queue || { total: 0, byType: {}, autoHandled: [] }

  return (
    <div className="crm-stack">
      <div className="crm-kpis">
        <Kpi label="Players" value={o.totals.players} detail="Excludes admin accounts" />
        <Kpi label="Paying members" value={o.totals.paying} detail={`Pro ${o.payingByPlan.pro} · Elite ${o.payingByPlan.elite} · Champion ${o.payingByPlan.champion}`} />
        <Kpi label="Ledger MRR" value={fmtMoney(o.ledgerMrr)} detail={o.unknownPriceMembers ? `${o.unknownPriceMembers} member(s) on an unknown price` : 'Known prices only'} />
        <Kpi label="Activation, last 30 days" value={pct(o.activation30)} detail={`${o.activation30.numerator} of ${o.activation30.denominator} new signups`} />
        <Kpi label="Needs your decision" value={queue.total} detail={<Link to={`${basePath}/queue`}>Open action queue</Link>} />
        <Kpi label="Unanswered messages" value={o.unansweredMessages} />
      </div>

      <div className="crm-two">
        <Panel title="Lifecycle">
          <ol className="crm-funnel">
            {o.stages.map((s) => (
              <li key={s.stage}>
                <Link to={`${basePath}/players?stage=${s.stage}`} className="crm-funnel-row">
                  <span className="crm-funnel-label">{s.label}</span>
                  <span className="crm-funnel-bar" aria-hidden="true"><span style={{ width: `${(s.count / maxStage) * 100}%` }} /></span>
                  <span className="crm-funnel-count">{s.count}</span>
                </Link>
                <span className="crm-funnel-def">{s.definition}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="crm-stack">
          <Panel title="Customer health">
            <ul className="crm-health">
              {o.health.filter((h) => h.count > 0).map((h) => (
                <li key={h.health}>
                  <Link to={`${basePath}/players?health=${h.health}`}><HealthBadge health={h.health} label={h.label} /></Link>
                  <span className="crm-health-count">{h.count}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Handled automatically">
            {queue.autoHandled.length ? (
              <ul className="crm-auto">
                {queue.autoHandled.map((a) => <li key={a.code}><strong>{a.count}</strong> {a.how}</li>)}
              </ul>
            ) : <p className="crm-muted">Nothing routine pending.</p>}
          </Panel>
          <Panel title="Billing signals (ledger)">
            <ul className="crm-auto">
              <li><strong>{o.billing.paymentFailed}</strong> failed payment</li>
              <li><strong>{o.billing.renewalUnconfirmed}</strong> renewal not recorded</li>
              <li><strong>{o.billing.duplicates}</strong> duplicate live subscriptions</li>
              <li><strong>{o.billing.churned30}</strong> churned in the last 30 days</li>
            </ul>
            <Link to={`${basePath}/billing`} className="btn btn-ghost btn-sm">Billing and health</Link>
          </Panel>
        </div>
      </div>

      {o.recentFeedback?.length > 0 && (
        <Panel title="Latest feedback" action={<Link to={`${basePath}/feedback`} className="crm-link">All feedback</Link>}>
          <ul className="crm-list">
            {o.recentFeedback.map((f) => (
              <li key={f.feedbackId}>
                <Link to={`${basePath}/players/${f.player.key}`}>{f.player.name || 'Player'}</Link>
                <span className="crm-muted"> · {f.moment} · {fmtAgo(f.createdAt)}</span>
                {Number.isFinite(f.answers?.helpful) && <span> · helpful {f.answers.helpful}/5</span>}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Data sources">
        <SourceStatus status={o.sourceStatus} />
        <ul className="crm-notes">{o.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </Panel>
    </div>
  )
}
