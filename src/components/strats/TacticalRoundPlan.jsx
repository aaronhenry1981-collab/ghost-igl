import RoleGlyph from './RoleGlyph'

const PHASES = {
  attack: ['DRONE', 'TAKE SPACE', 'EXECUTE', 'CLOSE'],
  defense: ['BUILD', 'DENY', 'HOLD', 'RETAKE'],
}

function sentences(text = '') {
  return text
    .split(/(?<=[.!?])\s+|\s*;\s*|\s+\b(?:while|then)\b\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildSteps(strat, side) {
  const plan = sentences(strat.strategy)
  const utility = (strat.utility || []).map((item) => item.trim()).filter(Boolean)
  const source = [...plan, ...utility]
  const unique = source.filter((item, index) => source.indexOf(item) === index)
  const callouts = (strat.callouts || []).filter(Boolean)
  const operators = (strat.operators || []).filter(Boolean)

  if (unique.length < 4 && callouts.length) {
    unique.push(`Keep comms short and use the named spaces: ${callouts.slice(0, 4).join(' · ')}.`)
  }

  if (unique.length < 4 && operators.length) {
    unique.push(`Keep the jobs assigned: ${operators.slice(0, 3).map((operator) => `${operator.name} — ${operator.role}`).join(' · ')}.`)
  }

  if (unique.length < 4) {
    unique.push(side === 'attack'
      ? 'Round fundamental: set flank watch before the final execute and plant only when the trade is ready.'
      : 'Round fundamental: keep one player on denial and retake together instead of feeding one at a time.')
  }

  return unique.slice(0, 4)
}

export default function TacticalRoundPlan({ strat, side, mapId, mapName, siteName }) {
  const steps = buildSteps(strat, side)
  const phases = PHASES[side] || PHASES.attack
  const callouts = (strat.callouts || []).slice(0, 4)
  const operators = strat.operators || []

  return (
    <figure className={`tactical-plan tactical-plan-${side}`} aria-labelledby="tactical-plan-title">
      <div className="tactical-plan-art" aria-hidden="true">
        <img src={`/guides/og/${mapId}.svg`} alt="" />
        <div className="tactical-plan-art-shade" />
        <div className="tactical-plan-art-copy">
          <span>{side === 'attack' ? 'ATTACK' : 'DEFENSE'} BOARD</span>
          <strong>{mapName}</strong>
          <small>{siteName}</small>
        </div>
      </div>

      <div className="tactical-plan-content">
        <div className="tactical-plan-heading">
          <div>
            <span className="tactical-plan-kicker">VISUAL ROUND PLAN</span>
            <h3 id="tactical-plan-title">Run the round in this order</h3>
          </div>
          <span className="tactical-plan-time">30-second read</span>
        </div>

        <ol className="tactical-plan-steps">
          {steps.map((step, index) => {
            const operator = operators[index % Math.max(operators.length, 1)]
            return (
              <li key={`${phases[index]}-${step}`}>
                <span className="tactical-plan-number">{index + 1}</span>
                <div className="tactical-plan-step-copy">
                  <div className="tactical-plan-step-top">
                    <strong>{phases[index]}</strong>
                    {callouts[index] && <span>{callouts[index]}</span>}
                  </div>
                  <p>{step}</p>
                  {operator && (
                    <div className="tactical-plan-owner">
                      <RoleGlyph role={operator.role} name={operator.name} />
                      <span><b>{operator.name}</b> · {operator.role}</span>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <figcaption>
        A visual execution order built from this site&rsquo;s strategy, operator jobs, utility, and named callouts.
      </figcaption>
    </figure>
  )
}
