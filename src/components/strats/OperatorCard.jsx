export default function OperatorCard({ operator }) {
  const initials = operator.name.slice(0, 2).toUpperCase()
  return (
    <div className="operator-card">
      <div className={`operator-avatar ${operator.priority}`}>{initials}</div>
      <div className="operator-info">
        <div className="operator-name">{operator.name}</div>
        <div className="operator-role">{operator.role}</div>
        <span className={`operator-priority ${operator.priority}`}>{operator.priority}</span>
      </div>
    </div>
  )
}
