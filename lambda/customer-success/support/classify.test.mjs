import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, TEAMS, classifyIssue, normalizeText, questionsFor } from './classify.mjs'

const EXPECTED_CATEGORIES = [
  'account_login', 'email_verification', 'subscription', 'access_entitlement', 'billing_question', 'cancellation',
  'coaching_credits', 'coaching_session', 'vod_upload', 'replay_upload', 'vod_analysis', 'ai_result',
  'ubisoft_connection', 'psn_connection', 'xbox_connection', 'trn_data', 'rank_stat_discrepancy', 'historical_data',
  'desktop_client', 'bug', 'performance', 'feature_request', 'safety_report', 'other',
]

test('category catalog is complete and well-formed', () => {
  assert.deepEqual(Object.keys(CATEGORIES).sort(), [...EXPECTED_CATEGORIES].sort())
  for (const [id, def] of Object.entries(CATEGORIES)) {
    assert.ok(def.label, `${id} label`)
    assert.ok(TEAMS.includes(def.team), `${id} team ${def.team}`)
    assert.match(def.priority, /^p[1-4]$/)
    assert.match(def.severity, /^sev[1-4]$/)
    assert.ok(Array.isArray(def.questions) && def.questions.length >= 1, `${id} questions`)
    for (const question of def.questions) assert.ok(question.id && question.prompt && question.why)
  }
})

// Fictional player phrasings -> [category, intent].
const CASES = [
  ['cant log in, it keeps saying incorrect username or password', 'account_login', 'broken'],
  ["I can't sign in on my phone since yesterday", 'account_login', 'broken'],
  ['forgot my password and the reset thing does nothing', 'account_login', 'broken'],
  ["I'm not able to log in anymore", 'account_login', 'broken'],
  ['account locked out after too many tries', 'account_login', 'broken'],
  ['never got the verification code email', 'email_verification', 'broken'],
  ["confirmation code expired and I didn't get a new one", 'email_verification', 'broken'],
  ['how do i upgrade from pro to elite?', 'subscription', 'how_to'],
  ['whats the difference between pro and elite', 'subscription', 'how_to'],
  ['I paid for elite but the site still says free', 'access_entitlement', 'broken'],
  ['bought pro yesterday, premium tactics still locked', 'access_entitlement', 'broken'],
  ['lost access to my maps after the renewal', 'access_entitlement', 'broken'],
  ['i got charged twice this month??', 'billing_question', 'broken'],
  ['double charged on my card for recon', 'billing_question', 'broken'],
  ['can i get a receipt for my last payment', 'billing_question', 'how_to'],
  ['how do I cancel my membership', 'cancellation', 'how_to'],
  ['please cancel my subscription', 'cancellation', 'how_to'],
  ['my coaching credits are gone, it says 0', 'coaching_credits', 'broken'],
  ['where are my session credits from the package', 'coaching_credits', 'how_to'],
  ['need to reschedule my coaching session on friday', 'coaching_session', 'how_to'],
  ['coach didnt show up to my 1:1', 'coaching_session', 'broken'],
  ['upload failed, says image too large', 'vod_upload', 'broken'],
  ['cant upload my screenshots, button does nothing', 'vod_upload', 'broken'],
  ['can I upload my .rec replay files?', 'replay_upload', 'how_to'],
  ['vod review stuck on processing forever', 'vod_analysis', 'broken'],
  ['analysis failed and it still used one of my reviews', 'vod_analysis', 'broken'],
  ['says usage limit reached but I only did 3 vods', 'vod_analysis', 'broken'],
  ['the ai review said the wrong map, it was bank not clubhouse', 'ai_result', 'broken'],
  ['the feedback was generic ai slop, not helping me', 'ai_result', 'value'],
  ['ubi connect wont link to my account', 'ubisoft_connection', 'broken'],
  ['how do I link my ubisoft account', 'ubisoft_connection', 'how_to'],
  ['my psn account is not linking', 'psn_connection', 'broken'],
  ['xbox gamertag shows the old one', 'xbox_connection', 'broken'],
  ['tracker network numbers are not updating', 'trn_data', 'broken'],
  ['rank wrong, it shows silver but im gold 2', 'rank_stat_discrepancy', 'broken'],
  ['my kd is wrong on the progress page', 'rank_stat_discrepancy', 'broken'],
  ['stats dont match what r6 shows in game', 'rank_stat_discrepancy', 'broken'],
  ['lost my progress history from last season', 'historical_data', 'broken'],
  ['how do i export my data', 'historical_data', 'how_to'],
  ['desktop app wont open after install, windows smartscreen blocks it', 'desktop_client', 'broken'],
  ['the overlay is silent during matches with my capture card', 'desktop_client', 'broken'],
  ['page is blank white screen after clicking strats', 'bug', 'broken'],
  ['site is super laggy and slow on my laptop', 'performance', 'broken'],
  ['you should add duo strats, would be cool', 'feature_request', 'how_to'],
  ['someone is harassing me in the discord and threatening me', 'safety_report', 'broken'],
  ['my account got hacked, someone logged into it', 'safety_report', 'broken'],
  ['been using recon for a month and im still hardstuck plat', 'other', 'value'],
  ['not getting better at all, is this worth it', 'other', 'value'],
]

test(`classifies ${CASES.length} fictional player phrasings`, () => {
  const misses = []
  for (const [text, category, intent] of CASES) {
    const r = classifyIssue(text)
    if (r.category !== category || r.intent !== intent) misses.push(`${JSON.stringify(text)} -> ${r.category}/${r.intent} (want ${category}/${intent})`)
    assert.ok(r.confidence >= 0 && r.confidence <= 1)
  }
  assert.deepEqual(misses, [])
  assert.ok(CASES.length >= 40)
})

test('deterministic: same text, same answer', () => {
  const a = classifyIssue('i got charged twice this month')
  const b = classifyIssue('i got charged twice this month')
  assert.deepEqual(a, b)
  assert.equal(a.subcategory, 'double_charge')
  assert.ok(a.matched.length > 0)
})

test('negation-aware: a negated topic does not win', () => {
  const r = classifyIssue('this is not about billing, my rank is wrong on the dashboard')
  assert.equal(r.category, 'rank_stat_discrepancy')
  const billing = classifyIssue('no problem with my subscription, but the vod review failed')
  assert.equal(billing.category, 'vod_analysis')
})

test('subcategories come from the matched phrases', () => {
  assert.equal(classifyIssue('vod review stuck on processing').subcategory, 'stuck_processing')
  assert.equal(classifyIssue('forgot my password').subcategory, 'password_reset')
  assert.equal(classifyIssue('I paid but it still says free').subcategory, 'paid_no_access')
  assert.equal(classifyIssue('I paid but it still says free', { signals: { billingStatus: 'payment_failed' } }).subcategory, 'payment_failed')
})

test('unknown text falls back to other with low confidence', () => {
  const r = classifyIssue('hello?')
  assert.equal(r.category, 'other')
  assert.ok(r.confidence <= 0.3)
  assert.equal(r.questions.length, 1)
})

test('normalizes gamer spelling and contractions', () => {
  assert.equal(normalizeText("I CAN’T log-in"), 'i cant log in')
  assert.equal(normalizeText("isn't able to"), 'unable to')
})

test('questions: platform question suppressed when one linked platform is known', () => {
  const text = 'rank wrong, it shows silver but im gold 2'
  const unknown = classifyIssue(text)
  assert.ok(unknown.questions.some((q) => q.id === 'platform'))
  const oneLinked = classifyIssue(text, { signals: { linkedPlatforms: ['psn'] } })
  assert.ok(!oneLinked.questions.some((q) => q.id === 'platform'))
  const twoLinked = classifyIssue(text, { signals: { linkedPlatforms: ['psn', 'xbox'] } })
  assert.ok(twoLinked.questions.some((q) => q.id === 'platform'))
  const profilePlatform = classifyIssue(text, { signals: { platform: 'pc' } })
  assert.ok(!profilePlatform.questions.some((q) => q.id === 'platform'))
})

test('questions: no "which plan" when entitlement is known; no email when signed in', () => {
  const unknown = classifyIssue('how do i upgrade my plan')
  assert.ok(unknown.questions.some((q) => q.id === 'which_plan'))
  const known = classifyIssue('how do i upgrade my plan', { signals: { entitlementKnown: true, plan: 'pro' } })
  assert.ok(!known.questions.some((q) => q.id === 'which_plan'))
  assert.ok(known.questions.some((q) => q.id === 'desired_change'))
  const login = questionsFor('account_login', { signedIn: true })
  assert.deepEqual(login.map((q) => q.id), ['login_error'])
  const paid = questionsFor('access_entitlement', { entitlementKnown: true, hasPaidRow: true })
  assert.ok(!paid.some((q) => q.id === 'purchase_email'))
  const ubi = questionsFor('ubisoft_connection', { ubisoftLinked: true })
  assert.equal(ubi.length, 0)
})

test('questions never carry internal predicates', () => {
  for (const question of classifyIssue('rank wrong').questions) assert.deepEqual(Object.keys(question).sort(), ['id', 'prompt', 'why'])
})
