import { buildDiagramZones, diagramSummary } from '../../lib/siteDiagram.mjs'

const PHASES = {
  attack: ['DRONE', 'TAKE SPACE', 'EXECUTE', 'CLOSE'],
  defense: ['BUILD', 'DENY', 'HOLD', 'RETAKE'],
}

export default function SiteSetupDiagram({ strat, side, mapId, mapName, siteName }) {
  const zones = buildDiagramZones(strat, side, PHASES[side] || PHASES.attack)
  const summary = diagramSummary(zones, side)

  return (
    <div className={`site-diagram site-diagram-${side}`} role="img" aria-label={summary}>
      <img className="site-diagram-backdrop" src={`/guides/og/${mapId}.svg`} alt="" />
      <div className="site-diagram-grid" aria-hidden="true" />

      <div className="site-diagram-header">
        <div>
          <span>{side === 'attack' ? 'ATTACK PATH' : 'DEFENSE SETUP'}</span>
          <strong>{mapName}</strong>
          <small>{siteName}</small>
        </div>
        <em>Priority-zone schematic · not to scale</em>
      </div>

      <svg className="site-diagram-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id={`site-arrow-${side}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" />
          </marker>
        </defs>
        <path d="M20 31 C38 19, 57 21, 73 31 S60 67, 30 69 S45 85, 75 72" markerEnd={`url(#site-arrow-${side})`} />
      </svg>

      <ol className="site-diagram-zones">
        {zones.map((zone, index) => (
          <li key={zone.id} className={`site-diagram-zone site-diagram-zone-${index + 1}`}>
            <span className="site-diagram-step">{index + 1}</span>
            <div>
              <small>{zone.phase}</small>
              <strong>{zone.label}</strong>
              {zone.operator && <em>{zone.operator} · {zone.role}</em>}
            </div>
          </li>
        ))}
      </ol>

      <div className="site-diagram-legend" aria-hidden="true">
        <span><i /> Start here</span>
        <span><i /> Finish together</span>
      </div>
    </div>
  )
}
