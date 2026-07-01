import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameData } from '../hooks/useGameData'
import { useActiveGame } from '../hooks/useActiveGame'
import { useAuth } from '../hooks/useAuth'
import SignInGate from '../components/SignInGate'
import './LoadoutsPage.css'

// Loadouts page — game-aware. Reads LOADOUTS from the active game's data
// registry and renders a clean per-section card layout. Works for every
// game because the LOADOUTS shape is "an object of named sections, each
// with a name + role + summary + arbitrary structured content."
//
// We render any nested object/array intelligently:
//   - strings → paragraph
//   - arrays of strings → bulleted list
//   - arrays of objects → mini-table
//   - nested objects → grouped sub-section

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function ValueRender({ value }) {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') {
    return <p className="loadout-text">{String(value)}</p>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    if (typeof value[0] === 'string') {
      return (
        <ul className="loadout-list">
          {value.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )
    }
    if (isPlainObject(value[0])) {
      return (
        <div className="loadout-rows">
          {value.map((row, i) => (
            <div className="loadout-row" key={i}>
              {Object.entries(row).map(([k, v]) => (
                <div className="loadout-row-field" key={k}>
                  <span className="loadout-row-key">{titleCase(k)}</span>
                  <span className="loadout-row-val">
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }
  }
  if (isPlainObject(value)) {
    return (
      <div className="loadout-subgroup">
        {Object.entries(value).map(([k, v]) => (
          <div className="loadout-subentry" key={k}>
            <h5 className="loadout-subkey">{titleCase(k)}</h5>
            <ValueRender value={v} />
          </div>
        ))}
      </div>
    )
  }
  return null
}

function titleCase(s) {
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function LoadoutSection({ id, section }) {
  const { name, role, summary, ...rest } = section
  return (
    <article className="loadout-section" id={id}>
      <header className="loadout-section-head">
        <div>
          <h2 className="loadout-section-title">{name || titleCase(id)}</h2>
          {role && <span className="loadout-section-role">{role}</span>}
        </div>
      </header>
      {summary && <p className="loadout-section-summary">{summary}</p>}
      <div className="loadout-section-body">
        {Object.entries(rest).map(([k, v]) => (
          <div className="loadout-block" key={k}>
            <h4 className="loadout-block-title">{titleCase(k)}</h4>
            <ValueRender value={v} />
          </div>
        ))}
      </div>
    </article>
  )
}

export default function LoadoutsPage() {
  const { user, loading: authLoading } = useAuth()
  const { activeGameId, isR6 } = useActiveGame()
  const { data, loading, error, gameMeta } = useGameData()
  const [activeSectionId, setActiveSectionId] = useState(null)

  // Gate behind sign-in. Static SEO pages at /games/<id>/loadouts.html stay
  // public for Google indexing; the interactive in-app tool requires an
  // account so we can save settings, drive the 7-day Pro trial, and keep
  // competitors from scraping the full curated picks.
  if (!authLoading && !user) {
    return <SignInGate
      feature="Loadouts"
      gameMeta={gameMeta}
      benefits={[
        'Real weapon priorities, ability combos, and team-comp picks',
        'Switches with your active game — all 20 supported games covered',
        '7-day Pro trial on signup — VOD breakdowns, ban intel, opponent reads',
      ]}
    />
  }

  const accent = gameMeta.color || '#00e5ff'
  const displayName = gameMeta.displayName || gameMeta.name || activeGameId
  const loadouts = data?.LOADOUTS

  if (loading) {
    return (
      <div className="loadouts-page">
        <div className="loadouts-loading">Loading {displayName} loadouts…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="loadouts-page">
        <div className="loadouts-empty">
          <h1>Could not load loadouts</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!loadouts || Object.keys(loadouts).length === 0) {
    return (
      <div className="loadouts-page">
        <div className="loadouts-empty">
          <h1>{displayName} loadouts coming soon</h1>
          <p>Loadout data for {displayName} is being curated. R6, CS2, Valorant, OW2, Apex, MVR, Halo, The Finals, CoD, and Fortnite all have full loadouts in the catalog.</p>
          <Link to="/strats" className="btn btn-primary">Open strats</Link>
        </div>
      </div>
    )
  }

  const sectionEntries = Object.entries(loadouts)
  const currentId = activeSectionId || sectionEntries[0]?.[0]
  const currentSection = currentId ? loadouts[currentId] : null

  return (
    <div className="loadouts-page">
      <header className="loadouts-header" style={{ borderColor: accent }}>
        <div className="loadouts-eyebrow" style={{ color: accent }}>
          {displayName} · Loadouts
        </div>
        <h1>What to <span style={{ color: accent }}>pick</span> — and why</h1>
        <p>
          Loadouts, weapon priorities, and team-comp combos for {displayName}.
          Use these before the round starts so you walk in with the right gun, the right ability,
          and the right plan.
        </p>
      </header>

      <div className="loadouts-layout">
        {sectionEntries.length > 1 && (
          <nav className="loadouts-nav" aria-label="Loadout sections">
            {sectionEntries.map(([id, sec]) => (
              <button
                type="button"
                key={id}
                className={`loadouts-nav-btn${id === currentId ? ' active' : ''}`}
                onClick={() => setActiveSectionId(id)}
                style={id === currentId ? { borderColor: accent, color: accent } : undefined}
              >
                <span className="loadouts-nav-name">{sec.name || titleCase(id)}</span>
                {sec.role && <span className="loadouts-nav-role">{sec.role}</span>}
              </button>
            ))}
          </nav>
        )}

        <div className="loadouts-content">
          {currentSection && <LoadoutSection id={currentId} section={currentSection} />}
        </div>
      </div>

      <div className="loadouts-foot">
        <p>
          {isR6
            ? 'Need site-by-site picks? Open the Strats tool, pick a map and side, see operators that fit each site.'
            : `Want the strats that pair with these loadouts? Open the ${displayName} catalog at /games/${activeGameId}/.`}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/strats" className="btn btn-primary">Open strats</Link>
          <Link to="/match-prep" className="btn btn-outline">Match prep cheatsheet</Link>
        </div>
      </div>
    </div>
  )
}
