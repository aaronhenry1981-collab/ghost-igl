// Recon 6 shared operator-depth and training contract.
//
// This module deliberately separates four kinds of evidence:
// - personal: this account's recorded rounds;
// - round-fit: confirmed side/map/site/team need;
// - learning: controlled training results;
// - coverage: a provisional role-safe fallback when personal evidence is thin.
// It never labels a professional/meta pick as personal evidence.

export const LIVE_RULESET = Object.freeze({
  season: 'Operation System Override',
  patch: 'Y11S2.3',
  patchDate: '2026-08-04',
  verifiedOn: '2026-08-08',
  trainingPlaylists: ['Shooting Range', 'Clear House', 'Field Training', 'Quick Match', 'Custom Game'],
})

export const OPERATOR_DEPTH_TARGET = 12

export const OPERATOR_DEPTH = {
  attack: [
    { op: 'Dokkaebi', roles: ['intel', 'roam-clear'] },
    { op: 'Jackal', roles: ['intel', 'roam-clear'] },
    { op: 'Ash', roles: ['entry', 'soft-breach'] },
    { op: 'Thermite', roles: ['hard-breach', 'support'] },
    { op: 'Ace', roles: ['hard-breach', 'support'] },
    { op: 'Ram', roles: ['vertical', 'soft-breach'] },
    { op: 'Striker', roles: ['flex', 'entry'] },
    { op: 'Twitch', roles: ['utility-clear', 'intel'] },
    { op: 'Buck', roles: ['vertical', 'soft-breach'] },
    { op: 'Gridlock', roles: ['flank-watch', 'plant'] },
    { op: 'Ying', roles: ['execute', 'entry'] },
    { op: 'Fuze', roles: ['utility-clear', 'vertical'] },
  ],
  defense: [
    { op: 'Melusi', roles: ['trap', 'anchor'] },
    { op: 'Mute', roles: ['anti-breach', 'anti-intel'] },
    { op: 'Vigil', roles: ['roam', 'anti-intel'] },
    { op: 'Castle', roles: ['setup', 'area-denial'] },
    { op: 'Frost', roles: ['trap', 'anchor'] },
    { op: 'Kapkan', roles: ['trap', 'anchor'] },
    { op: 'Bandit', roles: ['anti-breach', 'anchor'] },
    { op: 'Doc', roles: ['anchor', 'sustain'] },
    { op: 'Thorn', roles: ['trap', 'anchor'] },
    { op: 'Ela', roles: ['trap', 'roam'] },
    { op: 'Smoke', roles: ['plant-denial', 'anchor'] },
    { op: 'Kaid', roles: ['anti-breach', 'anchor'] },
  ],
}

export const TRAINING_VENUES = {
  range: { label: 'Shooting Range', use: 'Aim, recoil, sensitivity, and repeatable weapon handling.' },
  custom: { label: 'Custom Game', use: 'Gadgets, site setup, routes, room clearing, and peek movement.' },
  // Keep the internal `ai` key for saved-session compatibility. Ubisoft
  // retired the old Versus AI playlist name; the current playlist is Field
  // Training, with Clear House available for route and room-clear work.
  ai: { label: 'Field Training', use: 'Execute a learned route or operator job with AI teammates and opponents.' },
  quick: { label: 'Quick Match', use: 'Pressure-test one passed lesson with unpredictable teammates and opponents.' },
  ranked: { label: 'Ranked', use: 'Exam only. Use skills already promoted through their practice gate.' },
}

// Shooting Range programme verified against Ubisoft's three-lane model:
// Zone 1 = Recoil, Zone 2 = Damage / destruction, Zone 3 = Aiming.  Zone 2 is
// deliberately not treated as an aim grind; it is a loadout-knowledge station.
// Exact settings travel with every result so unlike configurations are never
// mixed into one trend.
export const RANGE_ZONES = Object.freeze({
  1: {
    name: 'Zone 1 · Recoil Lane',
    purpose: 'Measure the same weapon, attachments, optic, distance, and fire pattern without target movement changing the result.',
    record: 'Accuracy / hit count, distance, magazine or burst size, and the saved recoil-pattern evidence.',
  },
  2: {
    name: 'Zone 2 · Damage Lane',
    purpose: 'Learn damage falloff, body-part damage, shots required, and destruction for the exact Ranked loadout.',
    record: 'Chest damage at 5 m, 15 m, 25 m, and 35 m plus the breakable-wall result. Re-run only after a weapon, attachment, or patch change.',
  },
  3: {
    name: 'Zone 3 · Aiming Lane',
    purpose: 'Train first-shot placement, moving-target control, target transfers, and cover reactions with repeatable lane settings.',
    record: 'Eliminations, headshots, hits / accuracy, and the exact target configuration shown by the Shooting Record.',
  },
})

export const RANGE_SESSION = {
  id: 'aim-block',
  version: 2,
  title: 'Personal three-zone Range assessment and workout',
  totalSeconds: 540,
  setup: [
    'Choose one operator and the exact primary weapon, optic, barrel, grip, and laser state you use in Ranked. Keep that loadout unchanged for the entire assessment.',
    'Keep the PS5 controller baseline locked: Vertical 30, Horizontal 50, 1.0x ADS 35, left/right deadzones 3/5, aim acceleration 0.',
    'Run the first session as an assessment. It creates your baseline and cannot be called a pass.',
    'At every result screen, leave the Shooting Record visible and let the Owner Coach read it locally. Confirm only fields the screen actually proves.',
    'Later workouts select the three weakest comparable drills. A result counts only against the same loadout and exact configuration.',
  ],
  stages: [
    {
      id: 'z1-recoil-near', zone: 1, kind: 'performance', title: 'Near recoil control', seconds: 90,
      lane: 'Zone 1 · Recoil Lane',
      targetSetup: 'Large recoil target · stand at the 10 m mark · full magazine · ADS · no manual compensation on spray one',
      configuration: ['Distance: 10 m', 'Fire pattern: one full magazine', 'Attempt 1: raw recoil', 'Attempts 2–3: controlled recoil'],
      action: 'Fire one untouched magazine to reveal the weapon pattern. Then fire two controlled magazines while pulling only against the repeatable vertical climb.',
      metrics: ['accuracy', 'hits', 'shots'], primaryMetric: 'accuracy',
      clean: 'The saved result belongs only to this operator, weapon, attachments, optic, 10 m distance, and full-magazine pattern.',
      correction: 'If the group snakes side to side, do not chase every horizontal jump. Reset the next magazine and control the repeatable vertical climb first.',
    },
    {
      id: 'z1-recoil-mid', zone: 1, kind: 'performance', title: 'Mid-range burst reset', seconds: 90,
      lane: 'Zone 1 · Recoil Lane',
      targetSetup: 'Large recoil target · stand at the 20 m mark · six-round bursts · fully release and reset between bursts',
      configuration: ['Distance: 20 m', 'Fire pattern: 6-round burst', 'Bursts: 10', 'Reset: return to the same head-width mark'],
      action: 'Fire exactly ten six-round bursts. Release the trigger after round six, return to the original mark, settle, then begin the next burst.',
      metrics: ['accuracy', 'hits', 'shots'], primaryMetric: 'accuracy',
      clean: 'A burst counts only when it begins on the same mark and stays inside a head-width group. Do not rescue it with a longer spray.',
      correction: 'If later bullets climb, pull down earlier. If the first bullets start low, you are overcompensating before recoil begins.',
    },
    {
      id: 'z2-loadout-card', zone: 2, kind: 'knowledge', title: 'Ranked loadout damage card',
      seconds: 120,
      lane: 'Zone 2 · Damage Lane',
      targetSetup: 'Same loadout · standing Dummy · one chest shot at 5 m, 15 m, 25 m, and 35 m · breakable-wall panel available',
      configuration: ['Target: standing Dummy', 'One chest shot: 5 m', 'One chest shot: 15 m', 'One chest shot: 25 m', 'One chest shot: 35 m', 'Wall: one bullet, then one 5-round burst'],
      action: 'Record the displayed chest damage at 5, 15, 25, and 35 metres. Then test one bullet and one five-round burst on the breakable wall so the Coach can save what this weapon actually opens.',
      metrics: ['damage5', 'damage15', 'damage25', 'damage35', 'wallEffect'], primaryMetric: 'knowledge',
      clean: 'This is complete only when all four visible damage values and the wall result are recorded for this exact loadout.',
      correction: 'Do not turn this into a speed drill. Zone 2 is a weapon-decision card and is repeated only after the loadout or live patch changes.',
    },
    {
      id: 'z3-first-shot', zone: 3, kind: 'performance', title: 'First-shot head placement', seconds: 60,
      lane: 'Zone 3 · Aiming Lane',
      targetSetup: 'Duration 60 s · Target Dummy · Maximum 1 · 110 HP · Idle · Near distance · Headshots Only ON · Infinite Ammo ON · Cover Barriers OFF',
      configuration: ['Duration: 60 s', 'Target: Dummy', 'Maximum targets: 1', 'Target health: 110 HP', 'Movement: Idle', 'Distance: Near', 'Headshots Only: On', 'Infinite Ammo: On', 'Cover Barriers: Off'],
      action: 'Begin centered at head height. ADS, make one deliberate correction to the head, fire one shot, release, and recenter before the next dummy.',
      metrics: ['accuracy', 'eliminations', 'headshots', 'hits'], primaryMetric: 'headshots',
      clean: 'The first bullet must earn the headshot. A body hit followed by a rescue burst does not prove first-shot placement.',
      correction: 'Chest hits mean the starting line is low. Passing the head means the final right-stick correction is too large—not that the sensitivity must immediately change.',
    },
    {
      id: 'z3-moving-control', zone: 3, kind: 'performance', title: 'Moving-target control', seconds: 60,
      lane: 'Zone 3 · Aiming Lane',
      targetSetup: 'Duration 60 s · Target Dummy · Maximum 1 · 110 HP · Movement Speed RANDOM · Movement Style RANDOM · Distance RANDOM · Headshots Only OFF · Infinite Ammo ON · Cover Barriers OFF',
      configuration: ['Duration: 60 s', 'Target: Dummy', 'Maximum targets: 1', 'Target health: 110 HP', 'Speed: Random', 'Movement style: Random', 'Distance: Random', 'Headshots Only: Off', 'Infinite Ammo: On', 'Cover Barriers: Off'],
      action: 'Acquire the upper chest, track smoothly, then finish at the head. Use short controlled bursts; do not hold the trigger while the reticle is behind the target.',
      metrics: ['accuracy', 'eliminations', 'headshots', 'hits'], primaryMetric: 'eliminations',
      clean: 'The result must improve eliminations while accuracy stays within two percentage points of the personal baseline.',
      correction: 'If you trail the target, add lead before firing. If you pass it, stop forcing speed and shorten the correction.',
    },
    {
      id: 'z3-transfer', zone: 3, kind: 'performance', title: 'Two-target transfer', seconds: 60,
      lane: 'Zone 3 · Aiming Lane',
      targetSetup: 'Duration 60 s · Target Dummy · Maximum 2 · 110 HP · Movement Speed RANDOM · Movement Style RANDOM · Distance RANDOM · Headshots Only OFF · Infinite Ammo ON · Cover Barriers OFF',
      configuration: ['Duration: 60 s', 'Target: Dummy', 'Maximum targets: 2', 'Target health: 110 HP', 'Speed: Random', 'Movement style: Random', 'Distance: Random', 'Headshots Only: Off', 'Infinite Ammo: On', 'Cover Barriers: Off'],
      action: 'Eliminate one target, release the trigger, move in one straight correction to the other target, settle, and fire. Alternate targets; do not farm only the easy lane.',
      metrics: ['accuracy', 'eliminations', 'headshots', 'hits'], primaryMetric: 'eliminations',
      clean: 'A transfer is controlled only when the reticle settles before the next burst and the accuracy guardrail holds.',
      correction: 'If accuracy falls, reduce transfer speed. Speed is promoted only after the stop becomes repeatable.',
    },
    {
      id: 'z3-cover-response', zone: 3, kind: 'performance', title: 'Cover appearance response', seconds: 60,
      lane: 'Zone 3 · Aiming Lane',
      targetSetup: 'Duration 60 s · Target Dummy · Maximum 2 · 110 HP · Movement Speed RANDOM · Movement Style RANDOM · Distance RANDOM · Headshots Only OFF · Infinite Ammo ON · Cover Barriers ON',
      configuration: ['Duration: 60 s', 'Target: Dummy', 'Maximum targets: 2', 'Target health: 110 HP', 'Speed: Random', 'Movement style: Random', 'Distance: Random', 'Headshots Only: Off', 'Infinite Ammo: On', 'Cover Barriers: On'],
      action: 'Hold the expected head line at the cover edge. When a target appears, make one horizontal correction, fire a short burst, and reset to the next cover edge.',
      metrics: ['accuracy', 'eliminations', 'headshots', 'hits'], primaryMetric: 'eliminations',
      clean: 'The target must be acquired from its cover edge without a vertical rescue or a spray started before it is visible.',
      correction: 'Late shots mean the reticle was not pre-placed on the exit line. Low shots mean you tracked the body instead of the head line.',
    },
  ],
}

export const TRAINING_LESSONS = [
  { id: 'aim-block', title: 'Personal three-zone Range program', venue: 'range', pass: 1, reps: 1, skill: 'aim', steps: RANGE_SESSION.setup,
    goal: 'Build an exact-loadout mechanics baseline, then improve the weakest comparable result without sacrificing accuracy.', proof: 'Visible Shooting Record values, exact Zone configuration, loadout key, evidence source, and timestamp.', review: 'The Coach assigns the lowest comparable drill; it does not average unlike settings or compare you to a pro.' },
  { id: 'slice-room', title: 'Slice a doorway', venue: 'custom', pass: 8, reps: 10, skill: 'peek',
    goal: 'Clear a doorway while opening only one new threat line at a time.',
    setup: 'Custom Game · choose one Ranked map and site · stand fully behind one real doorway · place a ping or bullet mark at expected head height.',
    rep: 'Five left-to-right slices, then five right-to-left. Reset fully behind cover after every rep.',
    proof: 'Clean rep = one new line opens, the reticle is already on its head line, and the body returns to cover before the next rep.',
    review: 'Mark the first repeated failure: wide exposure, crosshair low, moving while correcting, or failing to reset.',
    steps: ['Choose one actual doorway on the map/site you are learning.', 'Set the reticle on the first head-height threat line while still covered.', 'Move laterally just enough to reveal one new line; stop and clear it.', 'Reset completely behind cover. Repeat five times from each direction.'] },
  { id: 'quick-peek', title: 'Information peek and reset', venue: 'custom', pass: 8, reps: 10, skill: 'peek',
    goal: 'Collect one piece of information without turning the peek into a stationary duel.',
    setup: 'Custom Game · same doorway for all ten reps · one visible object or dummy line beyond the doorway acts as the information target.',
    rep: 'Five peeks from each side. Pre-place, expose only until the target becomes visible, identify it aloud, and return fully to cover.',
    proof: 'Clean rep = the target is identified, no extra angle opens, and the body is hidden again before a second decision.',
    review: 'Mark the first repeated failure: overexposure, predictable rhythm, crosshair drift, or staying for a fight.',
    steps: ['Pre-place the reticle before exposing.', 'Peek only until the chosen information target is visible.', 'Say what you saw, then return fully to cover.', 'Pause and change the rhythm before the next rep.'] },
  { id: 'operator-job', title: 'Operator gadget job', venue: 'custom', pass: 3, reps: 3, skill: 'operator',
    goal: 'Complete the selected operator’s round-winning job before taking an optional gunfight.',
    setup: 'Custom Game · select side, operator, Ranked map, and one objective · choose three realistic spawn or setup paths.',
    rep: 'Run one path at normal round pace, complete the gadget job, reach the planned safe position, then reset for the next path.',
    proof: 'Pass = gadget job completed, required route opened/denied, and the operator remained alive at the end of all three paths.',
    review: 'Mark the first repeated failure: gadget unused, wrong placement, unsafe route, late timing, or fighting before the job.',
    steps: ['Name the operator job in one sentence before moving.', 'Run path one and complete the job before taking a fight.', 'Repeat from two different realistic paths.', 'Save the path and failure reason, not just kills.'] },
  { id: 'room-clear', title: 'Drone-and-clear route', venue: 'custom', pass: 4, reps: 5, skill: 'room-clear',
    goal: 'Enter behind current information and clear connected rooms near-to-far without exposing multiple threat lines.',
    setup: 'Custom Game or Clear House · choose one entry, first room, connecting room, and destination · place the drone before the entry timer starts.',
    rep: 'Drone both rooms, leave the drone watching the next threat line, enter within five seconds, then clear near-to-far. Reset the route five times.',
    proof: 'Clean rep = both rooms were checked, entry followed current information within five seconds, and only one new line opened at a time.',
    review: 'Mark the first repeated failure: stale drone, skipped corner, wide exposure, slow entry, or drone not left useful.',
    steps: ['Name the entry room, connecting room, and final room.', 'Drone both rooms and park the drone on the next threat line.', 'Enter within five seconds of the final drone view.', 'Clear near-to-far and stop when new information is required.'] },
  { id: 'execute-ai', title: 'Field Training execution check', venue: 'ai', pass: 3, reps: 5, skill: 'execution',
    goal: 'Execute a route already passed in Custom Game while pressure and opponents are present.',
    setup: 'Field Training · use the same side, operator, map route, and one mission for all five rounds.',
    rep: 'Complete the planned route and operator job before chasing a kill. Record job completion at round end.',
    proof: 'Pass = the route and operator job were completed in at least three of five rounds; kills alone never count.',
    review: 'Classify each miss as route, utility, timing, information, positioning, or gunfight.',
    steps: ['State the one mission before the round starts.', 'Follow the passed route from Custom Game.', 'Complete the operator job before chasing a kill.', 'At round end classify the first reason the mission failed.'] },
  { id: 'pressure-check', title: 'Quick Match pressure check', venue: 'quick', pass: 2, reps: 3, skill: 'pressure',
    goal: 'Prove one already-trained mission survives unpredictable teammates, opponents, bans, and time pressure.',
    setup: 'Quick Match · carry one promoted lesson into three matches or three relevant rounds; do not switch the mission after one bad result.',
    rep: 'Read the mission before queue, attempt it whenever the correct side/site permits it, and judge job completion rather than kills.',
    proof: 'Pass = the trained job is completed twice in three eligible attempts with the same technique and no Ranked experimentation.',
    review: 'Separate “no eligible opportunity” from a real miss, then classify the miss as setup, decision, timing, utility, or mechanics.',
    steps: ['Choose one lesson already passed in its practice venue.', 'Keep the same mission for three eligible attempts.', 'Judge completion of the trained job, not the scoreboard.', 'Return to practice if the technique changes under pressure.'] },
]

export const PEEK_DIAGRAMS = [
  {
    id: 'slice-clear', title: 'Slice the pie', venue: 'custom',
    steps: [
      { label: 'Closed', detail: 'Start behind cover with the reticle at the first edge.' },
      { label: 'One line', detail: 'Move laterally until exactly one new angle becomes visible.' },
      { label: 'Clear or reset', detail: 'Clear that line, then continue one slice or return to cover.' },
    ],
    mistake: 'Wide-swinging the doorway exposes several enemy lines before any one is cleared.',
  },
  {
    id: 'info-peek', title: 'Shoulder / information peek', venue: 'custom',
    steps: [
      { label: 'Pre-place', detail: 'Set the reticle where the threat should appear before exposing.' },
      { label: 'Collect', detail: 'Expose only enough to see or provoke the current response.' },
      { label: 'Reset', detail: 'Break line of sight and choose the next action; do not repeat the rhythm.' },
    ],
    mistake: 'Turning an information check into a stationary duel defeats the purpose of the peek.',
  },
  {
    id: 'quick-peek-reset', title: 'Quick peek with reset', venue: 'custom',
    steps: [
      { label: 'Ready', detail: 'Stay close enough to cover that one movement returns the body safely.' },
      { label: 'Check', detail: 'Open one line without dragging the reticle away from threat height.' },
      { label: 'Hidden', detail: 'Finish completely behind cover before changing direction or repeating.' },
    ],
    mistake: 'Chasing speed before the reset is repeatable creates an uncontrolled wide exposure.',
  },
  {
    id: 'long-angle', title: 'Long-angle discipline', venue: 'custom',
    steps: [
      { label: 'Depth', detail: 'Stand farther from cover so less of the body appears from the enemy view.' },
      { label: 'Pixel', detail: 'Hold the narrowest useful line; do not creep until the whole body is visible.' },
      { label: 'Move after contact', detail: 'Once seen or fired on, change the angle instead of re-peeking the same line.' },
    ],
    mistake: 'Hugging the corner makes the near player appear sooner to the opponent on the wider angle.',
  },
]

export const RANK_STANDARDS = [
  { id: 'foundation', match: /copper|bronze/i, label: 'Foundation', rule: 'Prefer a clear self-contained job and repeatable setup. One lesson at a time.' },
  { id: 'teamplay', match: /silver|gold/i, label: 'Teamplay', rule: 'Fill the confirmed team role, trade, and complete utility before taking the duel.' },
  { id: 'adaptation', match: /platinum|emerald/i, label: 'Adaptation', rule: 'Weight map, site, bans, current lineup, and opponent evidence above a generic comfort pick.' },
  { id: 'precision', match: /diamond|champion/i, label: 'Precision', rule: 'Require site- and opponent-specific evidence; small timing and utility errors decide the round.' },
]

const norm = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const clampCount = (value) => Math.max(1, Math.min(5, Number(value) || 1))

export function rankStandard(rank) {
  return RANK_STANDARDS.find((item) => item.match.test(String(rank || ''))) || RANK_STANDARDS[1]
}

export function trainingPromotion(sessions, lessonId) {
  const relevant = (sessions || []).filter((item) => item.lessonId === lessonId).slice(-3)
  const passes = relevant.filter((item) => item.passed).length
  if (passes >= 2) return { status: 'ranked-ready', passes, message: 'Passed twice. This lesson may now be tested in Ranked.' }
  if (passes === 1) return { status: 'repeat', passes, message: 'One pass recorded. Repeat once in the same venue before promotion.' }
  return { status: 'practice', passes: 0, message: 'Practice first. Ranked is not the training environment for this lesson.' }
}

const metricNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function rangeLoadoutKey(loadout = {}) {
  return [loadout.side, loadout.operator, loadout.weapon, loadout.sight, loadout.attachments]
    .map((value) => norm(value)).filter(Boolean).join('|') || 'loadout-unset'
}

export function rangeConfigurationKey(stage, loadout = {}) {
  return `${stage?.id || 'unknown'}|${rangeLoadoutKey(loadout)}|${(stage?.configuration || []).join('|')}`
}

function resultMetric(result, key) {
  return metricNumber(result?.metrics?.[key] ?? result?.[key])
}

function comparableStageResults(sessions, stage, loadout) {
  const key = rangeConfigurationKey(stage, loadout)
  const rows = []
  for (const session of sessions || []) {
    for (const result of session?.stageResults || []) {
      const resultStage = RANGE_SESSION.stages.find((item) => item.id === result.drillId)
      const resultKey = result.configKey || rangeConfigurationKey(resultStage, session.loadout || {})
      if (resultKey === key) rows.push(result)
    }
  }
  return rows
}

export function evaluateRangeStage(stage, result, baseline = null) {
  if (!stage || !result) return { complete: false, passed: false, status: 'missing', message: 'No result was recorded.' }
  if (stage.kind === 'knowledge') {
    const required = ['damage5', 'damage15', 'damage25', 'damage35']
    const complete = required.every((key) => resultMetric(result, key) != null) && String(result?.metrics?.wallEffect || '').trim().length > 0
    return {
      complete, passed: complete, status: complete ? 'documented' : 'missing',
      message: complete ? 'Loadout damage card documented.' : 'Record 5 m, 15 m, 25 m, and 35 m chest damage plus the wall result.',
    }
  }
  const primary = resultMetric(result, stage.primaryMetric)
  const accuracy = resultMetric(result, 'accuracy')
  if (primary == null || accuracy == null) {
    return { complete: false, passed: false, status: 'missing', message: `The Shooting Record must prove ${stage.primaryMetric} and accuracy.` }
  }
  if (!baseline) {
    return { complete: true, passed: false, status: 'baseline', primary, accuracy, target: null, message: 'Personal baseline established; this first result is not a pass.' }
  }
  const baselinePrimary = resultMetric(baseline, stage.primaryMetric)
  const baselineAccuracy = resultMetric(baseline, 'accuracy')
  if (baselinePrimary == null || baselineAccuracy == null) {
    return { complete: true, passed: false, status: 'baseline', primary, accuracy, target: null, message: 'Comparable baseline was incomplete; this result becomes the baseline.' }
  }
  const target = stage.primaryMetric === 'accuracy'
    ? Math.min(100, baselinePrimary + 3)
    : baselinePrimary + 1
  const accuracyFloor = stage.primaryMetric === 'accuracy' ? target : Math.max(0, baselineAccuracy - 2)
  const passed = primary >= target && accuracy >= accuracyFloor
  return {
    complete: true, passed, status: passed ? 'passed' : 'repeat', primary, accuracy, target, accuracyFloor,
    message: passed
      ? `${stage.title} beat the personal target without losing accuracy.`
      : `${stage.title}: target ${target} ${stage.primaryMetric}; keep accuracy at ${accuracyFloor}% or better.`,
  }
}

export function buildPersonalRangePlan(sessions = [], loadout = {}) {
  const comparable = (sessions || []).filter((session) => session?.lessonId === RANGE_SESSION.id && rangeLoadoutKey(session.loadout || {}) === rangeLoadoutKey(loadout))
  const knowledgeStage = RANGE_SESSION.stages.find((stage) => stage.kind === 'knowledge')
  const performance = RANGE_SESSION.stages.filter((stage) => stage.kind === 'performance')
  const hasBaseline = performance.every((stage) => comparableStageResults(comparable, stage, loadout).length > 0)
  if (!hasBaseline) {
    return { mode: 'assessment', stages: RANGE_SESSION.stages, reason: 'No complete comparable baseline exists for this exact loadout. Run all three zones once.' }
  }
  const knowledgeDone = comparableStageResults(comparable, knowledgeStage, loadout).some((result) => evaluateRangeStage(knowledgeStage, result).complete)
  const ranked = performance.map((stage) => {
    const rows = comparableStageResults(comparable, stage, loadout)
    const baseline = rows[0]
    const latest = rows.at(-1)
    const evaluation = evaluateRangeStage(stage, latest, baseline === latest ? null : baseline)
    const deficit = evaluation.status === 'passed' ? 0 : evaluation.target == null ? 999 : Math.max(1, evaluation.target - evaluation.primary)
    return { stage, deficit, status: evaluation.status }
  }).sort((a, b) => b.deficit - a.deficit || a.stage.zone - b.stage.zone)
  const stages = ranked.slice(0, 3).map((item) => item.stage)
  if (!knowledgeDone) stages.splice(1, 0, knowledgeStage)
  return {
    mode: 'personal-workout', stages: stages.slice(0, 4),
    reason: `Assigned from the weakest comparable results for ${loadout.operator || 'this operator'} and ${loadout.weapon || 'this weapon'}.`,
  }
}

export function evaluateRangeSession(stageResults, priorSessions = [], loadout = {}) {
  const normalized = Array.isArray(stageResults) ? stageResults : []
  if (!normalized.length) return { complete: false, passed: false, successes: 0, evaluations: [], message: 'No Range evidence was recorded.' }
  const evaluations = normalized.map((result) => {
    const stage = RANGE_SESSION.stages.find((item) => item.id === result.drillId)
    const baseline = stage ? comparableStageResults(priorSessions, stage, loadout)[0] || null : null
    return { drillId: result.drillId, ...evaluateRangeStage(stage, result, baseline) }
  })
  const complete = evaluations.every((item) => item.complete)
  const performance = evaluations.filter((item) => item.status !== 'documented')
  const baseline = performance.some((item) => item.status === 'baseline')
  const passed = complete && !baseline && performance.length > 0 && performance.every((item) => item.passed)
  const successes = performance.length ? Math.round((performance.filter((item) => item.passed).length / performance.length) * 10) : 0
  return {
    complete, passed, baseline, successes, evaluations,
    message: baseline
      ? 'Assessment saved. Your exact-loadout baseline is now established; no pass was claimed.'
      : passed
        ? 'Personal workout passed: every assigned drill beat its saved target without losing accuracy.'
        : 'Workout saved. The Coach will reassign the drills that missed their personal target.',
  }
}

export function parseRangeRecordText(text) {
  const source = String(text || '').replace(/,/g, ' ')
  const read = (patterns) => {
    for (const pattern of patterns) {
      const match = pattern.exec(source)
      if (match) return metricNumber(match[1])
    }
    return null
  }
  const metrics = {
    accuracy: read([/accuracy\s*[:-]?\s*(\d{1,3})\s*%/i, /(\d{1,3})\s*%\s*accuracy/i]),
    eliminations: read([/(?:eliminations?|targets?|kills?)\s*[:-]?\s*(\d{1,3})/i]),
    headshots: read([/head\s*shots?\s*[:-]?\s*(\d{1,3})/i]),
    hits: read([/(?:shots?\s*)?hits?\s*[:-]?\s*(\d{1,4})/i]),
    shots: read([/(?:shots?\s*(?:fired|taken)|bullets?)\s*[:-]?\s*(\d{1,4})/i]),
  }
  const fields = Object.values(metrics).filter((value) => value != null).length
  return { metrics, fields, confidence: Math.min(1, fields / 3), raw: source.replace(/\s+/g, ' ').trim().slice(0, 500) }
}

export function summarizeRangeTraining(sessions = [], loadout = {}) {
  const relevant = (sessions || []).filter((session) => session?.lessonId === RANGE_SESSION.id)
  const sameLoadout = relevant.filter((session) => rangeLoadoutKey(session.loadout || {}) === rangeLoadoutKey(loadout))
  const latest = sameLoadout.at(-1) || null
  const plan = buildPersonalRangePlan(relevant, loadout)
  return {
    sessions: sameLoadout.length,
    verified: sameLoadout.filter((session) => (session.stageResults || []).some((result) => result.evidenceSource === 'local-ocr')).length,
    passes: sameLoadout.filter((session) => session.passed).length,
    latest,
    plan,
  }
}

function performanceFor(performance, side, op) {
  const sideData = performance?.[side] || performance || {}
  const direct = sideData[op] || sideData[norm(op)] || {}
  const rounds = Number(direct.rounds || 0)
  const wins = Number(direct.wins || 0)
  return { rounds, wins, losses: Number(direct.losses || Math.max(0, rounds - wins)) }
}

function trainingFor(sessions, op) {
  const relevant = (sessions || []).filter((item) => norm(item.operator) === norm(op)).slice(-6)
  return { attempts: relevant.length, passes: relevant.filter((item) => item.passed).length }
}

export function recommendOperators(context = {}) {
  const side = context.side === 'defense' ? 'defense' : context.side === 'attack' ? 'attack' : null
  if (!side) return []
  const banned = new Set((context.banned || []).map(norm))
  const taken = new Set((context.taken || []).map(norm))
  const siteNeeds = new Set((context.siteNeeds || []).map(norm))
  const missingRoles = new Set((context.missingRoles || []).map(norm))
  const depth = context.depth?.[side]?.length ? context.depth[side] : OPERATOR_DEPTH[side]
  const stage = rankStandard(context.rank).id

  return depth
    .filter((item) => !banned.has(norm(item.op)) && !taken.has(norm(item.op)))
    .map((item) => {
      const personal = performanceFor(context.performance, side, item.op)
      const training = trainingFor(context.trainingSessions, item.op)
      let score = 0
      const reasons = []
      const sources = []

      if (personal.rounds >= 8) {
        const pct = Math.round((100 * personal.wins) / Math.max(1, personal.rounds))
        score += Math.max(-5, Math.min(8, (pct - 50) / 2)) + Math.min(5, Math.log2(personal.rounds))
        reasons.push(`${pct}% over ${personal.rounds} recorded rounds`)
        sources.push('personal evidence')
      } else {
        reasons.push(personal.rounds ? `${personal.rounds} recorded rounds; still learning` : 'personal sample not established')
        sources.push('learning')
      }
      if (siteNeeds.has(norm(item.op))) {
        score += stage === 'precision' ? 13 : stage === 'adaptation' ? 11 : stage === 'teamplay' ? 9 : 7
        reasons.unshift('confirmed site fit')
        sources.push('map/site fit')
      }
      const filled = item.roles.filter((role) => missingRoles.has(norm(role)))
      if (filled.length) {
        score += 8 + filled.length
        reasons.unshift(`fills ${filled.join(' + ')}`)
        sources.push('team need')
      }
      if (context.mapNeedsHardBreach && item.roles.includes('hard-breach')) {
        score += 5
        reasons.push('map keeps hard breach valuable')
        sources.push('map fit')
      }
      if (context.mapNeedsHardBreach === false && item.roles.includes('hard-breach')) score -= 4
      if (stage === 'foundation' && item.roles.some((role) => ['intel', 'trap', 'anchor', 'support'].includes(role))) {
        score += 2
        reasons.push('repeatable foundation job')
        sources.push('rank standard')
      }
      if (stage === 'precision' && !siteNeeds.size && !missingRoles.size) {
        score -= 1
        reasons.push('awaiting site or lineup evidence for Champion-level precision')
        sources.push('rank standard')
      }
      if (training.passes >= 2) {
        score += 4
        reasons.push('operator job passed twice in training')
        sources.push('training proof')
      } else if (training.attempts) {
        score += training.passes
        reasons.push(`${training.passes}/${training.attempts} training passes`)
        sources.push('training')
      }
      return { ...item, score, reasons: [...new Set(reasons)], sources: [...new Set(sources)], personal, training }
    })
    .sort((a, b) => b.score - a.score || b.personal.rounds - a.personal.rounds || a.op.localeCompare(b.op))
    .slice(0, 5)
}

export function situationPlan({ ours, theirs, side, planted = false } = {}) {
  const us = clampCount(ours)
  const them = clampCount(theirs)
  const role = side === 'defense' ? 'defense' : 'attack'
  const label = `${us}v${them}`
  if (us === 5 && them === 5) {
    return { label, state: 'even', headline: 'Build information before the first commitment.', actions: role === 'attack'
      ? ['Drone two connected rooms.', 'Assign breach, flank watch, and entry jobs.', 'Enter in trade distance; do not give the first isolated death.']
      : ['Finish the site setup.', 'Assign one early-information player and keep tradeable site pairs.', 'Do not spend two lives contesting the same doorway.'] }
  }
  if (us > them) {
    return { label, state: 'advantage', headline: 'Protect the extra body; make the opponent take the risk.', actions: role === 'attack'
      ? ['Keep pairs and secure the objective route.', 'Trade instead of hunting the last defenders.', planted ? 'Hold separate crossfires on the defuser.' : 'Use the body advantage to plant behind cover.']
      : ['Collapse toward tradeable positions.', 'Hold crossfires and force the attackers through utility.', planted ? 'Retake together on one countdown.' : 'Let the clock force their execute.'] }
  }
  if (us === 1) {
    return { label, state: 'clutch', headline: 'Do not fight the whole team at once.', actions: role === 'attack'
      ? ['Use sound or a drone to isolate one defender.', 'Take one covered fight, then relocate.', planted ? 'Play the defuser clock from a new line.' : 'Prioritize a plant only when the route is actually clear.']
      : ['Use cameras or sound before exposing.', 'Isolate the first attacker and change position after contact.', planted ? 'Create one safe defuse attempt; fake only if it pulls a fight.' : 'Let the round clock reduce their options.'] }
  }
  return { label, state: 'disadvantage', headline: 'Create separate fights instead of a team-wide swing.', actions: role === 'attack'
    ? ['Use utility to remove one angle.', 'Pair the nearest two players for a trade.', planted ? 'Stop hunting and play the objective clock.' : 'Choose one route and commit together before time disappears.']
    : ['Give up isolated space and build one crossfire.', 'Use denial to split the execute.', planted ? 'Retake through one cleared route together.' : 'Force attackers to spend time clearing you.'] }
}

export const OPERATOR_TRAINING_API = {
  LIVE_RULESET, OPERATOR_DEPTH_TARGET, OPERATOR_DEPTH, TRAINING_VENUES, TRAINING_LESSONS,
  RANGE_ZONES, RANGE_SESSION, PEEK_DIAGRAMS, RANK_STANDARDS, rankStandard, trainingPromotion,
  rangeLoadoutKey, rangeConfigurationKey, evaluateRangeStage, buildPersonalRangePlan,
  evaluateRangeSession, parseRangeRecordText, summarizeRangeTraining,
  recommendOperators, situationPlan,
}

if (typeof window !== 'undefined') window.Recon6Training = OPERATOR_TRAINING_API
