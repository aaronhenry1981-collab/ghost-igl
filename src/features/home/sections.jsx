import { useId } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, formatDay, formatRelative, mapLabel, sideLabel, siteLabel } from './homeFormat'

// One call-to-action shape everywhere: router link, full-page link or action.
export function Cta({ cta, className = 'btn btn-primary', onAction, disabled = false, children }) {
  if (!cta) return null
  const label = children || cta.label
  if (cta.action) {
    return (
      <button type="button" className={className} onClick={() => onAction?.(cta.action)} disabled={disabled}>
        {label}
      </button>
    )
  }
  if (cta.to) return <Link to={cta.to} className={className}>{label}</Link>
  return <a href={cta.href} className={className}>{label}</a>
}

function Card({ title, eyebrow, children, className = '', action = null }) {
  const id = useId()
  return (
    <section className={`ph-card ${className}`} aria-labelledby={id}>
      <header className="ph-card-head">
        <div>
          {eyebrow && <p className="ph-eyebrow">{eyebrow}</p>}
          <h2 id={id} className="ph-card-title">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function MissionCard({ mission, onAction }) {
  const id = useId()
  if (!mission) return null
  return (
    <section className={`ph-mission ph-mission-${mission.kind}`} aria-labelledby={id}>
      <p className="ph-eyebrow ph-mission-eyebrow">Today&apos;s mission</p>
      <h2 id={id} className="ph-mission-title">{mission.title}</h2>
      <p className="ph-mission-body">{mission.body}</p>
      <div className="ph-mission-actions">
        <Cta cta={mission.cta} className="btn btn-primary ph-mission-cta" onAction={onAction} />
      </div>
      {mission.evidence?.length > 0 && (
        <div className="ph-why">
          <span className="ph-why-label">Why this</span>
          <ul className="ph-why-list">
            {mission.evidence.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}

export function RoadToChampionCard({ rtc, sourceStatus }) {
  if (!rtc) {
    return (
      <Card title="Road to Champion" eyebrow="Your climb" className="ph-rtc">
        {sourceStatus === 'unavailable'
          ? <p className="ph-muted">We couldn&apos;t load your checklist right now. Your progress is safe; try again in a minute.</p>
          : <p className="ph-muted">Not started yet. Five habits per rank, from Copper to Champion. Start at your tier and tick them off as they stick.</p>}
        <a className="btn btn-outline btn-sm" href="/climb/">Open Road to Champion</a>
      </Card>
    )
  }
  const pct = Math.round((rtc.tasksDone / rtc.tasksTotal) * 100)
  const current = rtc.currentTier
  return (
    <Card
      title="Road to Champion"
      eyebrow="Your climb"
      className="ph-rtc"
      action={<span className="ph-count">{rtc.tasksDone}<span aria-hidden="true">/</span><span className="ph-visually-hidden"> of </span>{rtc.tasksTotal} habits</span>}
    >
      <div className="ph-track" role="img" aria-label={`${rtc.tiersComplete} of ${rtc.tiersTotal} tiers complete${current ? `, working on ${current.rank} (${current.done} of ${current.total})` : ''}`}>
        {rtc.tiers.map((tier) => {
          const fill = Math.round((tier.done / tier.total) * 100)
          const isCurrent = current?.id === tier.id
          return (
            <div key={tier.id} className={`ph-track-seg${tier.complete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}>
              <span className="ph-track-bar"><span style={{ width: `${fill}%` }} /></span>
              <span className="ph-track-label">{tier.rank}</span>
            </div>
          )
        })}
      </div>
      <div className="ph-progressline" role="progressbar" aria-valuemin={0} aria-valuemax={rtc.tasksTotal} aria-valuenow={rtc.tasksDone} aria-label="Road to Champion habits checked">
        <span style={{ width: `${pct}%` }} />
      </div>
      {current ? (
        <p className="ph-rtc-next">
          <strong>{current.rank}:</strong> {current.theme}
          {current.nextTask && <><br /><span className="ph-muted">Next habit:</span> {current.nextTask}</>}
        </p>
      ) : (
        <p className="ph-rtc-next">Every habit is checked. Keep them sharp.</p>
      )}
      <div className="ph-card-foot">
        <a className="btn btn-outline btn-sm" href="/climb/">Open checklist</a>
        {rtc.updatedAt && <span className="ph-source">Updated {formatRelative(rtc.updatedAt)}</span>}
      </div>
    </Card>
  )
}

export function ActivationCard({ activation, onAction }) {
  if (!activation || activation.complete || !activation.steps.length) return null
  return (
    <Card
      title="Get set up"
      eyebrow="Getting started"
      className="ph-activation"
      action={<span className="ph-count">{activation.done} of {activation.total}</span>}
    >
      <ol className="ph-steps">
        {activation.steps.map((step) => (
          <li key={step.id} className={`ph-step${step.done ? ' is-done' : ''}`}>
            <span className="ph-step-mark" aria-hidden="true">{step.done ? '✓' : ''}</span>
            <div className="ph-step-copy">
              <span className="ph-step-label">
                {step.label}
                <span className="ph-visually-hidden">{step.done ? ' (done)' : step.done === null ? ' (could not check)' : ' (to do)'}</span>
              </span>
              {!step.done && <span className="ph-step-detail">{step.done === null ? "We couldn't check this right now." : step.detail}</span>}
            </div>
            {!step.done && <Cta cta={step.cta} className="btn btn-ghost btn-sm" onAction={onAction} />}
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function ContinueCard({ items }) {
  if (!items?.length) return null
  return (
    <Card title="Continue where you left off" className="ph-continue">
      <ul className="ph-list">
        {items.map((item) => {
          if (item.kind === 'round_plan') {
            const side = sideLabel(item.side)
            return (
              <li key="round_plan">
                <Link to={item.to} className="ph-list-link">
                  <span className="ph-list-kicker">Round plan</span>
                  <span className="ph-list-title">{mapLabel(item.mapId)} · {siteLabel(item.mapId, item.siteId)}{side ? ` · ${side}` : ''}</span>
                </Link>
              </li>
            )
          }
          if (item.kind === 'road_to_champion') {
            return (
              <li key="rtc">
                <a href={item.href} className="ph-list-link">
                  <span className="ph-list-kicker">Road to Champion · {item.tier} {item.done}/{item.total}</span>
                  <span className="ph-list-title">{item.label}</span>
                </a>
              </li>
            )
          }
          return (
            <li key="vod">
              <Link to={item.to} className="ph-list-link">
                <span className="ph-list-kicker">VOD review · {formatRelative(item.at)}</span>
                <span className="ph-list-title">{item.map ? `${item.map} round` : 'Your last review'}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function FocusCard({ skills, evidence }) {
  const focus = skills?.focus
  return (
    <Card title="What you're improving" className="ph-focus">
      {focus ? (
        <div className="ph-focus-main">
          <p className="ph-focus-title">{focus.title}</p>
          {focus.detail && <p className="ph-focus-detail">{focus.detail}</p>}
          <p className="ph-source">From {focus.source}{focus.asOf ? `, ${formatDay(focus.asOf)}` : ''}</p>
        </div>
      ) : (
        <p className="ph-muted">No focus yet. A VOD review, a coached match, or starting Road to Champion gives you one.</p>
      )}
      {skills?.gaps?.length > 1 && (
        <>
          <h3 className="ph-subhead">Skill gaps</h3>
          <ul className="ph-bullets">
            {skills.gaps.map((gap) => <li key={gap.label}>{gap.label} <span className="ph-source">({gap.source})</span></li>)}
          </ul>
        </>
      )}
      {skills?.practice?.length > 0 && (
        <>
          <h3 className="ph-subhead">Practice next</h3>
          <ul className="ph-bullets">
            {skills.practice.map((p) => <li key={p.label}>{p.label} <span className="ph-source">({p.source})</span></li>)}
          </ul>
        </>
      )}
      {evidence?.length > 0 && (
        <>
          <h3 className="ph-subhead">Evidence</h3>
          <ul className="ph-evidence">
            {evidence.map((e) => (
              <li key={`${e.kind}-${e.label}`}>
                <span>{e.label}</span>
                <span className="ph-source">{[e.source, e.at ? formatDay(e.at) : null].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

export function ActivityCard({ activity }) {
  if (!activity) return null
  const scope = activity.evidence === 'recorded' ? 'Last 7 days' : activity.evidence === 'this_device' ? 'On this device' : 'Recent'
  const row = (label, bucket, to) => (
    <li>
      <Link to={to} className="ph-stat-link">
        <span className="ph-stat-label">{label}</span>
        <span className="ph-stat-value">
          {activity.evidence === 'recorded' ? bucket.count7 : bucket.total}
          {bucket.lastAt && <span className="ph-source"> · last {formatRelative(bucket.lastAt)}</span>}
        </span>
      </Link>
    </li>
  )
  return (
    <Card title="Your activity" eyebrow={scope} className="ph-activity">
      <ul className="ph-stats">
        {row('Round plans opened', activity.strategy, '/strats')}
        {activity.evidence === 'recorded' && row('Match preps', activity.matchPrep, '/match-prep')}
        {activity.evidence === 'recorded' && row('Live round guide', activity.liveCoach, '/live')}
      </ul>
      {activity.evidence !== 'recorded' && (
        <p className="ph-source">Match prep and live-guide history appear here once activity tracking is on for your account.</p>
      )}
    </Card>
  )
}

function Meter({ used, limit, label }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone = pct >= 100 ? 'is-full' : pct >= 80 ? 'is-high' : ''
  return (
    <div className="ph-meter-wrap">
      <div className="ph-meter-head"><span>{label}</span><span>{used} of {limit}</span></div>
      <div className={`ph-meter ${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MembershipCard({ membership, vod, onAction }) {
  if (!membership) return null
  const usage = vod?.usage
  return (
    <Card title="Membership" className="ph-membership">
      <div className="ph-plan-row">
        <span className={`ph-plan ph-plan-${membership.plan || 'unknown'}`}>{membership.planLabel || 'Unknown'}</span>
        <span className={`ph-status ph-tone-${membership.tone}`}>{membership.statusLabel}</span>
      </div>
      {usage && !usage.unlimited && usage.limit ? (
        <Meter used={usage.used} limit={usage.limit} label={usage.isTrial ? 'Trial VOD reviews' : 'VOD reviews this period'} />
      ) : null}
      {membership.available && membership.features?.length > 0 && (
        <ul className="ph-bullets ph-features">
          {membership.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
      {membership.alsoPaying && (
        <p className="ph-billing-note">
          You also have a paid {membership.alsoPaying.planLabel} subscription
          {membership.alsoPaying.amount ? ` ($${membership.alsoPaying.amount}/${membership.alsoPaying.interval === 'year' ? 'yr' : 'mo'})` : ''} on this email.
          {' '}Message us if you want it cancelled while your complimentary access is on.
        </p>
      )}
      <div className="ph-card-foot ph-stack-sm">
        {membership.canManageBilling && <Cta cta={{ label: 'Manage billing', action: 'billing_portal' }} className="btn btn-ghost btn-sm" onAction={onAction} />}
        <Link to="/account" className="btn btn-ghost btn-sm">Account</Link>
      </div>
      {membership.upgrade && (
        <div className="ph-upgrade">
          <p className="ph-upgrade-title">{membership.upgrade.label} adds</p>
          <ul className="ph-bullets">
            {membership.upgrade.features.filter((f) => !f.startsWith('Everything in')).map((f) => <li key={f}>{f}</li>)}
          </ul>
          <Cta cta={membership.upgrade.cta} className="btn btn-outline btn-sm" />
        </div>
      )}
      {!membership.available && <p className="ph-source">Billing status could not be loaded. Your access is unchanged.</p>}
    </Card>
  )
}

export function VodCard({ vod }) {
  if (!vod) return null
  return (
    <Card title="VOD review" className="ph-vod">
      {!vod.included ? (
        <p className="ph-muted">Upload screenshots from a lost round and get the mistake that cost it. Included with Pro and above.</p>
      ) : vod.lastReviewAt ? (
        <p>Last review {formatRelative(vod.lastReviewAt)}{vod.lastMap ? ` on ${vod.lastMap}` : ''}.</p>
      ) : (
        <p className="ph-muted">No reviews yet. Your first one takes a few screenshots from one round.</p>
      )}
      {vod.included && <p className="ph-source">{vod.historyNote}</p>}
      {vod.next && <Cta cta={vod.next} className={vod.included ? 'btn btn-outline btn-sm' : 'btn btn-ghost btn-sm'} />}
    </Card>
  )
}

export function CoachingCard({ coaching }) {
  if (!coaching) return null
  return (
    <Card title="Coaching" className="ph-coaching">
      {coaching.available ? (
        <>
          {coaching.upcoming.length > 0 ? (
            <ul className="ph-bullets">
              {coaching.upcoming.map((s) => <li key={s.id}>Session {formatDateTime(s.startsAt)}</li>)}
            </ul>
          ) : (
            <p className="ph-muted">No session booked.</p>
          )}
          {coaching.includedPerMonth > 0 && <p className="ph-source">{coaching.includedPerMonth} live sessions included each month.</p>}
          {Number.isFinite(coaching.credits) && coaching.credits > 0 && <p className="ph-source">{coaching.credits} session credit{coaching.credits === 1 ? '' : 's'} available.</p>}
          {Number.isFinite(coaching.completedCount) && coaching.completedCount > 0 && <p className="ph-source">{coaching.completedCount} completed{coaching.lastCompletedAt ? `, last ${formatDay(coaching.lastCompletedAt)}` : ''}.</p>}
        </>
      ) : (
        <p className="ph-muted">{coaching.includedPerMonth > 0 ? `${coaching.includedPerMonth} live 1:1 sessions with Aaron are included each month.` : '1:1 sessions with Aaron, built around your own rounds.'}</p>
      )}
      <Cta cta={coaching.cta} className="btn btn-outline btn-sm" />
    </Card>
  )
}

export function StuckCard({ stuck }) {
  if (!stuck?.length) return null
  return (
    <Card title="Where you're stuck" className="ph-stuck">
      <ul className="ph-bullets">
        {stuck.map((s) => <li key={s.id}>{s.label}</li>)}
      </ul>
    </Card>
  )
}

export function HelpCard({ help, onAction }) {
  if (!help?.length) return null
  return (
    <Card title="Get help" className="ph-help">
      <ul className="ph-help-list">
        {help.map((h) => (
          <li key={h.id}>
            <div>
              <span className="ph-help-label">{h.label}</span>
              <span className="ph-help-detail">{h.detail}</span>
            </div>
            <Cta cta={h.cta} className="btn btn-ghost btn-sm" onAction={onAction} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function ToolsCard({ tools }) {
  if (!tools?.length) return null
  return (
    <nav className="ph-tools" aria-label="Recon tools">
      <h2 className="ph-visually-hidden">Tools</h2>
      <ul>
        {tools.map((tool) => (
          <li key={tool.id}>
            {tool.to
              ? <Link to={tool.to} className="ph-tool">{tool.label}{tool.locked && <span className="ph-tool-lock">Pro</span>}</Link>
              : <a href={tool.href} className="ph-tool">{tool.label}</a>}
          </li>
        ))}
      </ul>
    </nav>
  )
}
