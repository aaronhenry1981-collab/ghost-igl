import { useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCrmResource } from './useCrmResource'
import { Empty, ErrorState, HealthBadge, Loading, PlanBadge, SourceStatus, StageBadge } from './crmUi'
import { billingLabel, fmtAgo, fmtDate, fmtDateTime } from './crmFormat'

const STAGES = [['', 'All stages'], ['signed_up', 'Signed up'], ['activating', 'Activating'], ['activated', 'Activated'], ['engaged', 'Engaged'], ['paid', 'Paid'], ['at_risk', 'At risk'], ['churned', 'Churned']]
const HEALTH = [['', 'All health'], ['healthy', 'Healthy'], ['needs_attention', 'Needs attention'], ['at_risk', 'At risk'], ['critical', 'Critical'], ['dormant', 'Dormant'], ['churned', 'Churned'], ['unknown', 'Unknown']]
const PLANS = [['', 'All plans'], ['free', 'Basic'], ['pro', 'Pro'], ['elite', 'Elite'], ['champion', 'Champion']]

const VARIANTS = {
  players: { view: 'all', intro: 'Every player, one row each. Duplicate Stripe rows for an email stay on one player.' },
  onboarding: { view: 'onboarding', intro: 'New and not-yet-activated players, plus paying players who have not finished setup.' },
  activity: { view: 'activity', intro: 'Sorted by last activity. Counts are for the last 7 days where activity is recorded.' },
  coaching: { view: 'all', intro: 'Coaching sessions, credits and VOD review usage.' },
  billing: { view: 'billing', intro: 'Members with a paid plan or a billing problem, from the webhook ledger.' },
}

function PlayerCell({ p, basePath }) {
  const primary = p.name || p.displayName || p.email
  const secondary = [p.displayName, p.email].filter((v) => v && v !== primary).join(' · ')
  return (
    <div className="crm-player-cell">
      <Link to={`${basePath}/players/${p.key}`} className="crm-player-name">{primary}</Link>
      {secondary && <span className="crm-muted">{secondary}</span>}
    </div>
  )
}

function columnsFor(variant) {
  const base = [
    { id: 'plan', label: 'Plan', cell: (p) => <><PlanBadge plan={p.plan} label={p.planLabel} /> <span className="crm-muted crm-nowrap">{billingLabel(p.billingStatus)}</span></> },
    { id: 'stage', label: 'Stage', cell: (p) => <StageBadge stage={p.stage} label={p.stageLabel} /> },
    { id: 'health', label: 'Health', cell: (p) => <><HealthBadge health={p.health} label={p.healthLabel} />{p.reasons[0] && <span className="crm-reason">{p.reasons[0]}</span>}</> },
  ]
  const next = { id: 'next', label: 'Next action', cell: (p) => <><span className="crm-next">{p.nextAction.label}</span>{p.nextAction.automated && <span className="crm-muted"> · automated</span>}</> }
  if (variant === 'onboarding') {
    return [...base, { id: 'setup', label: 'Setup', cell: (p) => `${p.activation.done}/${p.activation.total}` }, { id: 'joined', label: 'Joined', cell: (p) => fmtAgo(p.createdAt) }, next]
  }
  if (variant === 'activity') {
    return [
      base[1],
      { id: 'last', label: 'Last active', cell: (p) => fmtAgo(p.lastActiveAt) },
      { id: 'days', label: 'Active days (14d)', cell: (p) => p.activity.activeDays14 },
      { id: 'plans', label: 'Round plans (7d)', cell: (p) => (p.activity.evidence === 'recorded' ? p.activity.strategy7 : 'not recorded') },
      { id: 'prep', label: 'Match prep (7d)', cell: (p) => (p.activity.evidence === 'recorded' ? p.activity.matchPrep7 : 'not recorded') },
      { id: 'rtc', label: 'Road to Champion', cell: (p) => (p.activity.rtcDone === null ? 'not started' : `${p.activity.rtcDone}/40`) },
    ]
  }
  if (variant === 'coaching') {
    return [
      base[0],
      { id: 'next', label: 'Next session', cell: (p) => (p.coaching?.nextAt ? fmtDateTime(p.coaching.nextAt) : '—') },
      { id: 'done', label: 'Sessions done', cell: (p) => p.coaching?.completed ?? '—' },
      { id: 'credits', label: 'Credits', cell: (p) => (p.coaching?.credits ?? '—') },
      { id: 'vod', label: 'VOD this period', cell: (p) => (p.vod.limit ? `${p.vod.used}/${p.vod.limit}` : '—') },
      { id: 'lastvod', label: 'Last VOD review', cell: (p) => (p.vod.lastAt ? fmtDate(p.vod.lastAt) : '—') },
    ]
  }
  if (variant === 'billing') {
    return [...base, { id: 'mrr', label: 'Monthly', cell: (p) => (p.monthlyValue ? `$${p.monthlyValue}` : '—') }, next]
  }
  return [...base, { id: 'last', label: 'Last active', cell: (p) => fmtAgo(p.lastActiveAt) }, next]
}

export default function CrmPlayers({ api, basePath, variant = 'players' }) {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const cfg = VARIANTS[variant] || VARIANTS.players
  const stage = params.get('stage') || ''
  const health = params.get('health') || ''
  const plan = params.get('plan') || ''
  const searchId = useId()

  const path = useMemo(() => {
    const qs = new URLSearchParams({ view: cfg.view })
    if (stage) qs.set('stage', stage)
    if (health) qs.set('health', health)
    if (plan) qs.set('plan', plan)
    if (params.get('q')) qs.set('q', params.get('q'))
    return `/cs/admin/players?${qs}`
  }, [cfg.view, stage, health, plan, params])

  const { status, data, error, reload } = useCrmResource(api, path)
  const columns = columnsFor(variant)
  const players = variant === 'coaching' && data ? data.players.filter((p) => p.coaching?.upcoming || p.coaching?.completed || p.coaching?.credits || p.vod.used || p.vod.lastAt) : data?.players

  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }

  return (
    <div className="crm-stack">
      <p className="crm-lede">{cfg.intro}</p>
      <form className="crm-filters" role="search" onSubmit={(e) => { e.preventDefault(); setFilter('q', q.trim()) }}>
        <label htmlFor={searchId} className="crm-visually-hidden">Search players</label>
        <input id={searchId} className="crm-input" type="search" placeholder="Search name, gamertag or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="crm-input" aria-label="Filter by stage" value={stage} onChange={(e) => setFilter('stage', e.target.value)}>
          {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="crm-input" aria-label="Filter by health" value={health} onChange={(e) => setFilter('health', e.target.value)}>
          {HEALTH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="crm-input" aria-label="Filter by plan" value={plan} onChange={(e) => setFilter('plan', e.target.value)}>
          {PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="submit" className="btn btn-ghost btn-sm">Search</button>
      </form>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} />}
      {status === 'ready' && (
        players.length === 0 ? <Empty>No players match these filters.</Empty> : (
          <>
            <p className="crm-muted" role="status">{players.length} player{players.length === 1 ? '' : 's'}</p>
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    {columns.map((c) => <th scope="col" key={c.id}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.key}>
                      <th scope="row" data-label="Player"><PlayerCell p={p} basePath={basePath} /></th>
                      {columns.map((c) => <td key={c.id} data-label={c.label}>{c.cell(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SourceStatus status={data.sourceStatus} />
          </>
        )
      )}
    </div>
  )
}
