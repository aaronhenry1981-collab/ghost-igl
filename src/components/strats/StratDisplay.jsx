import { useState } from 'react'
// Own our styles so StratDisplay is never rendered unstyled — the landing-page
// preview embedded this without StratsPage.css and it rendered as raw stacked
// text (Aaron, 2026-07-20). Importing here guarantees it's styled everywhere.
import '../../pages/StratsPage.css'
import OperatorCard from './OperatorCard'
import ProGate from './ProGate'
import ChampionGate from './ChampionGate'
import TacticalRoundPlan from './TacticalRoundPlan'
import GameplayDecisionGallery from './GameplayDecisionGallery'
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

// Camera-ish callouts on a site — CCTV rooms, security/surveillance spots.
// Derived from the site's OWN callout list, so nothing is invented.
const CAM_CALLOUT = /\b(cctv|security|surveillance|camera|cams?|control room|monitor)\b/i

function attackCamNotes(strat) {
  // A per-site override wins if the data provides one (fill exact default-cam
  // spots from footage later); otherwise derive from real callouts.
  if (Array.isArray(strat.attackCams) && strat.attackCams.length) return strat.attackCams
  const named = (strat.callouts || []).filter((c) => CAM_CALLOUT.test(c))
  const notes = [
    'Shoot the default security cameras covering your entry and the objective before you commit — every live cam is free intel for dead defenders and roamers.',
  ]
  if (named.length) {
    notes.push(`On this site the ${named.join(' and ')} area${named.length > 1 ? 's carry' : ' carries'} known cams — clear ${named.length > 1 ? 'them' : 'it'} on approach.`)
  }
  notes.push('If the enemy has Valkyrie, Maestro, Echo, or Mozzie, expect extra hidden cams — clear those too before the push.')
  return notes
}

// Callouts read straight off real match footage, with the evidence attached.
// This exists because a Champion cancelled on 2026-07-18 calling the content
// "AI slop", and he was right: the strat data was generated, and the word
// "Verified" appears 196 times in it emitted by a script that verified nothing.
// Everything in this block was actually on screen, and says how many frames and
// how many separate recordings back it.
function isVerifiedName(verified, name) {
  if (!verified || !name) return false
  const key = String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return [...(verified.sites || []), ...(verified.spawns || []), ...(verified.callouts || [])].some((entry) => {
    const normalized = String(entry?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    return normalized === key || normalized.includes(key) || key.includes(normalized)
  })
}

function VerifiedCallouts({ verified: v }) {
  if (!v || !v.callouts?.length) return null
  const shown = v.callouts.slice(0, 18)
  return (
    <div className="strat-section">
      <div className="strat-section-title">
        Verified Callouts{' '}
        <span className="strat-section-hint">
          read off {v.framesRead} frames from {v.sessions} recorded {v.sessions === 1 ? 'match' : 'matches'}
        </span>
      </div>
      <div className="callout-tags">
        {shown.map((c) => (
          <CalloutTag key={c.floor ? `${c.floor} ${c.name}` : c.name} label={c.floor ? `${c.floor} ${c.name}` : c.name} />
        ))}
      </div>
      {!!v.spawns?.length && (
        <p className="strat-text" style={{ marginTop: '0.6rem', fontSize: '0.86rem', opacity: 0.85 }}>
          <strong>Attacker spawns on this map:</strong>{' '}
          {v.spawns.map((s) => s.name).join(' · ')}
        </p>
      )}
    </div>
  )
}

export default function StratDisplay({ strat, side, gated, verifiedCallouts, mapId, mapName, siteId, siteName }) {
  const { role: userRole } = useUserRole()
  const matches = userRole ? strat.operators.filter((o) => operatorFitsRole(o, userRole)) : []
  // Flag any listed callout the footage does NOT back, so nothing here is
  // presented with more confidence than the evidence supports.
  const hasFootage = !!verifiedCallouts

  return (
    <div className="strat-display">
      <div
        className="strat-beta-notice"
        role="note"
        style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'flex-start',
          margin: '0 0 1rem',
          padding: '0.65rem 0.85rem',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'rgba(245, 158, 11, 0.08)',
          fontSize: '0.85rem',
          lineHeight: 1.45,
          color: 'var(--text-secondary, #cbd5e1)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1.3 }}>
          {'\u{1F6E0}'}
        </span>
        <span>
          <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>Strats are in beta.</strong>{' '}
          They&rsquo;re AI-assisted and we&rsquo;re reviewing every map with real players right now.
          If a callout or setup looks off, tell us in{' '}
          <a
            href="https://discord.gg/namGQqs3jb"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent, #f59e0b)', fontWeight: 600 }}
          >
            Discord
          </a>{' '}
          and we&rsquo;ll fix it fast.
        </span>
      </div>

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

      <TacticalRoundPlan
        strat={strat}
        side={side}
        mapId={mapId}
        mapName={mapName}
        siteName={siteName}
      />

      <GameplayDecisionGallery mapId={mapId} siteId={siteId} side={side} />

      <div className="strat-section">
        <div className="strat-section-title">Operator Lineup</div>
        <div className="operator-grid">
          {strat.operators.map((op) => (
            <OperatorCard
              key={op.name}
              operator={op}
              roleMatch={userRole ? operatorFitsRole(op, userRole) : false}
              roundContext={{ mapId, siteId, side }}
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
        {hasFootage && strat.callouts.some((c) => !isVerifiedName(verifiedCallouts, c)) && (
          <p className="strat-section-hint" style={{ marginTop: '0.45rem', display: 'block' }}>
            Not yet confirmed against footage:{' '}
            {strat.callouts.filter((c) => !isVerifiedName(verifiedCallouts, c)).join(', ')}
          </p>
        )}
      </div>

      <VerifiedCallouts verified={verifiedCallouts} />

      {side === 'attack' && (
        <div className="strat-section">
          <div className="strat-section-title">
            Cameras to Clear <span className="strat-section-hint">(shoot on entry)</span>
          </div>
          <ul className="utility-list">
            {attackCamNotes(strat).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

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
