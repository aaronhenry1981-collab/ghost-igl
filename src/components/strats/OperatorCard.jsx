export default function OperatorCard({
  operator,
  roleMatch = false,
  selected = false,
  onSelect,
}) {
  const initials = operator.name.slice(0, 2).toUpperCase()
  return (
    <button
      type="button"
      className={`operator-card${roleMatch ? ' role-match' : ''}${selected ? ' selected' : ''}`}
      title={`Play ${operator.name} for this round`}
      aria-pressed={selected}
      onClick={() => onSelect?.(operator.name)}
    >
      {roleMatch && <div className="operator-role-flag">Your role</div>}
      <div className={`operator-avatar ${operator.priority}`}>{initials}</div>
      <div className="operator-info">
        <div className="operator-name">{operator.name}</div>
        <div className="operator-role">{operator.role}</div>
        <span className={`operator-priority ${operator.priority}`}>{operator.priority}</span>
      </div>
    </button>
  )
}
