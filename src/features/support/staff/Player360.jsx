import { Link } from 'react-router-dom'
import { isResolvedLike, staffStatusLabel } from '../supportLogic.mjs'
import { Ago, Chip, NotRecorded } from '../ui/bits'

const PLAN_TONE = { free: 'neutral', pro: 'pro', elite: 'elite', champion: 'champion' }
const HEALTH_TONE = { healthy: 'ok', watch: 'warning', at_risk: 'warning', critical: 'danger' }
const PLATFORM = { pc: 'PC', ps5: 'PlayStation', ps4: 'PlayStation', xbox: 'Xbox' }
const IDENTITY_SOURCES = ['ubisoft', 'psn', 'xbox', 'trn']
const SOURCE_LABEL = { ubisoft: 'Ubisoft', psn: 'PSN', xbox: 'Xbox', trn: 'Tracker (TRN)' }

function Row({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

// Player 360 from the case payload: player360 { status, summary } (PR #24
// buildPlayerSummary: key, email, name, displayName, platform, rank, plan,
// planLabel, billingStatus, hasAccess, stage/stageLabel, health/healthLabel,
// reasons, activation, nextAction, vod, coaching, activity, createdAt,
// lastSeenAt), previousCases, and identity links from the connections
// context. Nulls read "not recorded", never a guess.
export default function Player360({ data, previousCases = [], connections = null, caseHref, playerHref }) {
  const p = data?.summary
  if (!p) return <p className="sp-muted">Player record unavailable{data?.status ? ` (${data.status})` : ''}.</p>
  const identities = Array.isArray(connections) ? connections.filter((c) => IDENTITY_SOURCES.includes(c.source)) : []
  const open = previousCases.filter((c) => !isResolvedLike(c.status))
  const done = previousCases.filter((c) => isResolvedLike(c.status))
  return (
    <div className="sc-p360">
      <div className="sc-p360-id">
        <span className="sc-avatar" aria-hidden="true">{(p.displayName || p.email || '?')[0].toUpperCase()}</span>
        <div>
          <p className="sc-p360-name">{p.displayName || p.name || 'No display name'}</p>
          <p className="sp-muted sp-small sc-wrap">{p.email}</p>
        </div>
      </div>
      <div className="sp-row">
        <Chip tone={p.hasAccess === false && p.plan && p.plan !== 'free' ? 'danger' : PLAN_TONE[p.plan] || 'neutral'}>{p.planLabel || 'Unknown plan'}</Chip>
        {p.billingStatus && !['active', 'none'].includes(p.billingStatus) && <Chip tone="warning">{String(p.billingStatus).replace(/_/g, ' ')}</Chip>}
        {p.healthLabel && <Chip tone={HEALTH_TONE[p.health] || 'muted'}>{p.healthLabel}</Chip>}
        {p.accountStatus && p.accountStatus !== 'ok' && <Chip tone="warning">Login: {String(p.accountStatus).replace(/_/g, ' ')}</Chip>}
      </div>
      {(p.reasons || []).length > 0 && <p className="sp-muted sp-small">{p.reasons.join(' ')}</p>}
      {playerHref && <Link to={playerHref} className="sp-small sc-link">Full CRM record →</Link>}

      <dl className="sc-dl">
        <Row label="Account created">{p.createdAt ? <Ago at={p.createdAt} /> : <NotRecorded />}</Row>
        <Row label="Last seen">{p.lastSeenAt ? <Ago at={p.lastSeenAt} /> : <NotRecorded />}</Row>
        <Row label="Stage">{p.stageLabel || <NotRecorded />}</Row>
        <Row label="Onboarding">{p.activation ? `${p.activation.done}/${p.activation.total}${p.activation.complete ? ' · complete' : ''}` : <NotRecorded />}</Row>
        <Row label="Platform / rank">{[PLATFORM[p.platform] || p.platform, p.rank].filter(Boolean).join(' · ') || <NotRecorded />}</Row>
        <Row label="VOD reviews">
          {p.vod && p.vod.used !== null ? `${p.vod.used}${p.vod.limit ? ` of ${p.vod.limit}` : ''} this period` : <NotRecorded />}
          {p.vod?.lastAt && <span className="sp-muted sp-small sc-line">Last review <Ago at={p.vod.lastAt} /></span>}
        </Row>
        <Row label="Coaching">
          {p.coaching ? `${p.coaching.credits ?? 'no'} credit${p.coaching.credits === 1 ? '' : 's'} · ${p.coaching.completed ?? 0} completed · ${p.coaching.upcoming ?? 0} upcoming` : <NotRecorded />}
        </Row>
        <Row label="Active days (14d)">{p.activity?.activeDays14 ?? <NotRecorded />}</Row>
      </dl>
      {p.nextAction?.label && <p className="sp-small"><span className="sc-subhead">CRM next action:</span> {p.nextAction.label}</p>}

      <p className="sc-subhead">Linked identities</p>
      <ul className="sc-idlist">
        {identities.map((i) => (
          <li key={i.source}>
            <span>{SOURCE_LABEL[i.source]}</span>
            <span className="sp-muted sp-small">{i.lastSuccessAt ? <>data <Ago at={i.lastSuccessAt} /></> : 'no data yet'}</span>
            <Chip tone={i.linked ? 'ok' : 'muted'}>{i.linked === null ? 'unknown' : i.linked ? 'linked' : 'not linked'}</Chip>
          </li>
        ))}
        {!identities.length && <li><NotRecorded>Connection history not available</NotRecorded></li>}
      </ul>

      <p className="sc-subhead">Other open cases</p>
      {open.length ? (
        <ul className="sc-mini">
          {open.map((c) => (
            <li key={c.caseNumber}>
              {caseHref ? <Link to={caseHref(c.caseNumber)} className="sp-mono sc-link">{c.caseNumber}</Link> : <span className="sp-mono">{c.caseNumber}</span>}
              <span className="sc-wrap">{c.subject}</span>
              <span className="sp-muted sp-small">{staffStatusLabel(c.status)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="sp-muted sp-small">None.</p>}

      <p className="sc-subhead">Previous cases</p>
      {done.length ? (
        <ul className="sc-mini">
          {done.map((c) => (
            <li key={c.caseNumber}>
              {caseHref ? <Link to={caseHref(c.caseNumber)} className="sp-mono sc-link">{c.caseNumber}</Link> : <span className="sp-mono">{c.caseNumber}</span>}
              <span className="sc-wrap">{c.subject}</span>
              <span className="sp-muted sp-small">{c.resolvedAt ? <Ago at={c.resolvedAt} /> : staffStatusLabel(c.status)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="sp-muted sp-small">None. First case for this player.</p>}
    </div>
  )
}
