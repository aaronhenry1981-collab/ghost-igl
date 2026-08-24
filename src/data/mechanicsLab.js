// Recon 6 Mechanics Lab — controlled, player-specific training rules.
//
// This module deliberately has no "best sensitivity" values. It proposes one
// small candidate change from the player's own saved baseline, compares the
// same drill under both settings, and requires two winning comparisons before
// a setting is locked. The thresholds below are Recon 6 product guardrails,
// not claims about universal Siege performance.

export const MECHANICS_SCHEMA_VERSION = 4

const EMPTY_PROFILE = {
  platform: '',
  input: '',
  dpi: null,
  hipHorizontal: null,
  hipVertical: null,
  ads1x: null,
  ads2_5x: null,
  leftDeadzone: null,
  rightDeadzone: null,
  fov: null,
  driftStatus: 'unknown',
}

export const SENSITIVITY_ISSUES = [
  {
    id: 'over-flick',
    inputs: ['mouse', 'controller'],
    label: 'I pass the target',
    setting: 'ads1x',
    delta: -1,
    primaryMetric: 'acquisition',
    reason: 'Test whether a single lower 1.0x ADS step reduces repeated overshoot.',
  },
  {
    id: 'under-flick',
    inputs: ['mouse', 'controller'],
    label: 'I stop short of the target',
    setting: 'ads1x',
    delta: 1,
    primaryMetric: 'acquisition',
    reason: 'Test whether a single higher 1.0x ADS step reduces repeated undershoot.',
  },
  {
    id: 'slow-turn',
    inputs: ['mouse', 'controller'],
    label: 'Turning between threats is too slow',
    setting: 'hipHorizontal',
    delta: 1,
    primaryMetric: 'peek',
    reason: 'Test hip horizontal separately so ADS precision is not changed at the same time.',
  },
  {
    id: 'shaky-micro',
    inputs: ['mouse', 'controller'],
    label: 'Small corrections are too jumpy',
    setting: 'ads1x',
    delta: -1,
    primaryMetric: 'micro',
    reason: 'Test one lower 1.0x ADS step against the same small-correction lane.',
  },
  {
    id: 'stick-drift',
    inputs: ['controller'],
    label: 'Right stick drifts by itself',
    setting: 'rightDeadzone',
    delta: 1,
    primaryMetric: 'micro',
    reason: 'Raise right-stick deadzone one step at a time only until visible drift stops.',
  },
  {
    id: 'micro-stuck',
    inputs: ['controller'],
    label: 'Tiny stick movement does not register',
    setting: 'rightDeadzone',
    delta: -1,
    primaryMetric: 'micro',
    reason: 'Test one lower right-stick deadzone step only after confirming the stick is not drifting.',
    requiresNoDrift: true,
  },
  {
    id: 'recoil-only',
    inputs: ['mouse', 'controller'],
    label: 'My recoil control is inconsistent',
    setting: null,
    delta: 0,
    primaryMetric: 'recoil',
    reason: 'Do not diagnose recoil as sensitivity from this symptom alone. Train and compare recoil first.',
  },
]

export const PEEK_DRILLS = [
  {
    id: 'slice-clear',
    title: 'Slice one line at a time',
    category: 'Portable ranked fundamental',
    instruction: 'Clear a doorway in small sections so only one new angle can see you at a time.',
    success: 'Count reps where exactly one new line opens and the reticle is already placed.',
    badWhen: 'Do not keep slicing after fresh information proves an immediate threat needs a different response.',
  },
  {
    id: 'info-peek',
    title: 'Information peek and reset',
    category: 'Portable ranked fundamental',
    instruction: 'Expose only enough to confirm visible information, then break line of sight and decide again.',
    success: 'Count reps that return to cover without turning the check into an unnecessary duel.',
    badWhen: 'Do not repeat the same rhythm after the opponent has seen the peek.',
  },
  {
    id: 'fresh-info-prefire',
    title: 'Fresh-information prefire',
    category: 'Evidence-gated fundamental',
    instruction: 'Use a current visible cue, pre-place the reticle, and fire only through the confirmed line.',
    success: 'Count reps where the cue is current and the shot follows that exact visible line.',
    badWhen: 'Do not treat stale pings, old sound, or a guessed position as current evidence.',
  },
  {
    id: 'trade-swing',
    title: 'Trade swing',
    category: 'Coordinated-team concept',
    instruction: 'With a partner, keep enough spacing to engage the same opponent immediately after contact.',
    success: 'Count reps where the second player can act without crossing or blocking the first player.',
    badWhen: 'Do not recommend this when teammate position and readiness are unconfirmed.',
  },
  {
    id: 'quick-peek-reset',
    title: 'Quick peek with a clean reset',
    category: 'Advanced controlled movement',
    instruction: 'Check one line, return fully behind cover, and keep the reticle aligned for the next decision.',
    success: 'Count left and right reps that finish in cover without losing crosshair placement.',
    badWhen: 'Do not chase speed, use macros, or copy a named pro input pattern before control is repeatable.',
  },
]

function finiteOrNull(value) {
  if (value === '' || value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number))
}

function text(value, length = 80) {
  return String(value || '').slice(0, length)
}

function rangeMetrics(value = {}) {
  const out = {}
  for (const key of ['accuracy', 'eliminations', 'headshots', 'hits', 'shots', 'damage5', 'damage15', 'damage25', 'damage35', 'damageNear', 'damageMid', 'damageFar']) {
    const number = finiteOrNull(value?.[key])
    if (number != null) out[key] = clamp(number, 0, key === 'accuracy' ? 100 : 9999)
  }
  if (value?.wallEffect) out.wallEffect = text(value.wallEffect, 120)
  return out
}

function normalizeResult(value = {}) {
  return {
    acquisition: clamp(Number(value.acquisition) || 0, 0, 10),
    micro: clamp(Number(value.micro) || 0, 0, 10),
    peek: clamp(Number(value.peek) || 0, 0, 10),
    recoil: clamp(Number(value.recoil) || 0, 0, 10),
    errors: clamp(Number(value.errors) || 0, 0, 10),
    comfort: clamp(Number(value.comfort) || 1, 1, 5),
  }
}

export function emptyMechanicsState() {
  return {
    version: MECHANICS_SCHEMA_VERSION,
    profile: { ...EMPTY_PROFILE },
    issueId: '',
    comparisons: [],
    aimSessions: [],
    peekSessions: [],
    trainingSessions: [],
    lockedSetting: null,
    lockedAt: null,
    updatedAt: null,
  }
}

export function normalizeMechanicsState(value) {
  const source = value && typeof value === 'object' ? value : {}
  const profile = source.profile && typeof source.profile === 'object' ? source.profile : {}
  return {
    version: MECHANICS_SCHEMA_VERSION,
    profile: {
      ...EMPTY_PROFILE,
      platform: ['pc', 'ps5', 'xbox'].includes(profile.platform) ? profile.platform : '',
      input: ['mouse', 'controller'].includes(profile.input) ? profile.input : '',
      dpi: finiteOrNull(profile.dpi),
      hipHorizontal: finiteOrNull(profile.hipHorizontal),
      hipVertical: finiteOrNull(profile.hipVertical),
      ads1x: finiteOrNull(profile.ads1x),
      ads2_5x: finiteOrNull(profile.ads2_5x),
      leftDeadzone: finiteOrNull(profile.leftDeadzone),
      rightDeadzone: finiteOrNull(profile.rightDeadzone),
      fov: finiteOrNull(profile.fov),
      driftStatus: ['unknown', 'none', 'present'].includes(profile.driftStatus) ? profile.driftStatus : 'unknown',
    },
    issueId: SENSITIVITY_ISSUES.some((issue) => issue.id === source.issueId) ? source.issueId : '',
    comparisons: Array.isArray(source.comparisons) ? source.comparisons.slice(-8) : [],
    aimSessions: Array.isArray(source.aimSessions) ? source.aimSessions.slice(-20) : [],
    peekSessions: Array.isArray(source.peekSessions) ? source.peekSessions.slice(-20) : [],
    trainingSessions: Array.isArray(source.trainingSessions)
      ? source.trainingSessions.slice(-40).map((session) => ({
        id: String(session?.id || ''),
        ts: String(session?.ts || ''),
        lessonId: String(session?.lessonId || ''),
        venue: String(session?.venue || ''),
        operator: String(session?.operator || '').slice(0, 30),
        side: session?.side === 'attack' || session?.side === 'defense' ? session.side : '',
        successes: clamp(Number(session?.successes) || 0, 0, 10),
        reps: clamp(Number(session?.reps) || 1, 1, 10),
        passed: session?.passed === true,
        evidenceSource: ['local-ocr', 'player-confirmed', 'legacy-manual'].includes(session?.evidenceSource) ? session.evidenceSource : '',
        evidenceText: text(session?.evidenceText, 500),
        failureReason: text(session?.failureReason, 60),
        stageScores: Array.isArray(session?.stageScores)
          ? session.stageScores.slice(0, 8).map((score) => clamp(Number(score) || 0, 0, 10))
          : [],
        programmeVersion: clamp(Number(session?.programmeVersion) || 1, 1, 20),
        mode: ['assessment', 'personal-workout', 'legacy'].includes(session?.mode) ? session.mode : 'legacy',
        loadout: session?.loadout && typeof session.loadout === 'object' ? {
          side: session.loadout.side === 'defense' ? 'defense' : session.loadout.side === 'attack' ? 'attack' : '',
          operator: text(session.loadout.operator, 30),
          weapon: text(session.loadout.weapon, 50),
          sight: text(session.loadout.sight, 30),
          attachments: text(session.loadout.attachments, 100),
        } : null,
        stageResults: Array.isArray(session?.stageResults) ? session.stageResults.slice(0, 8).map((result) => ({
          drillId: text(result?.drillId, 50),
          zone: clamp(Number(result?.zone) || 0, 0, 3),
          configKey: text(result?.configKey, 500),
          metrics: rangeMetrics(result?.metrics),
          evidenceSource: ['local-ocr', 'player-confirmed', 'legacy-manual'].includes(result?.evidenceSource) ? result.evidenceSource : 'player-confirmed',
          evidenceText: text(result?.evidenceText, 500),
          failureReason: text(result?.failureReason, 60),
          observedAt: text(result?.observedAt, 40),
          evaluation: result?.evaluation && typeof result.evaluation === 'object' ? {
            status: text(result.evaluation.status, 30),
            passed: result.evaluation.passed === true,
            message: text(result.evaluation.message, 240),
            primary: finiteOrNull(result.evaluation.primary),
            target: finiteOrNull(result.evaluation.target),
            accuracy: finiteOrNull(result.evaluation.accuracy),
            accuracyFloor: finiteOrNull(result.evaluation.accuracyFloor),
          } : null,
        })) : [],
      }))
      : [],
    lockedSetting: source.lockedSetting && typeof source.lockedSetting === 'object' ? source.lockedSetting : null,
    lockedAt: typeof source.lockedAt === 'string' ? source.lockedAt : null,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
  }
}

export function issuesForInput(input) {
  return SENSITIVITY_ISSUES.filter((issue) => issue.inputs.includes(input))
}

export function buildSensitivityPlan(profile, issueId) {
  const issue = SENSITIVITY_ISSUES.find((item) => item.id === issueId)
  if (!issue) return { status: 'blocked', message: 'Choose the repeated problem you want to test.' }
  if (!issue.inputs.includes(profile?.input)) {
    return { status: 'blocked', message: 'Choose the player input before creating a test.' }
  }
  if (!issue.setting) {
    return {
      status: 'drill-only',
      issueId: issue.id,
      primaryMetric: issue.primaryMetric,
      message: issue.reason,
    }
  }
  if (issue.requiresNoDrift && profile?.driftStatus !== 'none') {
    return {
      status: 'blocked',
      message: 'Confirm that the right stick has no visible drift before testing a lower deadzone.',
    }
  }
  const baseline = finiteOrNull(profile?.[issue.setting])
  if (baseline == null) {
    return { status: 'blocked', message: `Enter the current ${settingLabel(issue.setting)} value first.` }
  }
  const candidate = clamp(baseline + issue.delta, 0, 200)
  if (candidate === baseline) return { status: 'blocked', message: 'That setting is already at its safe numeric boundary.' }
  return {
    status: 'ready',
    id: `${issue.id}:${issue.setting}:${baseline}:${candidate}`,
    issueId: issue.id,
    setting: issue.setting,
    settingLabel: settingLabel(issue.setting),
    baseline,
    candidate,
    primaryMetric: issue.primaryMetric,
    message: issue.reason,
    instruction: 'Run the same ten-rep lanes with the baseline and candidate. Change nothing else.',
  }
}

export function settingLabel(key) {
  return ({
    ads1x: '1.0x ADS',
    hipHorizontal: 'hip horizontal',
    rightDeadzone: 'right-stick deadzone',
  })[key] || key
}

export function evaluateSensitivityComparison(plan, baselineValue, candidateValue) {
  if (!plan || plan.status !== 'ready') return { verdict: 'blocked', message: 'Create a valid one-variable plan first.' }
  const baseline = normalizeResult(baselineValue)
  const candidate = normalizeResult(candidateValue)
  const baselineTotal = baseline.acquisition + baseline.micro + baseline.peek + baseline.recoil
  const candidateTotal = candidate.acquisition + candidate.micro + candidate.peek + candidate.recoil
  const primaryImproved = candidate[plan.primaryMetric] >= baseline[plan.primaryMetric] + 1
  const guardrailsHeld = candidateTotal >= baselineTotal && candidate.errors <= baseline.errors && candidate.comfort >= baseline.comfort - 1

  if (primaryImproved && guardrailsHeld) {
    return {
      verdict: 'candidate-won',
      message: 'Candidate won this comparison. Repeat the same comparison once more before locking it.',
      baseline,
      candidate,
      baselineTotal,
      candidateTotal,
    }
  }
  if (candidateTotal < baselineTotal || candidate.errors > baseline.errors || candidate.comfort < baseline.comfort - 1) {
    return {
      verdict: 'rollback',
      message: 'Candidate lost a guardrail. Return to the saved baseline instead of forcing the change.',
      baseline,
      candidate,
      baselineTotal,
      candidateTotal,
    }
  }
  return {
    verdict: 'inconclusive',
    message: 'No clear winner. Keep the baseline and repeat later; do not stack another setting change.',
    baseline,
    candidate,
    baselineTotal,
    candidateTotal,
  }
}

export function sensitivityHistoryVerdict(state, plan) {
  if (!plan || plan.status !== 'ready') return { status: 'not-ready', wins: 0 }
  const relevant = (state?.comparisons || []).filter((item) => item.planId === plan.id).slice(-2)
  const latest = relevant.at(-1)
  if (!latest) return { status: 'not-tested', wins: 0 }
  if (latest.verdict === 'rollback') return { status: 'rollback', wins: 0 }
  const wins = relevant.filter((item) => item.verdict === 'candidate-won').length
  if (relevant.length === 2 && wins === 2) return { status: 'lock-candidate', wins }
  if (latest.verdict === 'candidate-won') return { status: 'repeat', wins }
  return { status: 'inconclusive', wins }
}
