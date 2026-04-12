export default function BanDisplay({ bans, side }) {
  const attackBans = bans.attack || []
  const defenseBans = bans.defense || []

  // When attacking, you ban defenders. When defending, you ban attackers.
  const yourBans = side === 'attack' ? defenseBans : attackBans
  const enemyBans = side === 'attack' ? attackBans : defenseBans
  const yourLabel = side === 'attack' ? 'Ban These Defenders' : 'Ban These Attackers'
  const enemyLabel = side === 'attack' ? 'Expect Attacker Bans' : 'Expect Defender Bans'

  return (
    <div className="ban-display">
      <div className="ban-section">
        <div className="ban-section-title">
          <span className="ban-icon">{'\uD83D\uDEAB'}</span> {yourLabel}
        </div>
        <div className="ban-cards">
          {yourBans.map((ban) => (
            <div key={ban.name} className="ban-card ban-yours">
              <div className="ban-card-header">
                <div className="ban-avatar">{ban.name.slice(0, 2).toUpperCase()}</div>
                <div className="ban-name">{ban.name}</div>
                <span className="ban-tag">BAN</span>
              </div>
              <p className="ban-reason">{ban.reason}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="ban-section">
        <div className="ban-section-title">
          <span className="ban-icon">{'\u26A0\uFE0F'}</span> {enemyLabel}
        </div>
        <div className="ban-cards">
          {enemyBans.map((ban) => (
            <div key={ban.name} className="ban-card ban-enemy">
              <div className="ban-card-header">
                <div className="ban-avatar">{ban.name.slice(0, 2).toUpperCase()}</div>
                <div className="ban-name">{ban.name}</div>
                <span className="ban-tag warn">LIKELY</span>
              </div>
              <p className="ban-reason">{ban.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
