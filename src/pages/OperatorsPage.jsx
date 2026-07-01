import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import OPERATORS, { findOperator } from '../data/operators'
import { useUserRole, operatorFitsRole } from '../hooks/useUserRole'
import { useActiveGame } from '../hooks/useActiveGame'
import GameOperatorsPage from './GameOperatorsPage'
import './OperatorsPage.css'

function SideFilter({ value, onChange }) {
  return (
    <div className="operators-filter">
      {['all', 'attack', 'defense'].map((opt) => (
        <button
          key={opt}
          type="button"
          className={`operators-filter-btn${value === opt ? ' active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt === 'all' ? 'Both sides' : opt === 'attack' ? 'Attack' : 'Defense'}
        </button>
      ))}
    </div>
  )
}

function OperatorsIndex() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sideFilter, setSideFilter] = useState('all')
  const { role: userRole } = useUserRole()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return OPERATORS.map((op) => {
      const sites = sideFilter === 'all' ? op.sites : op.sites.filter((s) => s.side === sideFilter)
      const essential = sites.filter((s) => s.priority === 'essential').length
      const total = sites.length
      return { ...op, sides: sites, essentialInFilter: essential, totalInFilter: total }
    })
      .filter((op) => op.totalInFilter > 0)
      .filter((op) => !q || op.name.toLowerCase().includes(q) || op.roles.some((r) => r.toLowerCase().includes(q)))
  }, [query, sideFilter])

  return (
    <div className="operators-page">
      <div className="operators-header">
        <h1>
          <span className="accent">Operators</span>
        </h1>
        <p>Every operator across every map. Pick one to see where they matter most.</p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.5rem' }}>
          Operator names are property of Ubisoft Entertainment. Recon 6 is fan-made and not
          affiliated with or endorsed by Ubisoft.
        </p>
      </div>

      <div className="operators-controls">
        <input
          type="search"
          placeholder="Search operator or role..."
          className="operators-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search operators"
        />
        <SideFilter value={sideFilter} onChange={setSideFilter} />
        <Link to="/operators/compare" className="btn btn-sm btn-outline operators-compare-link">
          Compare ops →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="operators-empty">No operators match your filters.</div>
      ) : (
        <div className="operators-grid">
          {rows.map((op) => {
            const isYours = userRole && operatorFitsRole({ role: op.roles[0] || '' }, userRole)
            return (
              <button
                key={op.name}
                className={`operator-tile${isYours ? ' your-role' : ''}`}
                onClick={() => navigate(`/operators/${encodeURIComponent(op.name.toLowerCase())}`)}
              >
                {isYours && <span className="operator-tile-yours">Your role</span>}
                <div className="operator-tile-initials">{op.name.slice(0, 2).toUpperCase()}</div>
                <div className="operator-tile-name">{op.name}</div>
                <div className="operator-tile-role">{op.roles[0]}</div>
                <div className="operator-tile-stats">
                  <span className="operator-tile-stat">
                    <strong>{op.essentialInFilter}</strong>
                    <span>essential</span>
                  </span>
                  <span className="operator-tile-stat">
                    <strong>{op.totalInFilter}</strong>
                    <span>total</span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OperatorDetail({ op }) {
  const { role: userRole } = useUserRole()
  const isYours = userRole && operatorFitsRole({ role: op.roles[0] || '' }, userRole)

  // Group sites by map
  const byMap = {}
  for (const s of op.sites) {
    if (!byMap[s.mapId]) byMap[s.mapId] = { mapName: s.mapName, entries: [] }
    byMap[s.mapId].entries.push(s)
  }
  // Sort each map's entries: essential first, then recommended, then by site name
  for (const k of Object.keys(byMap)) {
    byMap[k].entries.sort((a, b) => {
      const p = { essential: 0, recommended: 1, flex: 2 }
      if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority]
      return a.siteName.localeCompare(b.siteName)
    })
  }

  const mapIds = Object.keys(byMap).sort((a, b) =>
    byMap[a].mapName.localeCompare(byMap[b].mapName),
  )

  return (
    <div className="operators-page">
      <Link to="/operators" className="operators-back">← All operators</Link>

      <div className="operator-detail-header">
        <div className={`operator-detail-initials${isYours ? ' your-role' : ''}`}>
          {op.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="operator-detail-title">
          <h1>{op.name}</h1>
          <div className="operator-detail-roles">
            {op.roles.map((r) => (
              <span key={r} className="operator-detail-role-tag">{r}</span>
            ))}
          </div>
          {isYours && (
            <div className="operator-detail-you-flag">
              Your role ({userRole}) — pick them up when you see them in a lineup.
            </div>
          )}
        </div>
        <div className="operator-detail-stats">
          <div className="operator-detail-stat">
            <strong>{op.essentialCount}</strong>
            <span>Essential sites</span>
          </div>
          <div className="operator-detail-stat">
            <strong>{op.recommendedCount}</strong>
            <span>Recommended</span>
          </div>
          <div className="operator-detail-stat">
            <strong>{op.totalSites}</strong>
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="operator-detail-maps">
        {mapIds.map((mapId) => {
          const { mapName, entries } = byMap[mapId]
          return (
            <section key={mapId} className="operator-detail-map">
              <h2>{mapName}</h2>
              <ul className="operator-detail-sites">
                {entries.map((e) => (
                  <li key={`${e.siteId}:${e.side}`}>
                    <Link
                      to={`/strats/${e.mapId}/${e.siteId}/${e.side}`}
                      className={`operator-detail-site operator-detail-site-${e.priority}`}
                    >
                      <span className="operator-detail-site-name">{e.siteName}</span>
                      <span className={`operator-detail-site-side operator-detail-site-side-${e.side}`}>
                        {e.side === 'attack' ? 'ATK' : 'DEF'}
                      </span>
                      <span className={`operator-detail-site-priority operator-detail-site-priority-${e.priority}`}>
                        {e.priority}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default function OperatorsPage() {
  const { isR6 } = useActiveGame()
  if (!isR6) return <GameOperatorsPage />
  return <R6OperatorsPage />
}

function R6OperatorsPage() {
  const { opName } = useParams()
  if (!opName) return <OperatorsIndex />
  const op = findOperator(decodeURIComponent(opName))
  if (!op) {
    return (
      <div className="operators-page">
        <Link to="/operators" className="operators-back">← All operators</Link>
        <div className="operators-empty">No operator named “{opName}”.</div>
      </div>
    )
  }
  return <OperatorDetail op={op} />
}
