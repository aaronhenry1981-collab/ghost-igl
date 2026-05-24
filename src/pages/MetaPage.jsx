import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import META from '../data/meta'
import { useUserRole, operatorFitsRole } from '../hooks/useUserRole'
import { useActiveGame } from '../hooks/useActiveGame'
import GameMetaPage from './GameMetaPage'
import './MetaPage.css'

function SideFilter({ value, onChange }) {
  return (
    <div className="meta-filter">
      {[
        { id: 'all', label: 'Both sides' },
        { id: 'attack', label: 'Attack' },
        { id: 'defense', label: 'Defense' },
      ].map((opt) => (
        <button
          key={opt.id}
          className={`meta-filter-btn${value === opt.id ? ' active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function OperatorLeaderboard({ side }) {
  const rows = useMemo(() => {
    const list = META.opBoard
      .map((op) => {
        const essential = side === 'all' ? op.essential : side === 'attack' ? op.atkEssential : op.defEssential
        const total = side === 'all' ? op.total : side === 'attack' ? op.atkTotal : op.defTotal
        return { ...op, filteredEssential: essential, filteredTotal: total }
      })
      .filter((op) => op.filteredTotal > 0)
      .sort((a, b) => b.filteredEssential - a.filteredEssential || b.filteredTotal - a.filteredTotal || a.name.localeCompare(b.name))
    return list.slice(0, 20)
  }, [side])

  const maxEssential = rows[0]?.filteredEssential || 1
  const { role: userRole } = useUserRole()

  return (
    <div className="meta-card">
      <div className="meta-card-header">
        <h2>Top essential picks</h2>
        <p>Operators that show up as essential on the most ranked-pool sites.</p>
      </div>
      <ol className="meta-board">
        {rows.map((op, idx) => {
          const pct = Math.max(6, (op.filteredEssential / maxEssential) * 100)
          const isYours = userRole && operatorFitsRole({ role: op.role || '' }, userRole)
          return (
            <li key={op.name} className={`meta-board-row${isYours ? ' your-role' : ''}`}>
              <span className="meta-board-rank">{idx + 1}</span>
              <Link
                to={`/operators/${encodeURIComponent(op.name.toLowerCase())}`}
                className="meta-board-name"
              >
                {op.name}
                {isYours && <span className="meta-board-yours">YOUR ROLE</span>}
                <span className="meta-board-role">{op.role}</span>
              </Link>
              <div className="meta-board-bar">
                <div
                  className="meta-board-bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="meta-board-value">
                <strong>{op.filteredEssential}</strong>
                <span>essential</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function BanBoard({ side }) {
  const rows = useMemo(() => {
    return META.banBoard
      .map((b) => ({
        ...b,
        filteredCount: side === 'all' ? b.total : side === 'attack' ? b.atkBans : b.defBans,
      }))
      .filter((b) => b.filteredCount > 0)
      .sort((a, b) => b.filteredCount - a.filteredCount || a.name.localeCompare(b.name))
      .slice(0, 12)
  }, [side])

  if (!rows.length) {
    return (
      <div className="meta-card">
        <div className="meta-card-header">
          <h2>Most-banned operators</h2>
          <p>No ban recommendations for this filter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="meta-card">
      <div className="meta-card-header">
        <h2>Most-banned operators</h2>
        <p>The highest-impact ban targets across the ranked pool — who to remove from the enemy roster first.</p>
      </div>
      <div className="meta-ban-grid">
        {rows.map((b) => (
          <div key={b.name} className="meta-ban-tile">
            <div className="meta-ban-header">
              <span className="meta-ban-name">{b.name}</span>
              <span className="meta-ban-count">
                <strong>{b.filteredCount}</strong> map{b.filteredCount === 1 ? '' : 's'}
              </span>
            </div>
            {b.sampleReasons[0] && (
              <p className="meta-ban-reason">{b.sampleReasons[0].reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MapWeightBoard() {
  const max = META.mapStats[0]?.totalEssentials || 1
  return (
    <div className="meta-card">
      <div className="meta-card-header">
        <h2>Map complexity</h2>
        <p>Ranked maps sorted by essential-pick pressure — higher = less room to improvise lineups.</p>
      </div>
      <ul className="meta-map-list">
        {META.mapStats.map((m) => {
          const atkPct = (m.atkEssentials / max) * 100
          const defPct = (m.defEssentials / max) * 100
          return (
            <li key={m.mapId} className="meta-map-row">
              <Link to={`/strats/${m.mapId}`} className="meta-map-name">{m.mapName}</Link>
              <div className="meta-map-bars">
                <div className="meta-map-bar meta-map-bar-atk" style={{ width: `${atkPct}%` }} title={`Attack: ${m.atkEssentials} essentials`} />
                <div className="meta-map-bar meta-map-bar-def" style={{ width: `${defPct}%` }} title={`Defense: ${m.defEssentials} essentials`} />
              </div>
              <span className="meta-map-total">
                <strong>{m.totalEssentials}</strong>
                <span>essentials</span>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="meta-map-legend">
        <span className="meta-map-legend-dot meta-map-legend-atk" /> Attack essentials
        <span className="meta-map-legend-dot meta-map-legend-def" /> Defense essentials
      </div>
    </div>
  )
}

export default function MetaPage() {
  const { isR6 } = useActiveGame()
  if (!isR6) return <GameMetaPage />
  return <R6MetaPage />
}

function R6MetaPage() {
  const [side, setSide] = useState('all')
  const { totals } = META

  return (
    <div className="meta-page">
      <div className="meta-header">
        <h1>Ranked <span className="accent">Meta</span></h1>
        <p>
          Aggregate competitive intel across <strong>{totals.rankedMaps}</strong> ranked maps,{' '}
          <strong>{totals.sites}</strong> sites, and <strong>{totals.operators}</strong> operators.
          Updated whenever the strat data changes.
        </p>
      </div>

      <div className="meta-controls">
        <SideFilter value={side} onChange={setSide} />
      </div>

      <div className="meta-grid">
        <OperatorLeaderboard side={side} />
        <div className="meta-grid-col">
          <BanBoard side={side} />
          <MapWeightBoard />
        </div>
      </div>
    </div>
  )
}
