// In-product feedback moments, prompt selection, answer validation and the
// CRM's feedback analysis. Pure rules.
//
// One prompt at a time, chosen by priority from the moments that are due.
// Each moment occurrence has a key; once answered or dismissed it is never
// asked again, and "not now" is allowed once. Themes are keyword rules, not
// AI: every theme shows the quotes that produced it.

import { toMs } from './facts.mjs'

const DAY = 86400000
export const PROMPT_COOLDOWN_DAYS = 5
export const SNOOZE_DAYS = 3

export const QUESTIONS = Object.freeze({
  used: {
    type: 'multi',
    label: 'What did you use?',
    options: [['round_plans', 'Round plans'], ['match_prep', 'Match prep'], ['vod', 'VOD review'], ['road_to_champion', 'Road to Champion'], ['live_guide', 'Live round guide'], ['coaching', 'Coaching session'], ['operators', 'Operators & loadouts']],
  },
  helpful: { type: 'scale', min: 1, max: 5, label: 'How helpful has it been?', low: 'Not at all', high: 'Very' },
  confusing: { type: 'text', optional: true, max: 500, label: 'Was anything confusing?' },
  result: {
    type: 'choice',
    label: 'What result did you get?',
    options: [['won_more', 'Won more rounds'], ['ranked_up', 'Ranked up'], ['fixed_mistake', 'Fixed a specific mistake'], ['too_early', 'Too early to tell'], ['no_change', 'No change yet']],
  },
  missing: { type: 'text', optional: true, max: 500, label: 'What is missing for you?' },
  nps: { type: 'scale', min: 0, max: 10, label: 'How likely are you to recommend Recon 6 to a friend who plays Siege?', low: 'Not likely', high: 'Very likely' },
  review: { type: 'review', optional: true, label: 'Can we share your experience?' },
  cancel_reason: {
    type: 'choice',
    label: 'What is the main reason you are leaving?',
    options: [['too_expensive', 'Too expensive'], ['not_using', 'Not using it enough'], ['content_quality', 'Content was not accurate enough'], ['missing_feature', 'Missing something I need'], ['technical', 'Technical problems'], ['other', 'Something else']],
  },
  blocker: {
    type: 'choice',
    label: 'What is stopping the renewal?',
    options: [['card', 'A card problem'], ['cost', 'The cost'], ['value', 'Not getting enough value'], ['pausing', 'Taking a break'], ['other', 'Something else']],
  },
  comment: { type: 'text', optional: true, max: 1000, label: 'Anything else?' },
})

function ageDays(iso, now) {
  const ms = toMs(iso)
  return Number.isFinite(ms) ? (now - ms) / DAY : null
}

// Ordered by priority (first due moment wins).
export const MOMENTS = Object.freeze([
  {
    id: 'cancellation',
    title: 'Before you go',
    intro: 'One question. It goes straight to Aaron and changes what we build.',
    questions: ['cancel_reason', 'missing', 'comment'],
    bypassCooldown: true,
    due: (f, _l, now) => (f.billing.status === 'cancelling' || (f.billing.churned && Math.abs(ageDays(f.billing.currentPeriodEnd, now) ?? 99) <= 14)
      ? String(f.billing.currentPeriodEnd).slice(0, 10) : null),
  },
  {
    id: 'failed_renewal',
    title: 'Your renewal did not go through',
    intro: 'If something is in the way, tell us and we will sort it.',
    questions: ['blocker', 'comment'],
    bypassCooldown: true,
    due: (f) => (f.billing.status === 'payment_failed' ? String(f.billing.currentPeriodEnd).slice(0, 10) : null),
  },
  {
    id: 'after_coaching',
    title: 'How was your session?',
    intro: 'Thirty seconds, and it shapes the next one.',
    questions: ['helpful', 'result', 'nps', 'review'],
    due: (f, _l, now) => {
      const age = ageDays(f.activity.coaching?.lastCompletedAt, now)
      return age !== null && age >= 0 && age <= 3 ? String(f.activity.coaching.lastCompletedAt).slice(0, 16) : null
    },
  },
  {
    id: 'after_vod',
    title: 'Was your VOD review useful?',
    intro: 'Tell us if the mistake it found was the right one.',
    questions: ['helpful', 'result', 'confusing'],
    due: (f, _l, now) => {
      const age = ageDays(f.activity.vod.lastAt, now)
      return age !== null && age >= 0 && age <= 3 ? String(f.activity.vod.lastAt).slice(0, 10) : null
    },
  },
  {
    id: 'meaningful_use',
    title: 'You have been putting in the work',
    intro: 'Quick check: is it helping?',
    questions: ['used', 'helpful', 'missing'],
    due: (f) => {
      const climb = f.activity.roadToChampion
      if (climb && climb.tiersComplete >= 1) return `tier-${climb.tiersComplete}`
      if (f.activity.strategy.total >= 5 && f.activity.usageEvidence === 'recorded') return 'plans-5'
      return null
    },
  },
  {
    id: 'month_1',
    title: 'One month in',
    intro: 'What has changed in your games?',
    questions: ['result', 'helpful', 'missing', 'nps', 'review'],
    due: (f, _l, now) => {
      const age = ageDays(f.account.createdAt, now)
      return age !== null && age >= 28 && age <= 35 ? 'account' : null
    },
  },
  {
    id: 'week_1',
    title: 'Your first week',
    intro: 'Four quick answers so we can make the next week better.',
    questions: ['used', 'helpful', 'missing', 'nps'],
    due: (f, _l, now) => {
      const age = ageDays(f.account.createdAt, now)
      return age !== null && age >= 7 && age <= 10 ? 'account' : null
    },
  },
  {
    id: 'early_days',
    title: 'How is it going so far?',
    intro: 'Two taps. Tell us what is confusing while it is fresh.',
    questions: ['used', 'helpful', 'confusing'],
    due: (f, _l, now) => {
      const age = ageDays(f.account.createdAt, now)
      return age !== null && age >= 2 && age <= 4 && f.account.lastSeenAt ? 'account' : null
    },
  },
])

export const MOMENT_BY_ID = Object.freeze(Object.fromEntries(MOMENTS.map((m) => [m.id, m])))

export function momentKey(momentId, instance) {
  return `${momentId}#${instance}`
}

function promptState(facts, key) {
  return facts.cs.prompts.find((p) => p.momentKey === key) || null
}

// The single prompt to show now, or null.
export function selectFeedbackPrompt(facts, lifecycle, { now = Date.now() } = {}) {
  if (facts.identity.isAdmin) return null
  const answered = new Set(facts.cs.feedback.map((f) => f.momentKey).filter(Boolean))
  const lastShown = Math.max(0, ...facts.cs.prompts.map((p) => toMs(p.shownAt)).filter(Number.isFinite))
  const lastAnswered = Math.max(0, ...facts.cs.feedback.map((f) => toMs(f.createdAt)).filter(Number.isFinite))
  const recent = Math.max(lastShown, lastAnswered)

  for (const moment of MOMENTS) {
    const instance = moment.due(facts, lifecycle, now)
    if (!instance) continue
    const key = momentKey(moment.id, instance)
    if (answered.has(key)) continue
    const state = promptState(facts, key)
    if (state?.status === 'dismissed' || state?.status === 'answered') continue
    if (state?.status === 'snoozed' && toMs(state.snoozedUntil) > now) continue
    // A prompt already on screen for this moment keeps showing until handled.
    const alreadyShown = state?.status === 'shown'
    if (!alreadyShown && !moment.bypassCooldown && recent && now - recent < PROMPT_COOLDOWN_DAYS * DAY) continue
    return {
      momentKey: key,
      momentId: moment.id,
      title: moment.title,
      intro: moment.intro,
      questions: moment.questions.map((id) => ({ id, ...QUESTIONS[id] })),
      canSnooze: !(state?.snoozeCount >= 1),
    }
  }
  return null
}

const CARD_OR_SECRET = /\b(?:\d[ -]?){13,19}\b|password\s*[:=]|passwd|secret\s*[:=]/i

// Validate answers against the moment's questions. Returns clean answers.
export function validateAnswers(momentId, raw) {
  const moment = MOMENT_BY_ID[momentId]
  if (!moment) return { ok: false, error: 'unknown feedback moment' }
  const input = raw && typeof raw === 'object' ? raw : {}
  const clean = {}
  for (const id of moment.questions) {
    const q = QUESTIONS[id]
    const v = input[id]
    if (v === undefined || v === null || v === '') {
      if (q.optional || q.type === 'text' || q.type === 'multi') continue
      return { ok: false, error: `please answer: ${q.label}` }
    }
    if (q.type === 'scale') {
      const n = Number(v)
      if (!Number.isInteger(n) || n < q.min || n > q.max) return { ok: false, error: `${q.label} must be ${q.min}-${q.max}` }
      clean[id] = n
    } else if (q.type === 'choice') {
      if (!q.options.some(([value]) => value === v)) return { ok: false, error: `invalid choice for: ${q.label}` }
      clean[id] = v
    } else if (q.type === 'multi') {
      if (!Array.isArray(v)) return { ok: false, error: `${q.label} must be a list` }
      const allowed = new Set(q.options.map(([value]) => value))
      clean[id] = [...new Set(v.filter((x) => allowed.has(x)))]
    } else if (q.type === 'text') {
      const text = String(v).trim().slice(0, q.max)
      if (CARD_OR_SECRET.test(text)) return { ok: false, error: 'please remove card numbers or passwords from your answer' }
      if (text) clean[id] = text
    } else if (q.type === 'review') {
      const quote = String(v.quote || '').trim().slice(0, 400)
      if (quote && CARD_OR_SECRET.test(quote)) return { ok: false, error: 'please remove card numbers or passwords from your answer' }
      clean[id] = {
        mayRequest: v.mayRequest === true,
        mayPublishQuote: v.mayPublishQuote === true && quote.length > 0,
        quote: quote || null,
        displayName: String(v.displayName || '').trim().slice(0, 60) || null,
      }
    }
  }
  if (!Object.keys(clean).length) return { ok: false, error: 'nothing to submit' }
  return { ok: true, answers: clean }
}

export const THEMES = Object.freeze([
  ['content_accuracy', 'Content accuracy', /\b(wrong|inaccurate|not accurate|slop|fake|made up|doesn'?t exist|outdated|incorrect)\b/i],
  ['clarity', 'Clarity', /\b(confus\w*|unclear|hard to|don'?t understand|lost|complicated)\b/i],
  ['pricing', 'Pricing', /\b(price|expensive|cost|cheaper|worth it|pay)\b/i],
  ['bugs', 'Bugs and reliability', /\b(bug|broken|error|crash\w*|doesn'?t work|not working|won'?t load|slow)\b/i],
  ['account', 'Account and sign-in', /\b(log ?in|sign ?in|password|account|email|verify)\b/i],
  ['coaching', 'Coaching', /\b(coach\w*|session|aaron)\b/i],
  ['vod', 'VOD review', /\b(vod|screenshot|upload|review)\b/i],
  ['squad', 'Duo and squad play', /\b(duo|squad|stack|team ?mates?|five ?stack)\b/i],
  ['maps', 'Maps, sites and setups', /\b(map|site|setup|callouts?|bank|kafe|oregon|clubhouse|chalet|border)\b/i],
])

export function themesFor(text) {
  const value = String(text || '')
  return THEMES.filter(([, , re]) => re.test(value)).map(([id]) => id)
}

function isComplaint(f) {
  return (Number.isFinite(f.answers?.helpful) && f.answers.helpful <= 2) || (Number.isFinite(f.answers?.nps) && f.answers.nps <= 6) || f.answers?.cancel_reason === 'content_quality' || f.answers?.cancel_reason === 'technical'
}

export function analyzeFeedback(responses) {
  const list = Array.isArray(responses) ? responses : []
  const nps = list.map((f) => f.answers?.nps).filter(Number.isFinite)
  const helpful = list.map((f) => f.answers?.helpful).filter(Number.isFinite)
  const promoters = nps.filter((n) => n >= 9).length
  const detractors = nps.filter((n) => n <= 6).length
  const themeMap = new Map(THEMES.map(([id, label]) => [id, { id, label, count: 0, quotes: [] }]))
  const requests = []
  for (const f of list) {
    const texts = [f.answers?.confusing, f.answers?.missing, f.answers?.comment, f.answers?.review?.quote].filter(Boolean)
    const seen = new Set()
    for (const text of texts) {
      for (const id of themesFor(text)) {
        const t = themeMap.get(id)
        if (!seen.has(id)) t.count += 1
        seen.add(id)
        if (t.quotes.length < 3) t.quotes.push({ text: String(text).slice(0, 200), feedbackId: f.feedbackId })
      }
    }
    if (f.answers?.missing) requests.push({ text: f.answers.missing, themes: themesFor(f.answers.missing), feedbackId: f.feedbackId, player: f.player || null, at: f.createdAt })
  }
  const reasons = {}
  for (const f of list) for (const key of ['cancel_reason', 'blocker']) if (f.answers?.[key]) reasons[f.answers[key]] = (reasons[f.answers[key]] || 0) + 1
  return {
    responses: list.length,
    helpful: { n: helpful.length, average: helpful.length ? Math.round((helpful.reduce((a, b) => a + b, 0) / helpful.length) * 10) / 10 : null },
    nps: {
      n: nps.length,
      promoters,
      passives: nps.length - promoters - detractors,
      detractors,
      // An NPS from a handful of answers is noise; say so instead.
      score: nps.length >= 5 ? Math.round(((promoters - detractors) / nps.length) * 100) : null,
    },
    themes: [...themeMap.values()].filter((t) => t.count > 0).sort((a, b) => b.count - a.count),
    reasons,
    complaints: list.filter((f) => isComplaint(f) && f.status !== 'resolved'),
    requests,
    reviewCandidates: list.filter((f) => f.answers?.review?.mayRequest || f.answers?.review?.mayPublishQuote),
  }
}
