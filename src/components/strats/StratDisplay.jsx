import OperatorCard from './OperatorCard'

export default function StratDisplay({ strat, side }) {
  return (
    <div className="strat-display">
      <div className="strat-section">
        <div className="strat-section-title">Operator Lineup</div>
        <div className="operator-grid">
          {strat.operators.map((op) => (
            <OperatorCard key={op.name} operator={op} />
          ))}
        </div>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">{side === 'attack' ? 'Attack' : 'Defense'} Strategy</div>
        <p className="strat-text">{strat.strategy}</p>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">Key Callouts</div>
        <div className="callout-tags">
          {strat.callouts.map((c) => (
            <span key={c} className="callout-tag">{c}</span>
          ))}
        </div>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">Utility Usage</div>
        <ul className="utility-list">
          {strat.utility.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
