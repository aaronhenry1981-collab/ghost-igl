import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { track } from '../utils/analytics'
import './R6TierListPage.css'

// OW2 Stadium hero tier list — built on the same engine as the R6 op
// tier list, but scoped to the 11 Stadium maps only (NOT regular OW2,
// which has different mechanics).
//
// Lazy-loads the OW2 data on mount so we don't bundle 391KB of OW2
// strats into the main app shell for users who never visit this page.
//
// Why a separate Stadium tier list: Stadium is a fundamentally different
// mode (Cash economy, Power picks, BO7 round structure) with a smaller
// hero pool than live OW2. A combined tier list would mislead. This one
// answers "which heroes carry hardest IN STADIUM."

const PRIORITY_WEIGHT = { essential: 3, recommended: 2, flex: 1 }
const TIER_ORDER = ['S', 'A', 'B', 'C']
const TIER_LABEL = {
  S: 'S-tier · Must pick',
  A: 'A-tier · Strong pick',
  B: 'B-tier · Situational',
  C: 'C-tier · Niche / flex',
}
const TIER_COLOR = {
  S: '#ff8a8a',
  A: '#ffc97a',
  B: '#00e5ff',
  C: 'rgba(230,233,239,0.6)',
}

function buildStadiumTierList(maps, strats) {
  const stadiumMaps = maps.filter((m) => m.type === 'Stadium')
  const stadiumIds = new Set(stadiumMaps.map((m) => m.id))
  const index = {}
  for (const mapId of Object.keys(strats)) {
    if (!stadiumIds.has(mapId)) continue
    for (const siteId of Object.keys(strats[mapId])) {
      for (const side of ['attack', 'defense']) {
        const strat = strats[mapId][siteId]?.[side]
        if (!strat?.operators) continue
        for (const op of strat.operators) {
          // Combine both sides since in Stadium "attack" and "defense" are
          // round-by-round designations within the same match — same hero
          // plays both. One tier list per hero, not per side.
          if (!index[op.name]) {
            index[op.name] = {
              name: op.name,
              role: op.role,
              score: 0,
              essential: 0,
              recommended: 0,
              flex: 0,
              siteCount: 0,
              maps: new Set(),
            }
          }
          const entry = index[op.name]
          entry.score += PRIORITY_WEIGHT[op.priority] || 0
          entry[op.priority] = (entry[op.priority] || 0) + 1
          entry.siteCount += 1
          entry.maps.add(mapId)
          if (!entry.role || op.role.length > entry.role.length) entry.role = op.role
        }
      }
    }
  }
  const all = Object.values(index)
  const scores = all.map((e) => e.score).sort((a, b) => b - a)
  const tierBreaks = {
    S: scores[Math.floor(scores.length * 0.10)] || 0,
    A: scores[Math.floor(scores.length * 0.30)] || 0,
    B: scores[Math.floor(scores.length * 0.60)] || 0,
  }
  for (const e of all) {
    e.mapCount = e.maps.size
    delete e.maps
    if (e.score >= tierBreaks.S) e.tier = 'S'
    else if (e.score >= tierBreaks.A) e.tier = 'A'
    else if (e.score >= tierBreaks.B) e.tier = 'B'
    else e.tier = 'C'
  }
  all.sort((a, b) => b.score - a.score || b.essential - a.essential)
  return { ops: all, mapCount: stadiumMaps.length }
}

function groupByTier(list) {
  const out = { S: [], A: [], B: [], C: [] }
  for (const op of list) out[op.tier].push(op)
  return out
}

const ROLE_TABS = ['All', 'Tank', 'DPS', 'Support']

export default function OW2StadiumTierListPage() {
  const [data, setData] = useState(null)
  const [roleFilter, setRoleFilter] = useState('All')
  const [error, setError] = useState(null)

  // Lazy-load OW2 data — keeps the page-tier bundle tiny for users
  // who don't visit, but the data is identical to what GameStratsPage
  // consumes when you switch the active game to OW2.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('../data/games/ow2/maps.js'),
      import('../data/games/ow2/strats.js'),
    ])
      .then(([mapsMod, stratsMod]) => {
        if (cancelled) return
        setData(buildStadiumTierList(mapsMod.default, stratsMod.default))
      })
      .catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    if (roleFilter === 'All') return data.ops
    return data.ops.filter((op) => (op.role || '').toLowerCase().includes(roleFilter.toLowerCase()))
  }, [data, roleFilter])

  const grouped = useMemo(() => groupByTier(filtered), [filtered])

  const itemListLd = useMemo(() => {
    if (!data) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'OW2 Stadium Hero Tier List — Recon 6',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: data.ops.length,
      itemListElement: data.ops.slice(0, 20).map((op, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: op.name,
        description: `${op.tier}-tier ${op.role} — ${op.essential} essential / ${op.recommended} recommended Stadium picks across ${op.mapCount} maps`,
      })),
    }
  }, [data])

  if (error) {
    return (
      <div className="r6-tier-page">
        <div className="r6-tier-foot">Couldn't load OW2 data: {error}</div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="r6-tier-page">
        <header className="r6-tier-header">
          <div className="r6-tier-eyebrow">OW2 Stadium · Hero tier list · Updated automatically</div>
          <h1>OW2 Stadium <span className="r6-tier-accent">Tier List</span></h1>
          <p className="r6-tier-lead">Loading Stadium data…</p>
        </header>
      </div>
    )
  }

  return (
    <div className="r6-tier-page">
      <header className="r6-tier-header">
        <div className="r6-tier-eyebrow">OW2 Stadium · Hero tier list · Updated automatically</div>
        <h1>OW2 Stadium <span className="r6-tier-accent">Tier List</span></h1>
        <p className="r6-tier-lead">
          Computed from {data.mapCount} ranked Stadium maps (Clash / Control / Push).
          Each hero is scored by how often they're tagged <strong>essential</strong> (3 pts),
          <strong> recommended</strong> (2 pts), or <strong>flex</strong> (1 pt) across Stadium map sites.
          Stadium has a smaller hero pool than live OW2 — this list reflects only the heroes that
          appear in actual Stadium strats. Tied scores broken by essential-pick count.
        </p>
        <p className="r6-tier-cite-line">
          <strong>Citing this list?</strong> Use: <em>"Recon 6 OW2 Stadium Tier List, r6coaching.com/#/tools/ow2-stadium-tier-list"</em>
        </p>
      </header>

      <div className="r6-tier-side-toggle">
        {ROLE_TABS.map((r) => (
          <button
            key={r}
            type="button"
            className={`r6-tier-side-btn${roleFilter === r ? ' active' : ''}`}
            style={roleFilter === r ? { background: 'rgba(255, 201, 122, 0.18)', borderColor: '#ffc97a', color: '#ffc97a' } : undefined}
            onClick={() => { setRoleFilter(r); track('Stadium Tier Role Filter', { role: r }) }}
          >
            {r}
          </button>
        ))}
      </div>

      {TIER_ORDER.map((tier) => (
        <section key={tier} className={`r6-tier-row tier-${tier}`}>
          <header className="r6-tier-row-head" style={{ borderColor: TIER_COLOR[tier] }}>
            <div className="r6-tier-badge" style={{ background: TIER_COLOR[tier], color: '#0a0f19' }}>{tier}</div>
            <div className="r6-tier-row-title">{TIER_LABEL[tier]}</div>
            <div className="r6-tier-row-count">{grouped[tier].length} heroes</div>
          </header>
          {grouped[tier].length === 0 ? (
            <div className="r6-tier-empty">No heroes in this tier for {roleFilter === 'All' ? 'Stadium' : roleFilter}.</div>
          ) : (
            <div className="r6-tier-grid">
              {grouped[tier].map((op) => (
                <div key={op.name} className="r6-tier-op-card" style={{ borderLeftColor: TIER_COLOR[tier] }}>
                  <div className="r6-tier-op-head">
                    <span className="r6-tier-op-name">{op.name}</span>
                    <span className="r6-tier-op-score">{op.score} pts</span>
                  </div>
                  <div className="r6-tier-op-role">{op.role}</div>
                  <div className="r6-tier-op-stats">
                    {op.essential > 0 && <span className="r6-tier-stat ess">{op.essential} essential</span>}
                    {op.recommended > 0 && <span className="r6-tier-stat rec">{op.recommended} rec</span>}
                    {op.flex > 0 && <span className="r6-tier-stat flex">{op.flex} flex</span>}
                    <span className="r6-tier-stat maps">{op.mapCount} {op.mapCount === 1 ? 'map' : 'maps'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <section className="r6-tier-methodology">
        <h2>Methodology</h2>
        <p>
          Aggregated from Recon 6's per-site Stadium strats across {data.mapCount} maps in the current
          Stadium ranked rotation. Both attack and defense rounds are pooled — Stadium is round-by-round
          side flipping, not split-half like live OW2.
        </p>
        <ul>
          <li><strong>Essential (3 pts):</strong> hero is core to the site's standard Stadium plan</li>
          <li><strong>Recommended (2 pts):</strong> strong supporting pick that elevates the plan</li>
          <li><strong>Flex (1 pt):</strong> situational pick that works on this site with specific Power / Item builds</li>
        </ul>
        <p>
          Tier thresholds: top 10% = S, next 20% = A, next 30% = B, rest = C. Stadium build literacy
          matters as much as hero choice — see the <Link to="/blog/ow2-stadium-guide.html">Stadium build guide</Link> for
          Power and Item picks per hero.
        </p>
      </section>

      <footer className="r6-tier-foot">
        <p>
          Stadium strats are <Link to="/strats/stadium-busan/point/attack">Pro-only on Recon 6</Link> —
          per-map Cash priorities, Power picks, Item shop builds, and round-7 closeouts. Founding rate $9/mo locked for life through May 31.
        </p>
      </footer>

      {/* JSON.stringify of our own object — no user input, XSS-safe */}
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}
    </div>
  )
}
