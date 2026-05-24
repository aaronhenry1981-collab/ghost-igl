import { Link } from 'react-router-dom'

export default function OperatorCard({ operator, roleMatch = false }) {
  const initials = operator.name.slice(0, 2).toUpperCase()
  const to = `/operators/${encodeURIComponent(operator.name.toLowerCase())}`
  return (
    <Link
      to={to}
      className={`operator-card${roleMatch ? ' role-match' : ''}`}
      title={`See every ${operator.name} strat`}
    >
      {roleMatch && <div className="operator-role-flag">Your role</div>}
      <div className={`operator-avatar ${operator.priority}`}>{initials}</div>
      <div className="operator-info">
        <div className="operator-name">{operator.name}</div>
        <div className="operator-role">{operator.role}</div>
        <span className={`operator-priority ${operator.priority}`}>{operator.priority}</span>
      </div>
    </Link>
  )
}
