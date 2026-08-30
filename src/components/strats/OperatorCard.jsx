import RoleGlyph from './RoleGlyph'

export default function OperatorCard({ operator, roleMatch = false, active = false, onSelect }) {
  return (
    <button
      type="button"
      className={`operator-card${roleMatch ? ' role-match' : ''}${active ? ' is-selected' : ''}`}
      title={`Choose ${operator.name} for this round`}
      aria-pressed={active}
      onClick={() => onSelect?.(operator.name)}
    >
      {roleMatch && <div className="operator-role-flag">Your role</div>}
      {active && <span className="operator-selected-check">Selected</span>}
      <div className={`operator-avatar ${operator.priority}`}>
        <RoleGlyph role={operator.role} name={operator.name} />
      </div>
      <div className="operator-info">
        <div className="operator-name">{operator.name}</div>
        <div className="operator-role">{operator.role}</div>
        <span className={`operator-priority ${operator.priority}`}>{operator.priority}</span>
      </div>
    </button>
  )
}
