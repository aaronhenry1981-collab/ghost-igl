// Deterministic support classification (ARCHITECTURE §2, §8).
//
// classifyIssue(text, { signals }) scores weighted phrases per category
// (gamer vocabulary included), ignores phrases that are negated just before
// they appear ("not about billing"), splits Player Success intent
// (broken | how_to | value) from the category, and returns ONLY the
// follow-up questions the diagnostics signals cannot already answer.
//
// Pure module: no model, no network. Same input -> same output.

export const TEAMS = Object.freeze(['support', 'billing', 'player_data', 'vod_ai', 'coaching', 'security'])
export const INTENTS = Object.freeze(['broken', 'how_to', 'value'])

const q = (id, prompt, why, skipWhen = null) => ({ id, prompt, why, skipWhen })

const signedIn = (s) => s.signedIn === true
const entitlementKnown = (s) => s.entitlementKnown === true
const onePlatformKnown = (s) => (Array.isArray(s.linkedPlatforms) && s.linkedPlatforms.length === 1) || Boolean(s.platform)

// label · team · default priority/severity · follow-up questions.
export const CATEGORIES = Object.freeze({
  account_login: {
    label: 'Signing in', team: 'support', priority: 'p2', severity: 'sev3',
    questions: [
      q('login_email', 'Which email do you sign in with?', 'We look up the account by email.', signedIn),
      q('login_error', 'What does the sign-in screen say when it fails?', 'The exact message tells us whether it is the password, the confirmation code or the account.'),
    ],
  },
  email_verification: {
    label: 'Email confirmation', team: 'support', priority: 'p2', severity: 'sev3',
    questions: [
      q('signup_email', 'Which email did you sign up with?', 'Codes are sent to that address only.', signedIn),
      q('spam_checked', 'Did you check spam and promotions for the code?', 'Most missing codes are filtered there.'),
    ],
  },
  subscription: {
    label: 'Membership plan', team: 'billing', priority: 'p3', severity: 'sev4',
    questions: [
      q('which_plan', 'Which plan are you on?', 'Plan decides what is unlocked.', entitlementKnown),
      q('desired_change', 'What do you want to change about your membership?', 'Upgrades, downgrades and cancellations run through different steps.'),
    ],
  },
  access_entitlement: {
    label: 'Paid but locked out', team: 'billing', priority: 'p1', severity: 'sev2',
    questions: [
      q('locked_feature', 'Which page or feature is locked?', 'Tells us which plan check is failing.'),
      q('purchase_email', 'Which email did you pay with?', 'A payment on a different email is the most common cause.', (s) => entitlementKnown(s) && s.hasPaidRow === true),
    ],
  },
  billing_question: {
    label: 'Billing question', team: 'billing', priority: 'p2', severity: 'sev3',
    questions: [
      q('charge_details', 'What date and amount show on the charge?', 'Lets us match the exact charge.'),
      q('which_plan', 'Which plan is the charge for?', 'Plan decides which subscription row to check.', entitlementKnown),
    ],
  },
  cancellation: {
    label: 'Cancelling', team: 'billing', priority: 'p2', severity: 'sev3',
    questions: [q('cancel_reason', 'What is the main reason you want to cancel? (optional)', 'Helps us fix what is not working.')],
  },
  coaching_credits: {
    label: 'Coaching credits', team: 'coaching', priority: 'p2', severity: 'sev3',
    questions: [
      q('purchase_when', 'Roughly when did you buy the coaching?', 'Credits are written when a payment clears.'),
      q('credits_expected', 'How many sessions were you expecting to have?', 'We compare it with the credits on record.', (s) => s.coachingCreditsKnown === true && s.coachingCredits !== null && s.coachingCredits !== undefined),
    ],
  },
  coaching_session: {
    label: 'Coaching session', team: 'coaching', priority: 'p2', severity: 'sev3',
    questions: [q('session_when', 'Which session is this about (date and time)?', 'Identifies the booking.')],
  },
  vod_upload: {
    label: 'VOD upload', team: 'vod_ai', priority: 'p2', severity: 'sev3',
    questions: [
      q('upload_files', 'How many screenshots, and in what format (PNG, JPG, WEBP)?', 'Uploads have a per-review image limit and a 5 MB per-image limit.'),
      q('upload_error', 'What message did the upload show?', 'The message tells us which check stopped it.'),
    ],
  },
  replay_upload: {
    label: 'Match replays', team: 'support', priority: 'p4', severity: 'sev4',
    questions: [q('replay_goal', 'What did you want to get out of the replay?', 'Replay upload is not available; screenshots may cover what you need.')],
  },
  vod_analysis: {
    label: 'VOD review not finishing', team: 'vod_ai', priority: 'p2', severity: 'sev3',
    questions: [
      q('review_when', 'Roughly when did you run the review?', 'Review attempts are not stored, so the time narrows it down.', (s) => Boolean(s.vodLastReviewAt) && s.vodUnmatchedUsage > 0),
      q('review_error', 'What did the review page say?', 'The message tells us whether it was the image, the limit or our side.'),
    ],
  },
  ai_result: {
    label: 'AI review quality', team: 'vod_ai', priority: 'p3', severity: 'sev4',
    questions: [
      q('result_off', 'Which part was off: the map, the site, the operator or the advice?', 'Points us at the input or the analysis.'),
      q('context_given', 'Did you pick the map and site before uploading?', 'Selected map and site make the review much sharper.'),
    ],
  },
  ubisoft_connection: {
    label: 'Ubisoft account', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [q('ubisoft_name', 'What is your Ubisoft username?', 'We match it to the account we read.', (s) => s.ubisoftLinked === true)],
  },
  psn_connection: {
    label: 'PlayStation account', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [q('psn_name', 'What is your PSN online ID?', 'We match it to the account we read.', (s) => Array.isArray(s.linkedPlatforms) && s.linkedPlatforms.includes('psn'))],
  },
  xbox_connection: {
    label: 'Xbox account', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [q('xbox_name', 'What is your Xbox gamertag?', 'We match it to the account we read.', (s) => Array.isArray(s.linkedPlatforms) && s.linkedPlatforms.includes('xbox'))],
  },
  trn_data: {
    label: 'Tracker stats', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [q('trn_name', 'Which name do you look up on the tracker?', 'We read stats by that name.', (s) => s.trnLinked === true)],
  },
  rank_stat_discrepancy: {
    label: 'Rank or stats look wrong', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [
      q('platform', 'Which platform do you play ranked on?', 'Ranks are per platform.', onePlatformKnown),
      q('expected_value', 'What rank or stat do you see in-game?', 'We compare it with what Recon has.'),
      q('where_seen', 'Where in Recon does it look wrong?', 'Different pages read different sources.'),
    ],
  },
  historical_data: {
    label: 'History and tracking', team: 'player_data', priority: 'p3', severity: 'sev4',
    questions: [q('history_range', 'Which dates or season is missing or wrong?', 'History is kept as dated snapshots.')],
  },
  desktop_client: {
    label: 'Desktop app', team: 'support', priority: 'p3', severity: 'sev3',
    questions: [
      q('desktop_version', 'Which app version did you install, and on which Windows version?', 'We cannot see the installed version from our side.'),
      q('capture_setup', 'Are you using PC capture or a console capture card?', 'The two setups fail in different ways.'),
    ],
  },
  bug: {
    label: 'Something is broken', team: 'support', priority: 'p3', severity: 'sev3',
    questions: [
      q('bug_steps', 'What did you click right before it happened?', 'Lets us reproduce it.'),
      q('bug_device', 'Which browser and device were you on?', 'Some bugs are browser-specific.'),
    ],
  },
  performance: {
    label: 'Slow or laggy', team: 'support', priority: 'p3', severity: 'sev4',
    questions: [q('perf_where', 'Which page is slow, and on which device and browser?', 'Narrows it to a page or a device.')],
  },
  feature_request: {
    label: 'Feature request', team: 'support', priority: 'p4', severity: 'sev4',
    questions: [q('request_goal', 'What would it help you do in your matches?', 'We prioritise by the problem it solves.')],
  },
  safety_report: {
    label: 'Safety report', team: 'security', priority: 'p1', severity: 'sev2',
    questions: [q('safety_where', 'Where did this happen (Discord, a coaching session, the site)?', 'Routes the report to the right person.')],
  },
  other: {
    label: 'Something else', team: 'support', priority: 'p3', severity: 'sev4',
    questions: [q('details', 'Tell us a bit more about what you need.', 'We could not tell the topic yet.')],
  },
})

// [pattern (on normalized text), weight, subcategory?]
const RULES = {
  account_login: [
    [/\bcant (log|sign) ?in\b|\bcannot (log|sign) ?in\b|\bunable to (log|sign) ?in\b/, 5, 'cannot_sign_in'],
    [/\b(log|sign) ?in (issue|problem|not working|broken|fails?|failing)\b/, 4, 'cannot_sign_in'],
    [/\blog(ged)? ?out\b|\bkeeps? logging me out\b/, 2, 'session'],
    [/\b(forgot|reset|change) (my )?password\b|\bpassword reset\b|\bwrong password\b|\bincorrect (username or )?password\b/, 5, 'password_reset'],
    [/\blocked out of (my )?account\b|\baccount (is )?locked\b/, 4, 'locked_out'],
    [/\b(user|account) (does not|doesnt) exist\b|\bno account found\b/, 4, 'account_not_found'],
    [/\bsign ?in\b|\blog ?in\b|\blogin\b/, 1],
  ],
  email_verification: [
    [/\b(verification|confirmation|confirm|verify) (code|email|link)\b/, 5, 'code_missing'],
    [/\b(never|didnt|did not|havent|not) (get|got|receive|received|getting) (the |a |my )?(code|email)\b/, 4, 'code_missing'],
    [/\b(verify|confirm) my (email|account)\b|\bemail (not )?verified\b|\bunconfirmed\b/, 4, 'unconfirmed'],
    [/\bcode (expired|invalid|doesnt work|not working)\b/, 4, 'code_invalid'],
  ],
  subscription: [
    [/\bupgrade\b|\bupgrading\b/, 4, 'upgrade'],
    [/\bdowngrade\b|\bdowngrading\b/, 4, 'downgrade'],
    [/\b(switch|change) (my )?(plan|tier|membership|subscription)\b/, 4, 'plan_change'],
    [/\bwhich plan\b|\bwhat plan\b|\bdifference between (pro|elite|champion)\b|\bpro (vs|or) (elite|champion)\b/, 3, 'plan_question'],
    [/\b(subscription|membership|my plan|my tier)\b/, 1.5],
    [/\b(pro|elite|champion) (plan|tier|membership)\b/, 1.5],
  ],
  access_entitlement: [
    [/\b(paid|subscribed|bought|purchased|upgraded)\b.{0,40}\b(still|but)\b.{0,40}\b(locked|free|basic|no access|cant access|not unlocked|dont have access|shows? (as )?(free|basic|recruit))\b/, 7, 'paid_no_access'],
    [/\bstill (locked|says (free|basic|recruit)|shows? (free|basic|recruit))\b/, 5, 'paid_no_access'],
    [/\b(lost|no) access\b|\bcant access\b|\b(dont|do not) have access\b/, 4, 'no_access'],
    [/\b(locked|paywall|pay ?wall|gated)\b/, 2, 'feature_locked'],
    [/\b(premium|elite|champion|pro) (content|tactics|features?|maps?) (locked|not showing|missing)\b/, 4, 'feature_locked'],
  ],
  billing_question: [
    [/\bcharged twice\b|\bdouble charged?\b|\bdouble charge\b|\btwo charges\b|\bcharged (me )?(two|2) times\b|\bduplicate charge\b/, 7, 'double_charge'],
    [/\brefund\b|\bmoney back\b|\bchargeback\b/, 5, 'refund'],
    [/\b(invoice|receipt)\b/, 4, 'invoice'],
    [/\b(card|payment) (declined|failed|didnt go through|did not go through)\b|\bpast due\b|\bupdate (my )?(card|payment)\b/, 5, 'payment_failed'],
    [/\bcharged?\b|\bcharge\b|\bbilled?\b|\bbilling\b|\bpayment\b|\bstripe\b/, 2],
    [/\bhow much\b|\bprice\b|\bpricing\b|\bcost\b/, 2, 'price'],
  ],
  cancellation: [
    [/\bcancel(l?ing|l?ed|lation)?\b|\bunsubscribe from (the )?(plan|membership|subscription)\b|\bstop (my )?(subscription|membership|billing)\b|\bend my (subscription|membership)\b/, 5],
  ],
  coaching_credits: [
    [/\b(coaching )?credits?\b.{0,30}\b(missing|gone|not showing|didnt show|0|zero|wrong|dont see)\b/, 6, 'credits_missing'],
    [/\b(session|coaching) credits?\b/, 5],
    [/\bcredits?\b/, 1.5],
  ],
  coaching_session: [
    [/\b(book|booking|booked|reschedule|rescheduling|resched)\b.{0,25}\b(session|coaching|call|lesson)\b/, 5, 'booking'],
    [/\b(coach|aaron) (didnt|did not|never) (show|join)\b|\bno ?show\b|\bmissed (my )?session\b/, 6, 'no_show'],
    [/\b(1 ?on ?1|one on one|1:1|coaching session|coaching call|live session)\b/, 4],
    [/\bcoach(ing)?\b/, 1],
  ],
  vod_upload: [
    [/\bupload\b.{0,30}\b(fail|failed|failing|error|stuck|wont|doesnt|not working|too (big|large))\b/, 6, 'upload_failed'],
    [/\b(file|image|screenshot)s? (too (big|large)|wont upload|not uploading)\b|\b5 ?mb\b|\bmax(imum)? \d+ images?\b/, 6, 'file_rejected'],
    [/\b(cant|cannot|unable to) upload\b/, 6, 'upload_failed'],
    [/\bupload(ing|ed)?\b/, 1.5],
    [/\b(mp4|video file|clip)\b/, 2, 'video_upload'],
  ],
  replay_upload: [
    [/\breplays?\b|\bmatch replay\b|\b\.?rec files?\b|\brec file\b/, 6],
  ],
  vod_analysis: [
    [/\bstuck (on|at) (processing|analy[sz]ing|loading)\b|\b(processing|analy[sz]ing) (forever|for ever|stuck|never (ends|finishes))\b/, 7, 'stuck_processing'],
    [/\b(review|analysis|vod) (failed|errored|error|didnt (work|finish|load)|never (finished|loaded|came back)|not working)\b/, 6, 'failed'],
    [/\b(allowance|limit) (reached|hit|used up)\b|\busage limit\b|\bout of (reviews|vods|sessions)\b|\bused (all|up) my (reviews|vods)\b/, 6, 'limit_reached'],
    [/\brate ?limited\b|\btry again in a few minutes\b/, 5, 'rate_limited'],
    [/\bvods?\b|\bvod review\b|\bai review\b/, 1.5],
  ],
  ai_result: [
    [/\b(wrong|incorrect) (map|site|operator|op)\b/, 6, 'wrong_context'],
    [/\b(generic|useless|vague|made up|nonsense|ai slop|slop|hallucinat\w*)\b/, 4, 'low_quality'],
    [/\b(advice|feedback|review|analysis|score) (is|was) (wrong|off|bad|useless|generic|inaccurate)\b/, 5, 'low_quality'],
    [/\bwrong game\b|\bnot (rainbow six|r6|siege) gameplay\b/, 5, 'wrong_game'],
  ],
  ubisoft_connection: [
    [/\bubi ?connect\b|\bubisoft (connect|account|link|login)\b|\bubi (account|link)\b|\blink (my )?ubi(soft)?\b/, 6],
    [/\bubisoft\b|\bubi\b|\buplay\b/, 2],
  ],
  psn_connection: [
    [/\bpsn\b|\bplaystation (network|account)\b|\bps ?[45] (account|link)\b|\blink (my )?(psn|playstation)\b/, 5],
  ],
  xbox_connection: [
    [/\bxbox (live|account|link)\b|\bxbl\b|\bgamertag\b|\blink (my )?xbox\b/, 5],
  ],
  trn_data: [
    [/\btrn\b|\btracker ?network\b|\br6 ?tracker\b|\btracker\b/, 5],
  ],
  rank_stat_discrepancy: [
    [/\brank\b.{0,20}\b(wrong|incorrect|off|outdated|not updat\w*|not right|not showing|stuck|behind|old)\b/, 7, 'rank_wrong'],
    [/\b(wrong|incorrect|outdated|old) rank\b/, 7, 'rank_wrong'],
    [/\b(k ?\/ ?d|kd|win ?rate|wr|stats?|mmr|rp|elo)\b.{0,20}\b(wrong|incorrect|off|outdated|not updat\w*|dont match|doesnt match|not right)\b/, 6, 'stats_wrong'],
    [/\b(shows?|says|showing)\b.{0,15}\b(copper|bronze|silver|gold|platinum|plat|emerald|diamond|champion|champ)\b.{0,25}\b(but|when|actually|im)\b/, 5, 'rank_wrong'],
    [/\b(rank|stats?|kd|mmr)\b.{0,20}\b(different|mismatch|dont match|doesnt match)\b/, 5, 'mismatch'],
  ],
  historical_data: [
    [/\b(history|historical|past seasons?|old matches|match history|progress (graph|chart|history))\b/, 4],
    [/\b(lost|missing|deleted|wiped) (my )?(history|progress|stats|data)\b/, 6, 'missing_history'],
    [/\b(export|download) (my )?data\b/, 5, 'data_export'],
  ],
  desktop_client: [
    [/\bdesktop (app|client)\b|\bigl command\b|\boverlay\b|\bcapture card\b|\binstaller\b|\b(the )?app (wont|doesnt|won't) (open|launch|start)\b/, 6],
    [/\b(windows|exe|smartscreen|antivirus)\b/, 2],
    [/\blive (coach|coaching)\b.{0,20}\b(app|overlay|voice|silent|not talking)\b/, 4],
  ],
  bug: [
    [/\bbug\b|\bglitch(ed|y)?\b|\bbroken\b|\bcrash(es|ed|ing)?\b|\berror\b|\bblank (page|screen)\b|\bwhite screen\b|\b404\b|\b500\b/, 3],
    [/\b(doesnt|does not|wont|isnt|not) (work|working|load|loading|open|opening)\b/, 2],
    [/\bbutton\b.{0,20}\b(does nothing|not working|broken)\b/, 3],
  ],
  performance: [
    [/\b(slow|laggy|lag|lagging|takes forever|loading forever|freez\w*|stutter\w*)\b/, 4],
  ],
  feature_request: [
    [/\b(feature request|suggestion|would be (cool|nice|great)|you should add|please add|can you add|could you add|wish (it|you|there))\b/, 6],
    [/\b(add|support) (for )?(duo|squad|valorant|console|controller)\b/, 3],
  ],
  safety_report: [
    [/\b(harass\w*|threat\w*|abus\w*|doxx?\w*|scam\w*|phish\w*|impersonat\w*|stalk\w*|hack(ed|er)?|compromised|stolen account|someone (else )?(logged|got) into)\b/, 7],
    [/\bunsafe\b|\breport (a |this )?(user|player|person|coach)\b/, 5],
  ],
  other: [],
}

// Cue phrases for intent (Player Success).
const INTENT_RULES = {
  how_to: [
    [/\bhow (do|can|should) i\b|\bhow to\b|\bwhere (do|can) i\b|\bwhere (is|are)\b|\b(need|want|would like|id like) to (reschedule|change|move|book|switch|know)\b|\bwhat does\b|\bwhat is\b|\bwhats the difference\b|\bis there a way\b|\bcan i\b/, 3],
    [/\b(dont|do not) understand\b|\bconfus(ed|ing)\b|\bexplain\b|\bnew here\b|\bfirst time\b|\bwhere do i start\b|\bhow does\b/, 3],
  ],
  value: [
    [/\bnot (getting|seeing) (better|results|any results)\b|\bnot improving\b|\bno (improvement|results)\b|\bstill (hard ?stuck|stuck in|the same rank)\b|\bhard ?stuck\b/, 5],
    [/\bnot worth\b|\bwaste of (money|time)\b|\bnot helping\b|\bdidnt help\b|\bdoesnt help\b|\bsame rank\b|\bstill losing\b|\bwhat am i paying for\b|\bnot using (it|recon)\b/, 5],
    [/\b(ai )?slop\b|\bgeneric advice\b/, 2],
  ],
  broken: [
    [/\berror\b|\bbroken\b|\bbug\b|\bcrash\w*\b|\bfail(ed|s|ing)?\b|\bstuck (on|at)\b|\bwont\b|\bcant\b|\bcannot\b|\bmissing\b|\bwrong\b|\bcharged twice\b|\bdouble charged?\b|\bduplicate charge\b|\bdeclined\b|\blocked\b|\bnot working\b|\bdoesnt work\b/, 2],
  ],
}

const DEFAULT_INTENT = { feature_request: 'how_to', billing_question: 'how_to', subscription: 'how_to', cancellation: 'how_to', replay_upload: 'how_to' }

// Negation: a phrase is ignored when the words right before it disclaim the
// topic ("not about billing", "no problem with my subscription", "not a
// billing issue"). "cant", "dont", "didnt", "never got" are NOT disclaimers:
// that is how players describe the problem ("cant log in", "never got the code").
const NEGATION_CONTEXT = /\b(?:not|nothing|isnt|wasnt|no)\b(?: (?:really|even|just|actually))?(?: (?:about|regarding|related to|to do with|an? (?:issue|problem|question) with|issues? with|problems? with|a|an|my|the))+ ?$/
const NEGATORS = new Set(['not', 'no', 'never', 'without', 'isnt', 'wasnt', 'arent', 'nothing'])

export function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/\b(can|don|didn|doesn|won|isn|wasn|aren|haven|hasn|couldn|wouldn|shouldn|ain)'t\b/g, '$1t')
    .replace(/\bcan ?not\b/g, 'cannot')
    .replace(/\b(not|isnt|wasnt) able to\b/g, 'unable to')
    .replace(/\bi'm\b/g, 'im')
    .replace(/\bit's\b/g, 'its')
    .replace(/\bwhat's\b/g, 'whats')
    .replace(/'/g, '')
    .replace(/[^a-z0-9:/.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)
}

function negatedAt(text, index) {
  return NEGATION_CONTEXT.test(text.slice(Math.max(0, index - 60), index))
}

function matchAll(re, text) {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
  const global = new RegExp(re.source, flags)
  const out = []
  let m
  let guard = 0
  while ((m = global.exec(text)) && guard < 20) {
    out.push({ index: m.index, text: m[0] })
    if (m[0].length === 0) global.lastIndex += 1
    guard += 1
  }
  return out
}

function scoreRules(rules, text) {
  let score = 0
  const matched = []
  const subs = {}
  for (const [re, weight, sub] of rules) {
    for (const hit of matchAll(re, text)) {
      const phraseHasNegator = hit.text.split(' ').some((w) => NEGATORS.has(w))
      if (!phraseHasNegator && negatedAt(text, hit.index)) continue
      score += weight
      matched.push(hit.text.trim())
      if (sub) subs[sub] = (subs[sub] || 0) + weight
      break // one hit per rule
    }
  }
  const subcategory = Object.entries(subs).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return { score, matched, subcategory }
}

export function questionsFor(category, signals = {}) {
  const def = CATEGORIES[category] || CATEGORIES.other
  return def.questions
    .filter((question) => !(typeof question.skipWhen === 'function' && question.skipWhen(signals || {})))
    .map(({ id, prompt, why }) => ({ id, prompt, why }))
}

export function classifyIssue(text, { signals = {} } = {}) {
  const norm = normalizeText(text)
  const scored = Object.entries(RULES).map(([category, rules]) => ({ category, ...scoreRules(rules, norm) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Object.keys(RULES).indexOf(a.category) - Object.keys(RULES).indexOf(b.category))

  // A specific category beats the generic "bug" bucket on a tie or near tie.
  let top = scored[0] || null
  if (top && top.category === 'bug') {
    const specific = scored.find((entry) => entry.category !== 'bug' && entry.score >= top.score - 1)
    if (specific) top = specific
  }
  const second = scored.find((entry) => entry !== top) || null

  // Intent.
  const intentScores = Object.fromEntries(Object.entries(INTENT_RULES).map(([intent, rules]) => [intent, scoreRules(rules, norm).score]))
  let intent
  if (intentScores.value >= 5 || (intentScores.value > 0 && intentScores.value >= intentScores.broken + 2)) intent = 'value'
  else if (intentScores.how_to >= 3 && intentScores.how_to >= intentScores.broken) intent = 'how_to'
  else if (intentScores.broken > 0) intent = 'broken'
  else intent = DEFAULT_INTENT[top?.category] || (top ? 'broken' : 'how_to')

  let category = top?.category || 'other'
  let subcategory = top?.subcategory || null
  // A pure "not getting results" message with no product anchor is a value
  // conversation, not a bug.
  if (intent === 'value' && (!top || top.score < 4 || top.category === 'bug')) {
    category = top && top.category === 'ai_result' ? 'ai_result' : 'other'
    subcategory = category === 'other' ? 'progress' : subcategory
  }
  // Billing context from signals sharpens an access message.
  if (category === 'access_entitlement' && signals?.billingStatus === 'payment_failed') subcategory = 'payment_failed'

  const topScore = category === top?.category ? top.score : 0
  const secondScore = second && second.category !== category ? second.score : 0
  const confidence = topScore > 0
    ? Math.max(0.3, Math.min(0.97, Math.round((topScore / (topScore + secondScore + 2)) * 100) / 100))
    : 0.2

  return {
    category,
    subcategory,
    intent,
    confidence,
    matched: [...new Set(scored.filter((s) => s.category === category).flatMap((s) => s.matched))],
    questions: questionsFor(category, signals),
  }
}

export function categoryInfo(category) {
  const def = CATEGORIES[category] || CATEGORIES.other
  return { id: CATEGORIES[category] ? category : 'other', label: def.label, team: def.team, priority: def.priority, severity: def.severity }
}
