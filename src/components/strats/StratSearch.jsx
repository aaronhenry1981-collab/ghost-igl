import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MAPS from '../../data/maps'
import STRATS from '../../data/strats'

// Flatten every strat into a searchable index once.
function buildIndex() {
  const entries = []
  for (const mapId of Object.keys(STRATS)) {
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) continue
    for (const siteId of Object.keys(STRATS[mapId])) {
      const site = map.sites.find((s) => s.id === siteId)
      if (!site) continue
      for (const side of ['attack', 'defense']) {
        const strat = STRATS[mapId][siteId]?.[side]
        if (!strat) continue
        const opNames = (strat.operators || []).map((o) => o.name)
        const essentialOps = (strat.operators || [])
          .filter((o) => o.priority === 'essential')
          .map((o) => o.name)
        const haystack = [
          map.name,
          site.name,
          side,
          ...opNames,
          ...(strat.callouts || []),
        ]
          .join(' ')
          .toLowerCase()
        entries.push({
          mapId,
          siteId,
          side,
          mapName: map.name,
          siteName: site.name,
          operators: opNames,
          essentialOps,
          callouts: strat.callouts || [],
          haystack,
        })
      }
    }
  }
  return entries
}

function tokenMatch(entry, tokens) {
  // every token must appear somewhere
  for (const t of tokens) {
    if (!entry.haystack.includes(t)) return false
  }
  return true
}

function highlightMatch(entry, tokens) {
  // Decide why this entry matched: list up to 2 specific reasons
  const reasons = []
  for (const t of tokens) {
    for (const op of entry.operators) {
      if (op.toLowerCase().includes(t)) {
        const priority = entry.essentialOps.includes(op) ? 'essential' : 'on lineup'
        reasons.push(`${op} (${priority})`)
        break
      }
    }
    for (const c of entry.callouts) {
      if (c.toLowerCase().includes(t)) {
        reasons.push(`callout: ${c}`)
        break
      }
    }
  }
  return [...new Set(reasons)].slice(0, 2)
}

export default function StratSearch() {
  const [query, setQuery] = useState('')
  const index = useMemo(buildIndex, [])

  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  const results = tokens.length
    ? index
        .filter((e) => tokenMatch(e, tokens))
        .slice(0, 20)
    : []

  return (
    <div className="strat-search">
      <div className="strat-search-wrap">
        <svg className="strat-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          className="strat-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search operators, callouts, or maps (e.g. Thermite, Spiral Stairs, Bank)"
          aria-label="Search strats"
        />
        {query && (
          <button
            type="button"
            className="strat-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {query && (
        <div className="strat-search-results">
          {results.length === 0 ? (
            <div className="strat-search-empty">
              No strats match “{query}”. Try an operator, callout, or map name.
            </div>
          ) : (
            <>
              <div className="strat-search-count">{results.length} match{results.length === 1 ? '' : 'es'}</div>
              <ul className="strat-search-list">
                {results.map((r) => {
                  const reasons = highlightMatch(r, tokens)
                  return (
                    <li key={`${r.mapId}:${r.siteId}:${r.side}`}>
                      <Link
                        to={`/strats/${r.mapId}/${r.siteId}/${r.side}`}
                        className="strat-search-result"
                      >
                        <div className="strat-search-result-main">
                          <span className="strat-search-result-map">{r.mapName}</span>
                          <span className="strat-search-result-sep">/</span>
                          <span className="strat-search-result-site">{r.siteName}</span>
                          <span className={`strat-search-result-side strat-search-result-side-${r.side}`}>
                            {r.side === 'attack' ? 'ATK' : 'DEF'}
                          </span>
                        </div>
                        {reasons.length > 0 && (
                          <div className="strat-search-result-why">
                            {reasons.join(' · ')}
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
