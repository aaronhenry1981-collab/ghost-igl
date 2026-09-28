import { useState } from 'react'
import { categoryLabel, fmtDuration, metricText } from '../supportLogic.mjs'
import { errorMessage } from '../supportApi'
import { useSupportResource } from '../useSupportResource'
import { RoundInterrupted, Skeleton } from '../ui/bits'

const RANGES = [{ id: 7, label: '7 days' }, { id: 30, label: '30 days' }, { id: 90, label: '90 days' }]
const DAY = 86_400_000
// = support/metrics.mjs AGING_BUCKETS (ids and labels).
const AGING = [['lt_1d', '< 1 day'], ['d1_3', '1-3 days'], ['d3_7', '3-7 days'], ['d7_14', '7-14 days'], ['gt_14d', '> 14 days']]
const ISSUE_LABEL = { entitlement: 'Entitlement', provider: 'Provider / identity', vod: 'VOD', coaching: 'Coaching' }

function rangeFor(days) {
  // Rounded to the hour so the resource key is stable across renders.
  const to = Math.floor(Date.now() / 3_600_000) * 3_600_000
  return { from: new Date(to - days * DAY).toISOString(), to: new Date(to).toISOString() }
}

const minutes = (ms) => (ms === null || ms === undefined ? null : ms / 60_000)
const pct = (r) => `${Math.round(r * 100)}%`
const rowsOf = (obj, labelOf = (k) => k) => Object.entries(obj || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, label: labelOf(key), count }))

function Card({ label, value, detail }) {
  const empty = value === 'No data yet'
  return (
    <div className={`sc-metric${empty ? ' is-empty' : ''}`}>
      <span className="sc-metric-label">{label}</span>
      <span className="sc-metric-value">{value}</span>
      {detail && <span className="sc-metric-detail">{detail}</span>}
    </div>
  )
}

function Bars({ title, rows, empty = 'No data yet' }) {
  const max = Math.max(1, ...(rows || []).map((r) => r.count || 0))
  return (
    <section className="sc-block" aria-label={title}>
      <header className="sc-block-head"><h2>{title}</h2></header>
      {!rows || rows.length === 0 ? <p className="sc-nodata">{empty}</p> : (
        <ul className="sc-bars">
          {rows.map((r) => (
            <li key={r.key}>
              <span className="sc-bar-label">{r.label}</span>
              <span className="sc-bar-track" aria-hidden="true"><span style={{ width: `${Math.round(((r.count || 0) / max) * 100)}%` }} /></span>
              <span className="sc-bar-count">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// GET /cs/admin/support/metrics (lead/admin), computed server-side from
// stored case events only (§14). Counts with nothing to count are 0; a
// median, rate or share with an empty denominator is null and reads
// "No data yet". No estimates, no backfill.
export default function Metrics({ client }) {
  const [{ days, range }, setSel] = useState(() => ({ days: 30, range: rangeFor(30) }))
  const res = useSupportResource(client, 'metrics', range)
  const m = res.data || {}
  const agingRows = AGING.map(([id, label]) => ({ key: id, label, count: m.aging?.buckets?.[id] || 0 })).filter((r) => r.count > 0)

  return (
    <div className="sc-metrics">
      <div className="sc-range" role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <button key={r.id} type="button" className={`sc-range-btn${days === r.id ? ' is-on' : ''}`} aria-pressed={days === r.id} onClick={() => setSel({ days: r.id, range: rangeFor(r.id) })}>{r.label}</button>
        ))}
      </div>
      {res.status === 'loading' && <Skeleton lines={5} label="Loading metrics…" />}
      {res.status === 'error' && <RoundInterrupted message={errorMessage(res.error, "Couldn't load metrics.")} onRetry={res.reload} />}
      {res.status === 'ready' && (
        <>
          <div className="sc-metric-grid">
            <Card label="Open cases (now)" value={metricText(m.open?.total)} />
            <Card label="Cases created" value={metricText(m.created)} detail={m.awaitingFirstResponse ? `${m.awaitingFirstResponse} awaiting a first reply` : null} />
            <Card label="First response (median)" value={metricText(minutes(m.firstResponse?.medianMs), fmtDuration)} detail={m.firstResponse ? `p90 ${fmtDuration(minutes(m.firstResponse.p90Ms))} · n=${m.firstResponse.count}` : null} />
            <Card label="Resolution (median)" value={metricText(minutes(m.resolution?.medianMs), fmtDuration)} detail={m.resolution ? `p90 ${fmtDuration(minutes(m.resolution.p90Ms))} · n=${m.resolution.count}` : null} />
            <Card label="Reopen rate" value={metricText(m.reopen?.rate, pct)} detail={m.reopen ? `${m.reopen.reopened} of ${m.reopen.resolved} resolved` : null} />
            <Card label="CSAT positive" value={metricText(m.csat?.positiveShare, pct)} detail={m.csat ? `${m.csat.responses} response${m.csat.responses === 1 ? '' : 's'} of ${m.csat.eligible} resolved` : null} />
            <Card label="Cases per active member" value={metricText(m.volumePerActiveMember, (v) => v.toFixed(2))} detail={m.activeMembers !== null && m.activeMembers !== undefined ? `${m.activeMembers} active members` : null} />
            <Card label="Repeat users" value={metricText(m.repeatUsers?.count)} detail={m.repeatUsers?.contacts ? `of ${m.repeatUsers.contacts} players with cases` : null} />
            <Card label="Incidents opened" value={metricText(m.incidents?.count)} detail={m.incidents?.linkedCases ? `${m.incidents.linkedCases} linked cases` : null} />
          </div>
          <div className="sc-metric-charts">
            <Bars title="Open case aging" rows={agingRows} empty="No open cases." />
            <Bars title="Categories" rows={rowsOf(m.categories, categoryLabel)} />
            <Bars title="Root causes" rows={rowsOf(m.rootCauses, (k) => k.replace(/_/g, ' '))} />
            <Bars title="Issue types" rows={rowsOf(m.issueCounts, (k) => ISSUE_LABEL[k] || k)} />
          </div>
          <p className="sp-muted sp-small">{m.basis ? `Computed from ${m.basis}.` : 'Computed from stored case events only.'} Nothing is estimated or backfilled.</p>
        </>
      )}
    </div>
  )
}
