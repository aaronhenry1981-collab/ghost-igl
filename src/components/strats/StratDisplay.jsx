import { useState } from 'react'
import OperatorCard from './OperatorCard'
import ProGate from './ProGate'
import ChampionGate from './ChampionGate'
import { useUserRole, operatorFitsRole } from '../../hooks/useUserRole'

function CalloutTag({ label }) {
  const [copied, setCopied] = useState(false)
  async function copy(e) {
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(label)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard blocked - silently no-op
    }
  }
  return (
    <button
      type="button"
      className={`callout-tag${copied ? ' copied' : ''}`}
      onClick={copy}
      title={`Copy "${label}" to clipboard`}
      aria-label={`Copy callout ${label}`}
    >
      {copied ? '\u2713 Copied' : label}
    </button>
  )
}

export default function StratDisplay({ strat, side, gated }) {
  const { role: userRole } = useUserRole()
  const matches = userRole ? strat.operators.filter((o) => operatorFitsRole(o, userRole)) : []

  return (
    <div className="strat-display">
      {userRole && matches.length > 0 && (
        <div className="strat-role-banner">
          <span className="strat-role-banner-label">Playing {userRole}?</span>
          <span className="strat-role-banner-pick">
            Lock in{' '}
            <strong>{matches.map((m) => m.name).join(' or ')}</strong>
            {' '}—{' '}
            {matches.map((m) => m.role).join(' / ')}
          </span>
        </div>
      )}

      <div className="strat-section">
        <div className="strat-section-title">Operator Lineup</div>
        <div className="operator-grid">
          {strat.operators.map((op) => (
            <OperatorCard
              key={op.name}
              operator={op}
              roleMatch={userRole ? operatorFitsRole(op, userRole) : false}
            />
          ))}
        </div>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">{side === 'attack' ? 'Attack' : 'Defense'} Strategy</div>
        <p className="strat-text">{strat.strategy}</p>
      </div>

      <div className="strat-section">
        <div className="strat-section-title">
          Key Callouts <span className="strat-section-hint">(click to copy)</span>
        </div>
        <div className="callout-tags">
          {strat.callouts.map((c) => (
            <CalloutTag key={c} label={c} />
          ))}
        </div>
      </div>

      {gated ? (
        <ProGate label="Utility Breakdown">
          <div className="strat-section">
            <div className="strat-section-title">Utility Usage</div>
            <ul className="utility-list">
              {strat.utility.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        </ProGate>
      ) : (
        <div className="strat-section">
          <div className="strat-section-title">Utility Usage</div>
          <ul className="utility-list">
            {strat.utility.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      {strat.premiumTactics && (
        <ChampionGate label="Champion Premium Tactics">
          <PremiumTactics tactics={strat.premiumTactics} side={side} />
        </ChampionGate>
      )}
    </div>
  )
}

// Renders the per-site Champion-only premium tactics block. Schema (per side):
//
//   premiumTactics: {
//     attackSpawns?: [{ spawn: 'Front Yard', from: '...', use: '...' }],
//     spawnKillSpots?: [{ from: 'Window X', target: 'Spawn Y', risk: '...', reward: '...' }],
//     advancedSetups?: ['Setup string ...'],
//     runouts?: [{ from: '...', target: '...', timing: '...' }],
//     antiSpawnPeek?: ['Reinforcement / cam / utility note ...'],
//   }
//
// All sub-fields are optional — render only the ones that exist so partial
// content can ship without breaking the layout.
function PremiumTactics({ tactics, side }) {
  const isAttack = side === 'attack'
  const spawns = tactics.attackSpawns
  const spawnKills = tactics.spawnKillSpots
  const setups = tactics.advancedSetups
  const runouts = tactics.runouts
  const antiPeek = tactics.antiSpawnPeek

  return (
    <div className="strat-section premium-tactics">
      <div className="strat-section-title" style={{ color: '#00e5ff' }}>
        ★ Champion Tactics — {isAttack ? 'Attack' : 'Defense'}
      </div>

      {isAttack && Array.isArray(spawns) && spawns.length > 0 && (
        <div className="premium-block" style={{ marginTop: '0.75rem' }}>
          <div className="premium-block-title" style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
            Attack Spawn Locations
          </div>
          <ul className="utility-list">
            {spawns.map((s, i) => (
              <li key={`spawn-${i}`}>
                <strong>{s.spawn}</strong>
                {s.from ? ` — ${s.from}` : ''}
                {s.use ? `. ${s.use}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(spawnKills) && spawnKills.length > 0 && (
        <div className="premium-block" style={{ marginTop: '0.75rem' }}>
          <div className="premium-block-title" style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
            Spawn-Kill Spots {isAttack ? '(deny their roam)' : '(punish their entry)'}
          </div>
          <ul className="utility-list">
            {spawnKills.map((sk, i) => (
              <li key={`sk-${i}`}>
                <strong>{sk.from}</strong> → {sk.target}
                {sk.risk ? ` · risk: ${sk.risk}` : ''}
                {sk.reward ? ` · reward: ${sk.reward}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isAttack && Array.isArray(runouts) && runouts.length > 0 && (
        <div className="premium-block" style={{ marginTop: '0.75rem' }}>
          <div className="premium-block-title" style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
            Runout Windows
          </div>
          <ul className="utility-list">
            {runouts.map((r, i) => (
              <li key={`r-${i}`}>
                <strong>{r.from}</strong> → {r.target}
                {r.timing ? ` (${r.timing})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isAttack && Array.isArray(antiPeek) && antiPeek.length > 0 && (
        <div className="premium-block" style={{ marginTop: '0.75rem' }}>
          <div className="premium-block-title" style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
            Anti Spawn-Peek Setup
          </div>
          <ul className="utility-list">
            {antiPeek.map((a, i) => (<li key={`ap-${i}`}>{a}</li>))}
          </ul>
        </div>
      )}

      {Array.isArray(setups) && setups.length > 0 && (
        <div className="premium-block" style={{ marginTop: '0.75rem' }}>
          <div className="premium-block-title" style={{ fontWeight: 700, marginBottom: '0.4rem' }}>
            Advanced Setups
          </div>
          <ul className="utility-list">
            {setups.map((s, i) => (<li key={`adv-${i}`}>{s}</li>))}
          </ul>
        </div>
      )}
    </div>
  )
}
