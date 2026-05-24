import { useUserRole, operatorFitsRole } from '../../hooks/useUserRole'

function keySentence(text) {
  if (!text) return ''
  const match = text.match(/[^.!?]+[.!?]/)
  return match ? match[0].trim() : text.trim()
}

export default function QuickBrief({ strat, side, mapName, siteName }) {
  const { role: userRole } = useUserRole()
  const essentials = strat.operators.filter((o) => o.priority === 'essential')
  const recommended = strat.operators.filter((o) => o.priority === 'recommended')
  const topCallouts = strat.callouts.slice(0, 4)
  const keyUtility = strat.utility.slice(0, 2)
  const matches = userRole ? strat.operators.filter((o) => operatorFitsRole(o, userRole)) : []

  return (
    <div className="quick-brief" role="region" aria-label="Quick brief">
      <div className="quick-brief-header">
        <div className="quick-brief-route">
          <span className="quick-brief-map">{mapName}</span>
          {siteName && <span className="quick-brief-sep">/</span>}
          {siteName && <span className="quick-brief-site">{siteName}</span>}
        </div>
        <span className={`quick-brief-side quick-brief-side-${side}`}>
          {side === 'attack' ? 'ATTACK' : 'DEFENSE'}
        </span>
      </div>

      {userRole && matches.length > 0 && (
        <div className="quick-brief-row">
          <div className="quick-brief-label">You ({userRole})</div>
          <div className="quick-brief-ops">
            {matches.map((m) => (
              <span key={m.name} className="quick-brief-op quick-brief-op-you" title={m.role}>
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="quick-brief-row">
        <div className="quick-brief-label">Lock in</div>
        <div className="quick-brief-ops">
          {essentials.map((o) => (
            <span key={o.name} className="quick-brief-op quick-brief-op-essential" title={o.role}>
              {o.name}
            </span>
          ))}
          {recommended.map((o) => (
            <span key={o.name} className="quick-brief-op quick-brief-op-recommended" title={o.role}>
              {o.name}
            </span>
          ))}
        </div>
      </div>

      <div className="quick-brief-row">
        <div className="quick-brief-label">Plan</div>
        <div className="quick-brief-plan">{keySentence(strat.strategy)}</div>
      </div>

      <div className="quick-brief-row">
        <div className="quick-brief-label">Callouts</div>
        <div className="quick-brief-callouts">
          {topCallouts.map((c) => (
            <span key={c} className="quick-brief-callout">{c}</span>
          ))}
        </div>
      </div>

      <div className="quick-brief-row quick-brief-row-utility">
        <div className="quick-brief-label">Key util</div>
        <ul className="quick-brief-utility">
          {keyUtility.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
