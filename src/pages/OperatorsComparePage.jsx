import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import OPERATORS from '../data/operators'
import MAPS from '../data/maps'

const MAX_SELECTED = 3

function cellLabel(priority) {
  if (!priority) return '—'
  if (priority === 'essential') return 'E'
  if (priority === 'recommended') return 'R'
  return 'F'
}

function StatBar({ label, value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0
  return (
    <div className="cmp-statbar">
      <div className="cmp-statbar-label">{label}</div>
      <div className="cmp-statbar-track">
        <div className="cmp-statbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="cmp-statbar-value">{value}</div>
    </div>
  )
}

export default function OperatorsComparePage() {
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')

  function toggle(name) {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, name]
    })
  }

  const ops = selected.map((name) => OPERATORS.find((o) => o.name === name)).filter(Boolean)

  const filteredRoster = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return OPERATORS.slice(0, 40)
    return OPERATORS.filter(
      (o) => o.name.toLowerCase().includes(q) || o.roles.some((r) => r.toLowerCase().includes(q)),
    ).slice(0, 40)
  }, [query])

  // Build a union of ALL maps/sides where ANY selected operator has presence
  const rows = useMemo(() => {
    if (!ops.length) return []
    const seen = new Map() // key: mapId:siteId:side -> row
    for (const op of ops) {
      for (const s of op.sites) {
        const key = `${s.mapId}:${s.siteId}:${s.side}`
        if (!seen.has(key)) {
          seen.set(key, {
            key,
            mapId: s.mapId,
            mapName: s.mapName,
            siteId: s.siteId,
            siteName: s.siteName,
            side: s.side,
            cells: {}, // opName -> priority
          })
        }
        seen.get(key).cells[op.name] = s.priority
      }
    }
    const out = [...seen.values()]
    // Sort by map then site then side
    out.sort((a, b) => {
      if (a.mapName !== b.mapName) return a.mapName.localeCompare(b.mapName)
      if (a.siteName !== b.siteName) return a.siteName.localeCompare(b.siteName)
      return a.side.localeCompare(b.side)
    })
    return out
  }, [ops])

  // Dynamic stats for the comparison summary
  const summary = useMemo(() => {
    return ops.map((op) => {
      const essential = op.sites.filter((s) => s.priority === 'essential').length
      const recommended = op.sites.filter((s) => s.priority === 'recommended').length
      const atk = op.sites.filter((s) => s.side === 'attack').length
      const def = op.sites.filter((s) => s.side === 'defense').length
      return { name: op.name, role: op.roles[0], essential, recommended, atk, def, total: op.sites.length }
    })
  }, [ops])

  const maxEssential = Math.max(1, ...summary.map((s) => s.essential))
  const maxTotal = Math.max(1, ...summary.map((s) => s.total))

  // Overlap: maps where ALL selected ops appear on at least one site
  const overlap = useMemo(() => {
    if (ops.length < 2) return { sharedMaps: [], uniqueByOp: {} }
    const mapsByOp = ops.map((op) => new Set(op.sites.map((s) => s.mapId)))
    const shared = [...mapsByOp[0]].filter((m) => mapsByOp.every((s) => s.has(m)))
    const sharedMaps = shared.map((id) => MAPS.find((m) => m.id === id)?.name).filter(Boolean).sort()
    const uniqueByOp = {}
    for (let i = 0; i < ops.length; i++) {
      const mine = mapsByOp[i]
      const others = ops.filter((_, j) => j !== i).map((op) => new Set(op.sites.map((s) => s.mapId)))
      const only = [...mine].filter((m) => others.every((o) => !o.has(m)))
      uniqueByOp[ops[i].name] = only.map((id) => MAPS.find((m) => m.id === id)?.name).filter(Boolean).sort()
    }
    return { sharedMaps, uniqueByOp }
  }, [ops])

  return (
    <div className="operators-page cmp-page">
      <Link to="/operators" className="operators-back">← All operators</Link>

      <div className="cmp-header">
        <div className="section-label">Compare</div>
        <h1>Pick up to {MAX_SELECTED} operators</h1>
        <p>Find out where their coverage overlaps, where only one of them matters, and which sites are priorities for your stack.</p>
      </div>

      <div className="cmp-selected-rail">
        {Array.from({ length: MAX_SELECTED }).map((_, i) => {
          const op = ops[i]
          return (
            <div key={i} className={`cmp-slot${op ? ' filled' : ''}`}>
              {op ? (
                <>
                  <div className="cmp-slot-initials">{op.name.slice(0, 2).toUpperCase()}</div>
                  <div className="cmp-slot-meta">
                    <div className="cmp-slot-name">{op.name}</div>
                    <div className="cmp-slot-role">{op.roles[0]}</div>
                  </div>
                  <button type="button" className="cmp-slot-remove" onClick={() => toggle(op.name)} aria-label={`Remove ${op.name}`}>×</button>
                </>
              ) : (
                <div className="cmp-slot-empty">Slot {i + 1} — pick below</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="cmp-roster-controls">
        <input
          type="search"
          placeholder="Search operator name or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="operators-search"
          aria-label="Search roster"
        />
        <div className="cmp-roster-hint">
          {selected.length}/{MAX_SELECTED} picked · click again to remove
        </div>
      </div>

      <div className="cmp-roster">
        {filteredRoster.map((op) => {
          const picked = selected.includes(op.name)
          const disabled = !picked && selected.length >= MAX_SELECTED
          return (
            <button
              key={op.name}
              type="button"
              className={`cmp-roster-chip${picked ? ' picked' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => toggle(op.name)}
              disabled={disabled}
              title={disabled ? `Remove one of your ${MAX_SELECTED} picks first` : op.roles[0]}
            >
              <span className="cmp-roster-chip-initials">{op.name.slice(0, 2).toUpperCase()}</span>
              <span className="cmp-roster-chip-name">{op.name}</span>
              <span className="cmp-roster-chip-count">{op.essentialCount}E</span>
            </button>
          )
        })}
      </div>

      {ops.length > 0 && (
        <>
          <section className="cmp-summary">
            <h2>Summary</h2>
            <div className="cmp-summary-grid">
              {summary.map((s) => (
                <div key={s.name} className="cmp-summary-card">
                  <div className="cmp-summary-name">{s.name}</div>
                  <div className="cmp-summary-role">{s.role}</div>
                  <StatBar label="Essential sites" value={s.essential} max={maxEssential} color="var(--accent)" />
                  <StatBar label="Total sites" value={s.total} max={maxTotal} color="rgba(0, 229, 255, 0.5)" />
                  <div className="cmp-summary-split">
                    <span><strong>{s.atk}</strong> ATK</span>
                    <span><strong>{s.def}</strong> DEF</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {ops.length >= 2 && (
            <section className="cmp-overlap">
              <h2>Overlap</h2>
              {overlap.sharedMaps.length > 0 ? (
                <div className="cmp-overlap-row">
                  <strong>Maps where all {ops.length} show up:</strong>
                  <div className="cmp-overlap-tags">
                    {overlap.sharedMaps.map((m) => <span key={m} className="cmp-overlap-tag">{m}</span>)}
                  </div>
                </div>
              ) : (
                <p className="cmp-overlap-empty">No map has all {ops.length} of these operators in any lineup — they're probably complementary picks for different maps.</p>
              )}
              {Object.entries(overlap.uniqueByOp).map(([name, mapNames]) => (
                mapNames.length > 0 && (
                  <div key={name} className="cmp-overlap-row">
                    <strong>Only <span className="cmp-overlap-op">{name}</span>:</strong>
                    <div className="cmp-overlap-tags">
                      {mapNames.map((m) => <span key={m} className="cmp-overlap-tag cmp-overlap-tag-unique">{m}</span>)}
                    </div>
                  </div>
                )
              ))}
            </section>
          )}

          <section className="cmp-matrix">
            <h2>Site-by-site matrix</h2>
            <p className="cmp-matrix-legend">
              <span className="cmp-legend-key cmp-legend-essential">E</span> Essential
              <span className="cmp-legend-key cmp-legend-recommended">R</span> Recommended
              <span className="cmp-legend-key cmp-legend-flex">F</span> Flex
              <span className="cmp-legend-key">—</span> Not on lineup
            </p>
            <div className="cmp-matrix-wrap">
              <table className="cmp-matrix-table">
                <thead>
                  <tr>
                    <th>Map / Site</th>
                    <th>Side</th>
                    {ops.map((op) => <th key={op.name}>{op.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <Link to={`/strats/${row.mapId}/${row.siteId}/${row.side}`} className="cmp-matrix-link">
                          <strong>{row.mapName}</strong>
                          <span>{row.siteName}</span>
                        </Link>
                      </td>
                      <td>
                        <span className={`cmp-matrix-side cmp-matrix-side-${row.side}`}>
                          {row.side === 'attack' ? 'ATK' : 'DEF'}
                        </span>
                      </td>
                      {ops.map((op) => {
                        const priority = row.cells[op.name]
                        return (
                          <td key={op.name} className={`cmp-matrix-cell cmp-matrix-cell-${priority || 'empty'}`}>
                            {cellLabel(priority)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
