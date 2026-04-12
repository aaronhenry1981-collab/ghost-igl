export default function EnemyIntel({ intel }) {
  if (!intel) return null

  return (
    <div className="enemy-intel">
      <div className="strat-section">
        <div className="strat-section-title">{'\uD83D\uDD0D'} Enemy Intel — Predicted Lineup</div>
        <div className="enemy-ops">
          {intel.likelyOps.map((op) => (
            <div key={op.name} className="enemy-op">
              <div className="enemy-op-header">
                <div className="enemy-op-avatar">{op.name.slice(0, 2).toUpperCase()}</div>
                <div className="enemy-op-name">{op.name}</div>
                <div className="enemy-op-rate">{op.pickRate}%</div>
              </div>
              <p className="enemy-op-reason">{op.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">{'\uD83D\uDCCA'} Expected Strategies</div>
        <ul className="enemy-strat-list">
          {intel.commonStrats.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">{'\u26A1'} Watch For</div>
        <ul className="enemy-tendency-list">
          {intel.tendencies.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
