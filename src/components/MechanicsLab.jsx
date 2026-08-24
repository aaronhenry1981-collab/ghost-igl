import { useMemo, useState } from 'react'
import {
  PEEK_DRILLS,
  buildSensitivityPlan,
  evaluateSensitivityComparison,
  issuesForInput,
  normalizeMechanicsState,
  sensitivityHistoryVerdict,
} from '../data/mechanicsLab'
import {
  OPERATOR_DEPTH,
  OPERATOR_DEPTH_TARGET,
  PEEK_DIAGRAMS,
  RANGE_ZONES,
  RANGE_SESSION,
  TRAINING_LESSONS,
  TRAINING_VENUES,
  buildPersonalRangePlan,
  rankStandard,
  recommendOperators,
  situationPlan,
  summarizeRangeTraining,
  trainingPromotion,
} from '../data/operatorTraining'
import './MechanicsLab.css'

const EMPTY_RESULT = { acquisition: 0, micro: 0, peek: 0, recoil: 0, errors: 0, comfort: 3 }

function numberOrNull(value) {
  if (value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function resultLabel(status) {
  return ({
    'not-tested': 'Ready for baseline',
    repeat: 'Promising — repeat once',
    'lock-candidate': 'Candidate confirmed',
    rollback: 'Rollback to baseline',
    inconclusive: 'No clear winner',
  })[status] || 'Build a test plan'
}

export default function MechanicsLab({ value, onSave, rank, operatorEvidence, coachTrainingSessions = [] }) {
  const [state, setState] = useState(() => normalizeMechanicsState(value))
  const [view, setView] = useState('training')
  const [baseline, setBaseline] = useState(EMPTY_RESULT)
  const [candidate, setCandidate] = useState(EMPTY_RESULT)
  const [comparisonMessage, setComparisonMessage] = useState('')
  const [peekDrillId, setPeekDrillId] = useState(PEEK_DRILLS[0].id)
  const [peekSuccesses, setPeekSuccesses] = useState(0)
  const [peekStep, setPeekStep] = useState(0)
  const [lessonId, setLessonId] = useState(TRAINING_LESSONS[0].id)
  const [trainingSuccesses, setTrainingSuccesses] = useState(0)
  const [trainingFailure, setTrainingFailure] = useState('none')
  const [trainingSide, setTrainingSide] = useState('attack')
  const [trainingOperator, setTrainingOperator] = useState(OPERATOR_DEPTH.attack[0].op)
  const [situation, setSituation] = useState({ ours: 5, theirs: 5, side: 'attack', planted: false })

  const plan = useMemo(
    () => buildSensitivityPlan(state.profile, state.issueId),
    [state.profile, state.issueId],
  )
  const history = useMemo(() => sensitivityHistoryVerdict(state, plan), [state, plan])
  const selectedLesson = TRAINING_LESSONS.find((item) => item.id === lessonId) || TRAINING_LESSONS[0]
  const allTrainingSessions = useMemo(() => {
    const byId = new Map()
    ;[...(coachTrainingSessions || []), ...state.trainingSessions].forEach((session) => byId.set(session.id || `${session.ts}:${session.lessonId}`, session))
    return [...byId.values()].slice(-60)
  }, [coachTrainingSessions, state.trainingSessions])
  const promotion = trainingPromotion(allTrainingSessions, selectedLesson.id)
  const standard = rankStandard(rank)
  const situationResult = situationPlan(situation)
  const latestRangeLoadout = useMemo(() => allTrainingSessions.slice().reverse().find((session) => session.lessonId === RANGE_SESSION.id && session.loadout)?.loadout || {
    side: trainingSide, operator: trainingOperator, weapon: '', sight: '1.0x', attachments: '',
  }, [allTrainingSessions, trainingSide, trainingOperator])
  const rangeSummary = useMemo(() => summarizeRangeTraining(allTrainingSessions, latestRangeLoadout), [allTrainingSessions, latestRangeLoadout])
  const personalRangePlan = useMemo(() => buildPersonalRangePlan(allTrainingSessions, latestRangeLoadout), [allTrainingSessions, latestRangeLoadout])
  const operatorRecommendations = useMemo(() => recommendOperators({
    side: trainingSide,
    performance: operatorEvidence,
    trainingSessions: allTrainingSessions,
    rank,
  }), [trainingSide, operatorEvidence, allTrainingSessions, rank])

  function commit(next) {
    const normalized = normalizeMechanicsState({ ...next, updatedAt: new Date().toISOString() })
    setState(normalized)
    onSave(normalized)
  }

  function updateProfile(key, raw) {
    const stringKeys = new Set(['platform', 'input', 'driftStatus'])
    setState((current) => ({
      ...current,
      profile: { ...current.profile, [key]: stringKeys.has(key) ? raw : numberOrNull(raw) },
    }))
  }

  function saveProfile() {
    commit(state)
    setComparisonMessage('Player baseline saved to this account.')
  }

  function chooseIssue(issueId) {
    const next = { ...state, issueId, comparisons: state.comparisons }
    commit(next)
    setComparisonMessage('')
  }

  function recordComparison() {
    const evaluation = evaluateSensitivityComparison(plan, baseline, candidate)
    if (evaluation.verdict === 'blocked') {
      setComparisonMessage(evaluation.message)
      return
    }
    const comparisons = [
      ...state.comparisons,
      {
        id: `sens-${Date.now()}`,
        ts: new Date().toISOString(),
        planId: plan.id,
        issueId: plan.issueId,
        setting: plan.setting,
        baselineSetting: plan.baseline,
        candidateSetting: plan.candidate,
        verdict: evaluation.verdict,
        baseline: evaluation.baseline,
        candidate: evaluation.candidate,
      },
    ].slice(-8)
    let next = { ...state, comparisons }
    const nextHistory = sensitivityHistoryVerdict(next, plan)
    if (nextHistory.status === 'lock-candidate') {
      next = {
        ...next,
        profile: { ...next.profile, [plan.setting]: plan.candidate },
        issueId: '',
        lockedSetting: {
          key: plan.setting,
          label: plan.settingLabel,
          value: plan.candidate,
          previous: plan.baseline,
          comparisons: 2,
        },
        lockedAt: new Date().toISOString(),
      }
      setComparisonMessage(`Confirmed: lock ${plan.settingLabel} at ${plan.candidate}. Change nothing else during the next ranked block.`)
    } else {
      setComparisonMessage(evaluation.message)
    }
    commit(next)
    setBaseline(EMPTY_RESULT)
    setCandidate(EMPTY_RESULT)
  }

  function recordPeekSession() {
    const drill = PEEK_DRILLS.find((item) => item.id === peekDrillId)
    if (!drill) return
    commit({
      ...state,
      peekSessions: [...state.peekSessions, {
        id: `peek-${Date.now()}`,
        ts: new Date().toISOString(),
        drillId: drill.id,
        successes: Math.min(10, Math.max(0, Number(peekSuccesses) || 0)),
      }].slice(-20),
    })
    setPeekSuccesses(0)
  }

  function recordTrainingSession() {
    const successes = Math.min(selectedLesson.reps, Math.max(0, Number(trainingSuccesses) || 0))
    const operator = selectedLesson.skill === 'operator' ? trainingOperator : ''
    const recordedAt = new Date().toISOString()
    commit({
      ...state,
      trainingSessions: [...state.trainingSessions, {
        id: `training-${recordedAt}`,
        ts: recordedAt,
        lessonId: selectedLesson.id,
        venue: selectedLesson.venue,
        operator,
        side: operator ? trainingSide : '',
        successes,
        reps: selectedLesson.reps,
        passed: successes >= selectedLesson.pass,
        evidenceSource: 'player-confirmed',
        evidenceText: `${successes}/${selectedLesson.reps} reps confirmed. ${selectedLesson.proof || ''}`.slice(0, 500),
        failureReason: trainingFailure,
      }].slice(-40),
    })
    setTrainingSuccesses(0)
    setTrainingFailure('none')
  }

  function changeTrainingSide(side) {
    setTrainingSide(side)
    setTrainingOperator(OPERATOR_DEPTH[side][0].op)
  }

  const selectedPeek = PEEK_DRILLS.find((item) => item.id === peekDrillId)
  const selectedDiagram = PEEK_DIAGRAMS.find((item) => item.id === peekDrillId) || PEEK_DIAGRAMS[0]

  return (
    <section className="mechanics-lab" aria-labelledby="mechanics-title">
      <header className="mechanics-hero">
        <div>
          <span>Training center</span>
          <h2 id="mechanics-title">Practice outside Ranked. Promote only what passes.</h2>
          <p>Every lesson names the right place to train, a measurable pass gate, and the evidence behind each operator recommendation.</p>
        </div>
        <div className="mechanics-summary">
          <div><strong>{rank || 'Unverified'}</strong><span>{standard.label} training standard</span></div>
          <div><strong>{allTrainingSessions.filter((item) => item.passed).length}</strong><span>Practice passes</span></div>
          <div><strong>{OPERATOR_DEPTH_TARGET}/side</strong><span>Depth target</span></div>
        </div>
      </header>

      <nav className="mechanics-nav" aria-label="Mechanics lab sections">
        {[
          ['training', 'Training plan'], ['operators', 'Operator depth'], ['situations', '5v5 & player count'],
          ['peeks', 'Peek school'], ['sensitivity', 'Sensitivity'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>
        ))}
      </nav>

      {view === 'training' && (
        <div className="mechanics-stack">
          <section className="mechanics-card training-launcher">
            <div className="mechanics-card-heading"><span>Ranked is the exam</span><h3>Choose one lesson and train it in the correct mode</h3></div>
            <p className="mechanics-help">{standard.rule}</p>
            <div className="training-venue-strip">
              {Object.entries(TRAINING_VENUES).map(([id, venue]) => (
                <article key={id} className={selectedLesson.venue === id ? 'active' : id === 'ranked' && promotion.status !== 'ranked-ready' ? 'locked' : ''}>
                  <strong>{venue.label}</strong><span>{venue.use}</span>
                </article>
              ))}
            </div>
            <div className="training-picker-grid">
              <FieldSelect label="Lesson" value={lessonId} onChange={setLessonId} options={TRAINING_LESSONS.map((item) => [item.id, item.title])} />
              <div className="training-venue-callout"><span>Go to</span><strong>{TRAINING_VENUES[selectedLesson.venue].label}</strong></div>
              <div className={`training-promotion is-${promotion.status}`}><span>Promotion gate</span><strong>{promotion.message}</strong></div>
            </div>
            {selectedLesson.skill === 'operator' && (
              <div className="training-operator-row">
                <FieldSelect label="Side" value={trainingSide} onChange={changeTrainingSide} options={[["attack", "Attack"], ["defense", "Defense"]]} />
                <FieldSelect label="Operator" value={trainingOperator} onChange={setTrainingOperator} options={OPERATOR_DEPTH[trainingSide].map((item) => [item.op, item.op])} />
              </div>
            )}
            <ol className="training-steps">{selectedLesson.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            {selectedLesson.id !== RANGE_SESSION.id && (
              <div className="training-brief-web">
                <article><span>Purpose</span><strong>{selectedLesson.goal}</strong></article>
                <article><span>Exact setup</span><strong>{selectedLesson.setup}</strong></article>
                <article><span>One rep</span><strong>{selectedLesson.rep}</strong></article>
                <article><span>Proof</span><strong>{selectedLesson.proof}</strong><small>{selectedLesson.review}</small></article>
              </div>
            )}
            {selectedLesson.id === RANGE_SESSION.id && (
              <div className="range-plan-web">
                <div className="range-plan-baseline">
                  <div><span>Use the saved baseline</span><strong>{state.profile.platform === 'ps5' ? 'PlayStation 5' : state.profile.platform === 'xbox' ? 'Xbox' : state.profile.platform === 'pc' ? 'Windows PC' : 'Platform not saved'} · {state.profile.input === 'controller' ? 'Controller' : state.profile.input === 'mouse' ? 'Mouse & keyboard' : 'Input not saved'}</strong></div>
                  <p>{state.profile.hipVertical != null && state.profile.hipHorizontal != null && state.profile.ads1x != null
                    ? `Vertical ${state.profile.hipVertical} · Horizontal ${state.profile.hipHorizontal} · 1.0x ADS ${state.profile.ads1x}. Do not change these during the session.`
                    : 'Save the real platform, input, and sensitivity under Sensitivity before using this lesson to compare settings.'}</p>
                </div>
                <div className="range-program-summary">
                  <div><span>Comparable sessions</span><strong>{rangeSummary.sessions}</strong></div>
                  <div><span>Screen-read evidence</span><strong>{rangeSummary.verified}</strong></div>
                  <div><span>Personal passes</span><strong>{rangeSummary.passes}</strong></div>
                  <div><span>Next session</span><strong>{personalRangePlan.mode === 'assessment' ? '3-zone assessment' : 'Weakest-drill workout'}</strong></div>
                </div>
                <div className="range-zone-grid">
                  {Object.entries(RANGE_ZONES).map(([zone, details]) => (
                    <article key={zone}>
                      <span>Zone {zone}</span><h4>{details.name.replace(/^Zone \d · /, '')}</h4>
                      <p>{details.purpose}</p><small>{details.record}</small>
                    </article>
                  ))}
                </div>
                <div className="range-next-assignment">
                  <span>{personalRangePlan.mode === 'assessment' ? 'Baseline required' : 'Assigned from your evidence'}</span>
                  <strong>{personalRangePlan.reason}</strong>
                  <p>Comparable loadout: {[latestRangeLoadout.operator, latestRangeLoadout.weapon, latestRangeLoadout.sight, latestRangeLoadout.attachments].filter(Boolean).join(' · ') || 'The Owner Coach will ask for the exact operator and weapon.'}</p>
                </div>
                <div className="range-plan-grid">
                  {personalRangePlan.stages.map((stage, index) => (
                    <article key={stage.id}>
                      <div><span>Step {index + 1} · {Math.ceil(stage.seconds / 60)} min</span><b>{stage.lane}</b></div>
                      <h4>{stage.title}</h4>
                      <p><strong>Set:</strong> {stage.targetSetup}</p>
                      <p><strong>Do:</strong> {stage.action}</p>
                      <ul>{stage.configuration.map((setting) => <li key={setting}>{setting}</li>)}</ul>
                      <small><b>Evidence:</b> {stage.metrics.join(' · ')}. {stage.clean}</small>
                    </article>
                  ))}
                </div>
                {allTrainingSessions.some((session) => session.lessonId === RANGE_SESSION.id) && (
                  <div className="range-history">
                    <div><span>Recorded evidence</span><h4>Recent Range sessions</h4></div>
                    {allTrainingSessions.filter((session) => session.lessonId === RANGE_SESSION.id).slice(-6).reverse().map((session) => (
                      <article key={session.id || session.ts}>
                        <div><strong>{session.mode === 'assessment' ? 'Baseline assessment' : 'Personal workout'}</strong><span>{String(session.ts || '').slice(0, 10)}</span></div>
                        <p>{[session.loadout?.operator, session.loadout?.weapon, session.loadout?.sight].filter(Boolean).join(' · ') || 'Legacy Range result'}</p>
                        <small>{(session.stageResults || []).length} configured drills · {(session.stageResults || []).filter((result) => result.evidenceSource === 'local-ocr').length} screen-read · {session.passed ? 'passed' : session.mode === 'assessment' ? 'baseline saved' : 'repeat assigned'}</small>
                      </article>
                    ))}
                  </div>
                )}
                <p className="mechanics-notice"><b>Run it in the desktop Owner Coach.</b> It preserves the exact Zone 1/2/3 configuration, reads the visible Shooting Record locally, asks you to confirm uncertain fields, stores the trend, and assigns the next weakest drill. No paid Live AI is used.</p>
              </div>
            )}
          </section>
          {selectedLesson.id !== RANGE_SESSION.id && (
            <>
              <section className="mechanics-card mechanics-log-card">
                <div><span>Log confirmed evidence</span><h3>{selectedLesson.title}</h3><p>Pass at {selectedLesson.pass} of {selectedLesson.reps}. Two passes promote it to Ranked.</p></div>
                <FieldNumber label={`Clean reps out of ${selectedLesson.reps}`} value={trainingSuccesses} min={0} max={selectedLesson.reps} onChange={setTrainingSuccesses} />
                <FieldSelect label="First repeated miss" value={trainingFailure} onChange={setTrainingFailure} options={[
                  ['none', 'No repeated miss'], ['setup', 'Setup not completed'], ['information', 'Information stale/missing'], ['positioning', 'Position/exposure'], ['timing', 'Timing late'], ['utility', 'Utility/gadget'], ['mechanics', 'Mechanics'], ['gunfight', 'Gunfight after job'],
                ]} />
                <button type="button" className="btn btn-primary" onClick={recordTrainingSession}>Save confirmed result</button>
              </section>
              {allTrainingSessions.some((session) => session.lessonId === selectedLesson.id) && (
                <section className="mechanics-card lesson-history">
                  <div className="mechanics-card-heading"><span>Trend</span><h3>Recent {selectedLesson.title} sessions</h3></div>
                  {allTrainingSessions.filter((session) => session.lessonId === selectedLesson.id).slice(-6).reverse().map((session) => (
                    <article key={session.id || session.ts}>
                      <strong>{session.successes}/{session.reps} · {session.passed ? 'Pass' : 'Repeat'}</strong>
                      <span>{String(session.ts || '').slice(0, 10)}</span>
                      <p>{session.failureReason && session.failureReason !== 'none' ? `Repeated miss: ${session.failureReason}` : 'No repeated miss recorded.'}</p>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {view === 'operators' && (
        <div className="mechanics-stack">
          <section className="mechanics-card">
            <div className="mechanics-card-heading"><span>Personal depth, not four fixed picks</span><h3>Five legal recommendations from a 12-operator side pool</h3></div>
            <p className="mechanics-help">The live Coach additionally filters bans, teammate locks, map, site, and team-role gaps. This page shows the evidence layer available for your current account.</p>
            <div className="operator-side-switch">
              <button type="button" className={trainingSide === 'attack' ? 'active' : ''} onClick={() => changeTrainingSide('attack')}>Attack depth</button>
              <button type="button" className={trainingSide === 'defense' ? 'active' : ''} onClick={() => changeTrainingSide('defense')}>Defense depth</button>
            </div>
            <div className="operator-depth-grid">
              {operatorRecommendations.map((item, index) => (
                <article key={item.op}>
                  <div><span>#{index + 1}</span><h4>{item.op}</h4></div>
                  <p>{item.reasons.slice(0, 2).join(' · ')}</p>
                  <small>{item.sources.join(' + ')}</small>
                </article>
              ))}
            </div>
            <div className="mechanics-safety operator-source-key">
              <strong>What the labels mean</strong>
              <ul>
                <li><b>Personal evidence</b> comes only from this player's recorded rounds.</li>
                <li><b>Map/site fit</b> and <b>team need</b> describe this round, not lifetime skill.</li>
                <li><b>Learning</b> means the sample is too small to call the pick personal yet.</li>
                <li>Recon 6 never presents a professional player's pick as proof that it fits you.</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {view === 'situations' && (
        <div className="mechanics-stack">
          <section className="mechanics-card">
            <div className="mechanics-card-heading"><span>Manual training lab</span><h3>Learn every visible player-count state</h3></div>
            <p className="mechanics-help">The live Coach must not invent a count from your POV. Use this lab when the scoreboard or HUD proves the numbers.</p>
            <div className="situation-controls">
              <FieldSelect label="Side" value={situation.side} onChange={(value) => setSituation({ ...situation, side: value })} options={[["attack", "Attack"], ["defense", "Defense"]]} />
              <FieldNumber label="Your team alive" value={situation.ours} min={1} max={5} onChange={(value) => setSituation({ ...situation, ours: value })} />
              <FieldNumber label="Opponents alive" value={situation.theirs} min={1} max={5} onChange={(value) => setSituation({ ...situation, theirs: value })} />
              <label className="situation-check"><input type="checkbox" checked={situation.planted} onChange={(event) => setSituation({ ...situation, planted: event.target.checked })} /><span>Defuser planted</span></label>
            </div>
            <div className={`situation-plan is-${situationResult.state}`}>
              <div><span>{situationResult.label}</span><strong>{situationResult.headline}</strong></div>
              <ol>{situationResult.actions.map((action) => <li key={action}>{action}</li>)}</ol>
            </div>
            <p className="mechanics-notice">Live automation status: <b>NOT AUTOMATABLE</b> until a readable scoreboard/HUD supplies the count. The tactics are teachable now; the Coach may not guess the trigger.</p>
          </section>
        </div>
      )}

      {view === 'sensitivity' && (
        <div className="mechanics-stack">
          <section className="mechanics-card">
            <div className="mechanics-card-heading"><span>Step 1</span><h3>Save the player's actual baseline</h3></div>
            <p className="mechanics-help">Mouse and controller stay separate. Blank values stay unknown; Recon 6 will not invent a starting sensitivity.</p>
            <div className="mechanics-fields">
              <FieldSelect label="Platform" value={state.profile.platform} onChange={(v) => updateProfile('platform', v)} options={[
                ['', 'Choose platform'], ['pc', 'Windows PC'], ['ps5', 'PlayStation 5'], ['xbox', 'Xbox'],
              ]} />
              <FieldSelect label="Input" value={state.profile.input} onChange={(v) => updateProfile('input', v)} options={[
                ['', 'Choose input'], ['mouse', 'Mouse & keyboard'], ['controller', 'Controller'],
              ]} />
              {state.profile.input === 'mouse' && <FieldNumber label="Mouse DPI" value={state.profile.dpi} onChange={(v) => updateProfile('dpi', v)} />}
              <FieldNumber label="Hip horizontal" value={state.profile.hipHorizontal} onChange={(v) => updateProfile('hipHorizontal', v)} />
              <FieldNumber label="Hip vertical" value={state.profile.hipVertical} onChange={(v) => updateProfile('hipVertical', v)} />
              <FieldNumber label="1.0x ADS" value={state.profile.ads1x} onChange={(v) => updateProfile('ads1x', v)} />
              <FieldNumber label="2.5x ADS" value={state.profile.ads2_5x} onChange={(v) => updateProfile('ads2_5x', v)} />
              <FieldNumber label="FOV" value={state.profile.fov} onChange={(v) => updateProfile('fov', v)} />
              {state.profile.input === 'controller' && (
                <>
                  <FieldNumber label="Left deadzone" value={state.profile.leftDeadzone} onChange={(v) => updateProfile('leftDeadzone', v)} />
                  <FieldNumber label="Right deadzone" value={state.profile.rightDeadzone} onChange={(v) => updateProfile('rightDeadzone', v)} />
                  <FieldSelect label="Visible stick drift" value={state.profile.driftStatus} onChange={(v) => updateProfile('driftStatus', v)} options={[
                    ['unknown', 'Not tested'], ['none', 'No drift visible'], ['present', 'Drift visible'],
                  ]} />
                </>
              )}
            </div>
            <button type="button" className="btn btn-primary" onClick={saveProfile}>Save my baseline</button>
          </section>

          <section className="mechanics-card">
            <div className="mechanics-card-heading"><span>Step 2</span><h3>Choose one repeated problem</h3></div>
            <div className="mechanics-issue-grid">
              {issuesForInput(state.profile.input).map((issue) => (
                <button key={issue.id} type="button" className={state.issueId === issue.id ? 'active' : ''} onClick={() => chooseIssue(issue.id)}>{issue.label}</button>
              ))}
            </div>
            {!state.profile.input && <p className="mechanics-notice">Choose mouse or controller first.</p>}
            <div className={`mechanics-plan mechanics-plan--${plan.status}`}>
              {plan.status === 'ready' ? (
                <>
                  <span>One-variable candidate</span>
                  <strong>{plan.settingLabel}: {plan.baseline} → {plan.candidate}</strong>
                  <p>{plan.message} {plan.instruction}</p>
                </>
              ) : (
                <><span>{plan.status === 'drill-only' ? 'Training before tuning' : 'Plan not ready'}</span><p>{plan.message}</p></>
              )}
            </div>
          </section>

          {plan.status === 'ready' && (
            <section className="mechanics-card">
              <div className="mechanics-card-heading"><span>Step 3</span><h3>Run the same four lanes</h3></div>
              <p className="mechanics-help">Ten reps per lane. “Errors” means the repeated problem you selected. Comfort is your own 1–5 rating.</p>
              <div className="mechanics-comparison">
                <div className="mechanics-comparison-head"><span>Metric</span><strong>Baseline {plan.baseline}</strong><strong>Candidate {plan.candidate}</strong></div>
                {[
                  ['acquisition', 'First-shot acquisition'], ['micro', 'Micro-correction'], ['peek', 'Peek placement'], ['recoil', 'Burst control'], ['errors', 'Primary errors'], ['comfort', 'Control / comfort'],
                ].map(([key, label]) => (
                  <div className="mechanics-comparison-row" key={key}>
                    <label>{label}<small>{key === 'comfort' ? '1–5' : '0–10'}</small></label>
                    <input aria-label={`${label} baseline`} type="number" min={key === 'comfort' ? 1 : 0} max={key === 'comfort' ? 5 : 10} value={baseline[key]} onChange={(e) => setBaseline({ ...baseline, [key]: Number(e.target.value) })} />
                    <input aria-label={`${label} candidate`} type="number" min={key === 'comfort' ? 1 : 0} max={key === 'comfort' ? 5 : 10} value={candidate[key]} onChange={(e) => setCandidate({ ...candidate, [key]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>
              <div className="mechanics-actions">
                <button type="button" className="btn btn-primary" onClick={recordComparison}>Save comparison</button>
                <span className={`mechanics-verdict mechanics-verdict--${history.status}`}>{resultLabel(history.status)}</span>
              </div>
              {comparisonMessage && <p className="mechanics-notice" role="status">{comparisonMessage}</p>}
            </section>
          )}

          <section className="mechanics-safety">
            <strong>Hard rules</strong>
            <ul>
              <li>Never copy a professional player's values as your starting point.</li>
              <li>Never change DPI, hipfire, ADS, deadzone, and FOV together.</li>
              <li>A death or one bad match cannot prove a sensitivity problem.</li>
              <li>Rollback is a successful test result—it prevents a bad setting from becoming a habit.</li>
            </ul>
          </section>
        </div>
      )}

      {view === 'peeks' && (
        <div className="mechanics-stack">
          <section className="mechanics-card">
            <div className="mechanics-card-heading"><span>Progressive movement</span><h3>Control first, speed second</h3></div>
            <div className="mechanics-drill-grid mechanics-drill-grid--peeks">
              {PEEK_DRILLS.map((drill) => (
                <article key={drill.id} className={peekDrillId === drill.id ? 'active' : ''} onClick={() => { setPeekDrillId(drill.id); setPeekStep(0) }}>
                  <span>{drill.category}</span><h4>{drill.title}</h4><p>{drill.instruction}</p><small>{drill.success}</small><em>{drill.badWhen}</em>
                </article>
              ))}
            </div>
          </section>
          <section className="mechanics-card peek-teacher">
            <div className="mechanics-card-heading"><span>Step-by-step diagram</span><h3>{selectedDiagram.title}</h3></div>
            <div className="peek-teacher-grid">
              <div className={`peek-stage peek-stage--${selectedDiagram.id} step-${peekStep}`} role="img" aria-label={`${selectedDiagram.title}, step ${peekStep + 1}: ${selectedDiagram.steps[peekStep].detail}`}>
                <div className="peek-cover"><span>Cover</span></div>
                <div className="peek-enemy"><span>Enemy line</span></div>
                <div className="peek-sightline" />
                <div className="peek-player"><span>You</span><i /></div>
                <div className="peek-crosshair" aria-hidden="true">+</div>
              </div>
              <div className="peek-step-panel">
                <span>Step {peekStep + 1} of {selectedDiagram.steps.length}</span>
                <h4>{selectedDiagram.steps[peekStep].label}</h4>
                <p>{selectedDiagram.steps[peekStep].detail}</p>
                <div className="peek-step-buttons">
                  {selectedDiagram.steps.map((step, index) => <button key={step.label} type="button" className={peekStep === index ? 'active' : ''} onClick={() => setPeekStep(index)}>{index + 1}</button>)}
                </div>
                <em>Common failure: {selectedDiagram.mistake}</em>
              </div>
            </div>
          </section>
          <section className="mechanics-card mechanics-log-card">
            <div><span>Log ten controlled reps</span><h3>{selectedPeek?.title}</h3><p>{selectedPeek?.success}</p></div>
            <FieldNumber label="Clean reps out of 10" value={peekSuccesses} min={0} max={10} onChange={setPeekSuccesses} />
            <button type="button" className="btn btn-primary" onClick={recordPeekSession}>Log peek block</button>
          </section>
        </div>
      )}
    </section>
  )
}

function FieldNumber({ label, value, onChange, min = 0, max = 200 }) {
  return (
    <label className="mechanics-field"><span>{label}</span><input type="number" min={min} max={max} value={value ?? ''} placeholder="Unknown" onChange={(event) => onChange(event.target.value)} /></label>
  )
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="mechanics-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([id, text]) => <option key={id || 'blank'} value={id}>{text}</option>)}</select></label>
  )
}
