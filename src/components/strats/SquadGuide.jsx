export default function SquadGuide({ guide, operators }) {
  // Suggest which operators from the current lineup to prioritize based on squad size
  function getPickSuggestions() {
    if (!operators || operators.length === 0) return null
    const bestRoleSet = new Set(
      guide.bestRoles.flatMap((r) => r.toLowerCase().split(/[+/,]/).map((s) => s.trim()))
    )
    const suggested = operators.filter((op) => {
      const role = op.role.toLowerCase()
      return bestRoleSet.has(role) || guide.bestRoles.some((br) =>
        role.includes(br.toLowerCase()) || br.toLowerCase().includes(role)
      )
    })
    // If no matches, just return essential operators
    if (suggested.length === 0) {
      return operators.filter((op) => op.priority === 'essential')
    }
    return suggested
  }

  const picks = operators ? getPickSuggestions() : null

  return (
    <div className="squad-guide">
      <div className="squad-guide-header">
        <div className="squad-guide-badge">{guide.label}</div>
        <div className="squad-guide-role">{guide.yourRole}</div>
      </div>
      <p className="squad-guide-desc">{guide.description}</p>

      {picks && picks.length > 0 && (
        <div className="squad-guide-section">
          <div className="squad-guide-section-title">{'\uD83C\uDFAF'} Your Best Picks From This Lineup</div>
          <div className="squad-picks">
            {picks.map((op) => (
              <div key={op.name} className="squad-pick">
                <span className="squad-pick-name">{op.name}</span>
                <span className="squad-pick-role">{op.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="squad-guide-section">
        <div className="squad-guide-section-title">{'\u2705'} Priorities</div>
        <ul className="squad-guide-list">
          {guide.priorities.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      {guide.bestRoles.length > 0 && (
        <div className="squad-guide-section">
          <div className="squad-guide-section-title">{'\uD83D\uDCAA'} Best Roles</div>
          <div className="squad-role-tags">
            {guide.bestRoles.map((r) => (
              <span key={r} className="squad-role-tag good">{r}</span>
            ))}
          </div>
        </div>
      )}

      {guide.avoidRoles.length > 0 && (
        <div className="squad-guide-section">
          <div className="squad-guide-section-title">{'\u26A0\uFE0F'} Avoid</div>
          <div className="squad-role-tags">
            {guide.avoidRoles.map((r) => (
              <span key={r} className="squad-role-tag bad">{r}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
