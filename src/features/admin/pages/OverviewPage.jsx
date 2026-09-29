import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAdminData, useAdminResource } from '../AdminData'
import { attentionItems, directoryCounts } from '../memberDirectory.mjs'
import { formatDollars } from '../memberFormat.mjs'
import { auditLabel, auditTone, timeAgo } from '../auditFormat.mjs'
import { confirmedUpcomingSessions } from '../../../lib/bookingDisplay'
import { Badge, Icon, Notice, PageHeader, Panel, Skeleton, StateView } from '../ui'

export default function OverviewPage() {
  const { users, summary, billingSource, billingWarning, status, error, reload, loadedAt, nowMs, base } = useAdminData()
  const bookings = useAdminResource('/admin/bookings?all=1')
  const audit = useAdminResource('/admin/audit')
  const loading = status === 'loading'
  const live = billingSource === 'stripe'

  const attention = useMemo(() => attentionItems(users), [users])
  const names = useMemo(() => directoryCounts(users), [users])
  const withAccount = useMemo(() => users.filter((u) => u.cognito_status !== 'NO_ACCOUNT').length, [users])
  const upcoming = useMemo(() => confirmedUpcomingSessions(bookings.data?.bookings || [], nowMs, 5), [bookings.data, nowMs])
  const recent = (audit.data?.events || []).slice(0, 6)

  const money = (v) => (live ? formatDollars(v) : null) ?? 'Unavailable'
  const metrics = [
    { label: 'Monthly recurring revenue', value: formatDollars(summary.mrr_dollars) ?? '—', hint: 'Paid subscriptions, excluding complimentary access' },
    { label: 'Paying members', value: summary.paying_active ?? '—' },
    { label: 'Trials expected to convert', value: summary.trials_expected_to_convert ?? 0, hint: `${formatDollars(summary.trial_mrr_dollars) ?? '$0.00'} a month if they convert` },
    { label: 'Collected, last 30 days', value: money(summary.collected_30d_dollars), hint: live ? 'Net of refunds, from Stripe charges' : 'Live Stripe data unavailable' },
    { label: 'Refunds, last 30 days', value: money(summary.refunds_30d_dollars) },
    { label: 'Complimentary access', value: summary.comp_active ?? '—', hint: 'Not counted as revenue' },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        description="Revenue, member access and the work waiting on you. Billing figures are reconciled against live Stripe each time this loads."
        actions={
          <>
            {loadedAt && <span className="ax-muted ax-num" style={{ alignSelf: 'center', fontSize: '0.78rem' }}>Updated {new Date(loadedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>}
            <button type="button" className="ax-btn ax-btn--sm" onClick={reload} disabled={status === 'loading' || status === 'refreshing'}>
              <Icon name="refresh" /> {status === 'refreshing' ? 'Refreshing…' : 'Refresh'}
            </button>
          </>
        }
      />

      {status === 'error' && users.length === 0 ? (
        <Panel><StateView kind="error" title="Member and billing data could not be loaded" onRetry={reload}>{error}</StateView></Panel>
      ) : (
        <>
          {status === 'error' && <Notice tone="danger" title="Refresh failed.">Showing the last loaded data. {error}</Notice>}
          {billingWarning && <Notice tone="warning" title="Live Stripe data is partly unavailable.">{billingWarning} Cash and refund totals stay hidden until reconciliation recovers.</Notice>}

          <Panel title="Revenue" bodyClassName="is-flush">
            {loading ? <Skeleton rows={3} /> : (
              <div className="ax-metrics">
                {metrics.map((m) => (
                  <div key={m.label} className="ax-metric">
                    <p className="ax-metric__label">{m.label}</p>
                    <p className="ax-metric__value">{m.value}</p>
                    {m.hint && <p className="ax-metric__hint">{m.hint}</p>}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="ax-cols">
            <Panel title="Needs attention" description="Billing problems that can cost revenue or lock a paying customer out. Zero is the goal." bodyClassName="is-flush">
              {loading ? <Skeleton rows={4} /> : (
                <ul className="ax-list">
                  {attention.map((a) => (
                    <li key={a.id}>
                      <Link className="ax-list__item" to={`${base}/members?status=${a.id}`}>
                        <span className="ax-list__main">
                          <span className="ax-list__title">{a.label}</span>
                          <span className="ax-list__meta">{a.count === 0 ? 'Clear' : `Review ${a.count === 1 ? 'this member' : 'these members'}`}</span>
                        </span>
                        {a.count > 0 && <Badge tone={a.tone}>{a.tone === 'danger' ? 'Urgent' : 'Review'}</Badge>}
                        <span className={`ax-list__count${a.count === 0 ? ' is-zero' : ''}`}>{a.count}</span>
                        <Icon name="chevron-right" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Members" description="Everyone with a site account or a Stripe subscription." bodyClassName="is-flush" actions={<Link to={`${base}/members`} className="ax-btn ax-btn--sm">Open directory</Link>}>
              {loading ? <Skeleton rows={4} /> : (
                <ul className="ax-list">
                  <li className="ax-list__item"><span className="ax-list__main"><span className="ax-list__title">Total members</span><span className="ax-list__meta">{withAccount} with a site account</span></span><span className="ax-list__count">{users.length}</span></li>
                  <li className="ax-list__item"><span className="ax-list__main"><span className="ax-list__title">Active paid plans</span><span className="ax-list__meta">Pro {summary.pro_active ?? 0} · Elite {summary.elite_active ?? 0} · Champion {summary.champion_active ?? 0}</span></span><span className="ax-list__count">{(summary.pro_active ?? 0) + (summary.elite_active ?? 0) + (summary.champion_active ?? 0)}</span></li>
                  <li>
                    <Link className="ax-list__item" to={`${base}/members?name=needs`}>
                      <span className="ax-list__main"><span className="ax-list__title">Members without a confirmed name</span><span className="ax-list__meta">{names.review} to review · {names.missing} with no name · {names.single} single-name</span></span>
                      <span className={`ax-list__count${names.review + names.missing === 0 ? ' is-zero' : ''}`}>{names.review + names.missing}</span>
                      <Icon name="chevron-right" />
                    </Link>
                  </li>
                </ul>
              )}
            </Panel>
          </div>

          <div className="ax-cols">
            <Panel title="Upcoming coaching" description="Next confirmed sessions." bodyClassName="is-flush" actions={<Link to={`${base}/coaching`} className="ax-btn ax-btn--sm">Open coaching</Link>}>
              {bookings.status === 'loading' ? <Skeleton rows={3} />
                : bookings.status === 'error' ? <StateView kind="error" title="Sessions could not be loaded" onRetry={bookings.reload}>{bookings.error}</StateView>
                  : upcoming.length === 0 ? <StateView kind="empty" title="No confirmed upcoming sessions" />
                    : (
                      <ul className="ax-list">
                        {upcoming.map((b) => (
                          <li key={b.slotId} className="ax-list__item">
                            <span className="ax-list__main">
                              <span className="ax-list__title">{b.customer?.name || b.customer?.email || 'Customer'}</span>
                              <span className="ax-list__meta">{b.sessionType || 'Coaching session'}{b.customer?.email && b.customer?.name ? ` · ${b.customer.email}` : ''}</span>
                            </span>
                            <span className="ax-num ax-strong" style={{ fontSize: '0.8125rem', textAlign: 'right' }}>
                              {new Date(b.start).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
            </Panel>

            <Panel title="Recent admin activity" description="The latest audited changes." bodyClassName="is-flush" actions={<Link to={`${base}/system#audit`} className="ax-btn ax-btn--sm">Full audit log</Link>}>
              {audit.status === 'loading' ? <Skeleton rows={3} />
                : audit.status === 'error' ? <StateView kind="error" title="The audit log could not be loaded" onRetry={audit.reload}>{audit.error}</StateView>
                  : recent.length === 0 ? <StateView kind="empty" title="No admin actions recorded yet" />
                    : (
                      <ul className="ax-list">
                        {recent.map((e) => (
                          <li key={e.id} className="ax-list__item">
                            <span className="ax-list__main">
                              <span className="ax-list__title">{auditLabel(e.action)}</span>
                              <span className="ax-list__meta">{e.target || '—'} · by {e.actor || 'system'}</span>
                            </span>
                            <Badge tone={auditTone(e.action)}>{timeAgo(e.timestamp, nowMs)}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
            </Panel>
          </div>
        </>
      )}
    </>
  )
}
