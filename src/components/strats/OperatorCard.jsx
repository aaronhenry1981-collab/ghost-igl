import { Link } from 'react-router-dom'
import RoleGlyph from './RoleGlyph'

export default function OperatorCard({ operator, roleMatch = false, roundContext }) {
  const hasRoundContext = roundContext?.mapId && roundContext?.siteId && roundContext?.side
  const params = hasRoundContext
    ? `?map=${encodeURIComponent(roundContext.mapId)}&site=${encodeURIComponent(roundContext.siteId)}&side=${encodeURIComponent(roundContext.side)}`
    : ''
  const to = `/operators/${encodeURIComponent(operator.name.toLowerCase())}${params}`
  return (
    <Link
      to={to}
      className={`operator-card${roleMatch ? ' role-match' : ''}`}
      title={hasRoundContext ? `See ${operator.name}'s job in this round` : `See every ${operator.name} strat`}
    >
      {roleMatch && <div className="operator-role-flag">Your role</div>}
      <div className={`operator-avatar ${operator.priority}`}>
        <RoleGlyph role={operator.role} name={operator.name} />
      </div>
      <div className="operator-info">
        <div className="operator-name">{operator.name}</div>
        <div className="operator-role">{operator.role}</div>
        <span className={`operator-priority ${operator.priority}`}>{operator.priority}</span>
      </div>
    </Link>
  )
}
