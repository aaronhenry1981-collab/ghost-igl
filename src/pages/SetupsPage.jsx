import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ChampionGate from '../components/strats/ChampionGate'
import SITE_INDEX, { SITE_TALLY } from '../data/site-index'
import { OP_ROSTER } from '../data/op-roster'
import SquadRoster from '../components/SquadRoster'
import { loadRoster, rosterPool } from '../utils/squadRosterStorage'
import useProtectedCatalog from '../hooks/useProtectedCatalog'
import './SetupsPage.css'

let VERIFIED_SETUPS = {}
let VERIFIED_CALLOUTS = {}
let PICK_ORDER = { attack: [], defense: [] }
let CAPABILITIES = { attack: [], defense: [] }
let FLOOR_PRIORITY = {}
let VARIATIONS = { attack: [], defense: [] }
const AVOID = []

function configureSetupCatalog(catalog) {
  VERIFIED_SETUPS = catalog?.verified_setups || {}
  VERIFIED_CALLOUTS = catalog?.verified_callouts || {}
  PICK_ORDER = catalog?.setup_pick_order || { attack: [], defense: [] }
  CAPABILITIES = Object.fromEntries(Object.entries(catalog?.setup_capabilities || {}).map(([side, capabilities]) => [
    side,
    (capabilities || []).map((capability) => {
      try { return { ...capability, needs: new RegExp(capability.needs, 'i') } }
      catch { return { ...capability, needs: /$a/ } }
    }),
  ]))
  FLOOR_PRIORITY = catalog?.setup_floor_priority || {}
  VARIATIONS = catalog?.setup_variations || { attack: [], defense: [] }
}

function setupFor(mapId, siteId) {
  return VERIFIED_SETUPS[`${mapId}:${siteId}`] || null
}

function variationFor(side, run) {
  const list = VARIATIONS[side] || []
  if (!list.length) return null
  return list[(Math.max(1, run) - 1) % list.length]
}

function teamCapabilities(side, taken = new Set(), mine = null) {
  const held = new Set([...taken].map((value) => String(value || '').toLowerCase().trim()))
  if (mine) held.add(String(mine).toLowerCase().trim())
  return (CAPABILITIES[side] || []).map((capability) => {
    const by = capability.ops.filter((operator) => held.has(operator.toLowerCase()))
    return { ...capability, by, covered: by.length > 0 }
  })
}

function stepNeeds(side, text) {
  return (CAPABILITIES[side] || []).filter((capability) => capability.needs?.test(String(text || '')))
}

function floorPicks(floor, pool = [], gone = new Set()) {
  const priority = FLOOR_PRIORITY[floor]
  if (!priority) return null
  const owned = new Set(pool.map((operator) => String(operator).toLowerCase()))
  const lift = (priority.lift || []).filter((operator) => owned.has(operator.toLowerCase()) && !gone.has(operator.toLowerCase()))
  return lift.length ? { ...priority, lift } : null
}

function seatJob(operator, side) {
  if (!operator) return null
  const key = String(operator).toLowerCase()
  const capability = (CAPABILITIES[side] || []).find((entry) => entry.ops.some((candidate) => candidate.toLowerCase() === key))
  return capability ? { role: capability.label, job: capability.job } : null
}

// SETUP LIBRARY — every map, every bomb site, with an honest status on each.
//
// The point of listing sites we have NOTHING for is that they are the work
// queue: play a site, its geography gets read off the recording, and it moves
// up a tier. A library showing only the two finished maps would be useless as a
// reference and would hide the roadmap.
//
// The three states must never be rendered the same way. Everything this page is
// worth rests on a reader being able to tell, at a glance, what is proven and
// what is not.

const STATUS = {
  verified: { label: 'Verified', cls: 'ok', blurb: 'Setup written from recorded matches.' },
  geography: { label: 'Names confirmed', cls: 'part', blurb: 'Room and spawn names read off the objective screen. No setup written yet.' },
  unverified: { label: 'Not verified', cls: 'none', blurb: 'Nothing from footage yet. Play it and it enters the queue.' },
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.unverified
  return <span className={`sx-badge sx-${s.cls}`}>{s.label}</span>
}

// How many times you have already run this site this session, and what to
// change because of it. Repeating a setup is the fastest way to lose a site:
// they watched you reinforce that wall and hold that corner, and on the
// rematch they are already looking at it.
//
// Per site AND per side, because attacking Kitchen twice is a repeat and
// attacking it once then defending it is not.
const RUN_KEY = 'recon6-site-runs-v1'
function loadRuns() {
  try { return JSON.parse(localStorage.getItem(RUN_KEY) || '{}') } catch { return {} }
}

function RunTracker({ runKey, runs, setRuns, side }) {
  const n = runs[runKey] || 1
  const v = variationFor(side, n)
  const bump = (d) => setRuns((prev) => {
    const next = { ...prev, [runKey]: Math.max(1, (prev[runKey] || 1) + d) }
    try { localStorage.setItem(RUN_KEY, JSON.stringify(next)) } catch { /* quota */ }
    return next
  })
  if (!v) return null

  return (
    <div className={`sx-run${n > 1 ? ' changed' : ''}`}>
      <div className="sx-run-head">
        <div className="sx-run-count">
          <button onClick={() => bump(-1)} disabled={n <= 1} aria-label="previous run">−</button>
          <span>Run <b>{n}</b> on this site</span>
          <button onClick={() => bump(1)} aria-label="next run">+</button>
        </div>
        <span className="sx-run-name">{v.name} · {v.tempo.toLowerCase()} tempo</span>
      </div>
      <p className="sx-run-lead">{v.lead}</p>
      <ul className="sx-run-changes">{v.changes.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="sx-run-why"><span>Why</span>{v.why}</p>
      {n > 1 && (
        <p className="sx-run-foot">
          The written plan below is still the base — these are the changes on top of it. Anything
          not listed here stays the same.
        </p>
      )}
    </div>
  )
}

// A plan is written assuming a full toolkit. Bans and teammates' picks take
// pieces of that toolkit away, and leaving the text unchanged tells the player
// to do something nobody in the match can do — which is how "Ace opens the
// wall" stayed on screen while Ace was banned and the duo had been swapped to
// Osa. Mark it on the step itself, where he is actually reading.
// Every written plan is a two-man plan. Set the queue to Solo and the page still
// said "your duo opens the floor where you mark it", which is not a strat, it is
// a person who is not in the lobby.
//
// The coach already solved this with deduo(); the site never got it. Ported so
// both surfaces read the same way, plus the part the coach did not need: a step
// whose ENTIRE content was the partner's job has to disappear, not render as an
// empty bullet.
function soloise(t, duoName) {
  // Match the literal "your duo" AND whatever gamertag he has saved for the
  // seat. The pages used to name the partner, which meant matching only the
  // configured name found nothing and left every partner instruction on a solo
  // card. Caught in the browser, not by the unit test, which had hardcoded the
  // name and so tested the wrong thing.
  const names = ['your duo', (duoName || '').trim()]
    .filter((n) => n && n.length > 1)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const esc = [...new Set(names)].join('|')
  const out = String(t || '')
    .replace(/\bboth of you\b/gi, 'you')
    // Duo phrasing that survives because it never names the partner. "Stay
    // together" reads as nonsense on a solo card, but the intent still holds
    // against randoms, so it is rewritten rather than cut.
    .replace(/\b(stay|travel|move|go|push|enter|rotate)\s+together\b/gi, '$1 with the team')
    .replace(/\bno split\b/gi, 'do not split off alone')
    .replace(new RegExp(`\\byou and (?:${esc})\\b`, 'gi'), 'you')
    // Drop the partner's clause wherever it sits in the sentence.
    .replace(new RegExp(`[,;]?\\s*(?:and\\s+)?\\b(?:${esc})\\b[^.;]*(?=[.;]|$)`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .trim()
  const fixed = agree(out)
    // Cutting the partner's clause can strand the conjunction that introduced
    // it: "clears it before Jackson comes up" -> "clears it before."
    .replace(/[,\s]+(?:before|after|while|until|unless|as|and|then|so|once|whenever|where)\s*(?=[.;]|$)/gi, '')
    .replace(/\s+([.,;])/g, '$1')
    // Capitalise the start of the string and after a full stop only. An em-dash
    // does not begin a sentence — including it produced "— Even just droning".
    .replace(/(^|[.]\s+)([a-z])/g, (m, pre, c) => pre + c.toUpperCase())
  // Nothing but punctuation left means the whole instruction belonged to a
  // player who is not in this lobby.
  return /[a-z]{3}/i.test(fixed) ? fixed : ''
}

// Third person -> second person verb agreement.
//
// Shared, because it is needed twice for the same underlying reason: the setups
// were written about a named player, and both the solo rewrite and the
// depersonalised rewrite turn that name into "you". Written out separately the
// first time, and the copy without these lines rendered "you goes up first" to
// the customer it was built for.
// "you" as the object of a preposition is not the one doing the verb. "A roamer
// behind Aaron ends this round" became "a roamer behind you end this round" —
// the rewrite reached across the sentence and conjugated somebody else's verb.
// Only words that take "you" as an OBJECT belong here. "after", "before",
// "while" and "than" introduce a clause in which "you" is the subject — listing
// them left "your duo places SELMA only after you confirms it" on the page.
const NOT_SUBJECT = new Set([
  'behind', 'of', 'with', 'for', 'to', 'from', 'at', 'on', 'near', 'past', 'beside',
  'under', 'over', 'against', 'between', 'around', 'beyond', 'into', 'onto', 'above',
  'below', 'toward', 'towards', 'alongside', 'both', 'neither', 'either',
])
// Chopping the trailing s is wrong on words where the s is part of the word, and
// on verbs that inflect irregularly.
const KEEP_S = new Set(['cross', 'pass', 'miss', 'press', 'access', 'focus', 'this', 'his', 'its'])
const IRREGULAR = { has: 'have', does: 'do', goes: 'go', is: 'are', was: 'were' }

// One verb, third person -> second. Returns null when the word should be left
// exactly as it is.
//
// Shared by both passes below because the first version had two copies and only
// one of them knew about -es endings, so "you watch" came out right and "and
// watche" did not.
function deinflect(verb) {
  const w = verb.toLowerCase()
  if (IRREGULAR[w]) return IRREGULAR[w]
  if (KEEP_S.has(w) || !w.endsWith('s') || w.endsWith('ss')) return null
  // "crosses" -> "cross", "watches" -> "watch". The sibilant class has to
  // include ss, or one letter comes off and it lands as "crosse".
  return /(ch|sh|ss|x|z|o)es$/.test(w) ? verb.slice(0, -2) : verb.slice(0, -1)
}

function agree(t) {
  return String(t || '')
    // Contractions first — the apostrophe hides the verb from the main pass, so
    // "if Aaron isn't back inside" was landing as "if you isn't back inside".
    .replace(/\byou isn't\b/gi, "you aren't")
    .replace(/\byou wasn't\b/gi, "you weren't")
    .replace(/\byou doesn't\b/gi, "you don't")
    .replace(/\byou hasn't\b/gi, "you haven't")
    // Third person singular -> second person, but only where "you" is the
    // subject. The hyphen class keeps "re-enters" in one piece; the i flag
    // catches "EMPs the jammer".
    .replace(/(\S+\s+)?\byou\s+([a-z][a-z-]*)\b/gi, (m, pre, verb) => {
      const prev = String(pre || '').trim().toLowerCase().replace(/[^a-z]/g, '')
      if (NOT_SUBJECT.has(prev)) return m
      const base = deinflect(verb)
      return base ? `${pre || ''}you ${base}` : m
    })
    // Second verb in a compound: "You give up B Cafeteria and falls back into
    // B Garage." The first verb gets fixed above; the one after "and" keeps its
    // third-person ending because nothing near it says who is acting.
    //
    // The earlier version of this rule ran on every sentence and so rewrote
    // "Ace puts a charge on the hatch and blows it open" into "and blow it
    // open" — silently reassigning Ace's job to the reader. Scoped now to
    // sentences that OPEN with "you", where the subject is not in doubt.
    .split(/(?<=[.;])\s+/)
    .map((sentence) => (/^\W*you\b/i.test(sentence)
      // The object list keeps the rule off plural nouns ("and cameras second").
      // A quote counts as an object: "and says 'EMP out'" is a verb, and leaving
      // quotes out of the list is why that line shipped as "You EMP the jammer
      // and says 'EMP out'".
      ? sentence.replace(/\band ([a-z]{3,}(?:es|s))\b(?=\s+(?:it|them|the|this|that|his|her|their|up|down|out|in|through|from|back|off|["'‘“]))/g,
        (m, v) => {
          const base = deinflect(v)
          return base ? `and ${base}` : m
        })
      : sentence))
    .join(' ')
}

const soloList = (arr, duoName) => (arr || []).map((t) => soloise(t, duoName)).filter(Boolean)

// A paying customer must never be shown the coach's own record or his duo's
// gamertag. Everything on this page was authored for one account: the setups name
// Aaron and Jackson in the prose, the ladder is Aaron's Y11S2 win rates, and
// KNOWN_MATES holds a real person's handle. A Champion who signed up today was
// getting all three.
//
// Two separate wrongs. It is useless — "your best attacker, 54% over 211 rounds"
// is not their number. And it leaks: Jackson's gamertag is his, not ours to ship
// to strangers, and Aaron's rank and rates are his own business.
//
// Until per-user pools exist, the fix is that non-owners get the TACTICS with the
// identities and the personal statistics stripped out. The plan still works —
// "you open the wall, your duo holds the hole" coaches exactly as well as the
// named version.
function depersonalise(t) {
  // No name substitutions here any more. verified-setups.js is written in second
  // person at source, so there is nothing to strip — and a real first name has
  // no business shipping in a public bundle just to be laundered back out at
  // render time. scripts/audit-personal-data.mjs fails the build if one returns.
  //
  // What this pass does now is conjugate. The data literally reads "you goes up
  // first", because a data file cannot know who the subject of a sentence is and
  // agree() can.
  return agree(String(t || ''))
    .replace(/\s{2,}/g, ' ')
    .replace(/(^|[.]\s+)([a-z])/g, (m, pre, c) => pre + c.toUpperCase())
    .trim()
}
const dpList = (arr) => (arr || []).map(depersonalise).filter(Boolean)

// Owner = the one account these pages were authored from. Deliberately an
// allow-list and not "is this a customer", so a bug in tier detection fails
// CLOSED: an unrecognised account gets the depersonalised page, which is merely
// less tailored. Getting it the other way round ships a stranger Aaron's rank
// and his duo's gamertag, and that is not recoverable by a later fix.
const OWNERS = ['aaronhenry1981@gmail.com']
function useIsOwner() {
  const { user } = useAuth()
  const email = String(user?.email || user?.attributes?.email || '').trim().toLowerCase()
  return !!email && OWNERS.includes(email)
}

// The half of a pick rationale that is about the OPERATOR, not about Aaron's
// season.
//
// The first attempt deleted the numbers and kept the sentences. That does not
// work, and the output proved it: "Was wrongly on the avoid list at. Actually —
// the best soft breach", and worse, "The single best operator on the account"
// survived intact because it never mentions a number. Deleting digits does not
// make a claim about one player's record into general advice; it just hides that
// it was one.
//
// Every rationale is really two things bolted together — a record note ("was
// wrongly on your avoid list at 44%") and a tactical note ("Phone the cams back,
// hunt the roamer"). The tactical half is already true for anybody. So: keep
// that, drop the rest, and where nothing tactical was written, show the operator
// with no reason rather than an invented one.
const RECORD_CLAUSE = /%|\bK\/D\b|\brounds?\b|\bwin rate\b|\bavoid list\b|\baccount\b|\bsample\b|\bwas (?:listed|ranked|on|wrongly)\b|\brecord\b|\blosing\b|\bmost-played\b|\bvolume\b|\bbreak-even\b|\bbaseline\b|\bfabricated\b|\bwrongly\b|\bhighest raw\b|\bsecond-most\b/i

// A bare verdict is the record with the evidence removed, which is worse than
// the record: "one of the worst" and "clearly the best attacker" read as facts
// about the game when they are rankings of one player's season. Only the clauses
// that tell you what to DO survive.
const BARE_VERDICT = /^(?:clearly|quietly|actually|also|still)?\s*(?:it is|one of)?\s*(?:the\s+)?(?:single\s+)?(?:best|worst|strongest|weakest|top)\b/i

const dpWhy = (t) => String(t || '')
  // Before the split, not after: BARE_VERDICT has to see "the best attacker" to
  // recognise it, and while the clause still said "your best attacker" the rule
  // silently matched nothing and every verdict came through.
  .replace(/\byour\b/gi, 'the')
  .split(/(?<=[.])\s+|\s+—\s+/)
  .map((c) => c.trim().replace(/[.\s]+$/, ''))
  .filter((c) => c && !RECORD_CLAUSE.test(c) && !BARE_VERDICT.test(c))
  .join('. ')
  .replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1')
  .replace(/^[\s,;:—-]+/, '').replace(/[\s,;:—-]+$/, '')
  .trim()
  // Capitalise every sentence, not just the first — clauses that were mid-
  // sentence before the record half was cut now start one.
  .replace(/(^|[.]\s+)([a-z])/g, (m, pre, c) => pre + c.toUpperCase())


function Steps({ title, items, side, capState }) {
  if (!items || !items.length) return null
  const { dead = new Set(), uncovered = new Set() } = capState || {}
  const verdict = (t) => {
    if (!dead.size && !uncovered.size) return null
    const needs = stepNeeds(side, t)
    const gone = needs.find((c) => dead.has(c.key))
    if (gone) return { cap: gone, kind: 'dead' }
    const open = needs.find((c) => uncovered.has(c.key))
    return open ? { cap: open, kind: 'uncovered' } : null
  }
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)
  return (
    <div className="sx-block">
      <h4>{title}</h4>
      <ol>
        {items.map((t, i) => {
          const v = verdict(t)
          return (
            <li key={i} className={v ? `sx-step-${v.kind}` : undefined}>
              {t}
              {v && (
                <span className={`sx-step-gap sx-gap-${v.kind}`}>
                  {v.kind === 'dead'
                    ? <>Every {v.cap.label.toLowerCase()} operator is banned — {lower(v.cap.then)}</>
                    : <>Nobody on your cards has {v.cap.label.toLowerCase()}. If a random brings it this still works — otherwise {lower(v.cap.then)}</>}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return <p className="sx-field"><span>{label}</span>{value}</p>
}

// Seats must be resolved TOGETHER, in order, sharing one running set of what is
// already spoken for. Resolving each independently handed the same substitute to
// two players: banning Kaid gave Aaron Vigil AND left Vigil on a teammate.
function resolveSeats(wanted, side, gone) {
  const used = new Set()
  return wanted.map(({ who, op, note }) => {
    const isGone = op && gone.has(op.toLowerCase())
    const clash = op && used.has(op.toLowerCase())
    let use = op
    if (isGone || clash) {
      const alt = (PICK_ORDER[side] || [])
        .find((p) => !gone.has(p.op.toLowerCase()) && !used.has(p.op.toLowerCase()))
      use = alt ? alt.op : null
    }
    if (use) used.add(use.toLowerCase())
    // Distinguish the two reasons: banned is a fact about the match, taken is a
    // consequence of the seat above. Calling both "gone" told him Kapkan was
    // banned when a teammate had simply claimed it.
    return { who, op: use, swappedFrom: (isGone || clash) ? op : null,
             swapReason: isGone ? 'banned' : clash ? 'taken' : null, note }
  })
}

function Seat({ who, op, swappedFrom, swapReason, note, side }) {
  // A 4-stack used to hand seats 3 and 4 an operator and nothing else. Two of
  // four players got a name and were left to guess what to do with it.
  const role = seatJob(op, side)
  return (
    <div className={`sx-pick${swappedFrom ? ' sx-pick-swapped' : ''}`}>
      <span className="sx-pick-who">{who === 'You' ? 'You play' : `${who} plays`}</span>
      <strong>{op || '—'}</strong>
      {swappedFrom
        ? <span className="sx-pick-note sx-swap">{swappedFrom} {swapReason === 'taken' ? 'taken' : 'banned'} · next best</span>
        : note ? <span className="sx-pick-note">{note}</span> : null}
      {role && (
        <span className="sx-pick-role">
          <b>{role.role}</b>
          {role.job}
        </span>
      )}
    </div>
  )
}

// Side is owned by the PAGE, not this component. Two independent toggles meant
// the ban chips could be listing attackers while the setup below showed the
// defense plan.
// A plan can name an operator in its steps ("before Ace commits a charge").
// If that operator is banned and nobody on the squad replaced the role, the
// written plan is no longer runnable — and silently leaving the text up tells
// the player to use a gadget they do not have.
function brokenPremise(d, seats, gone, side) {
  const text = [
    ...(d.approach || []), ...(d.job || []), ...(d.duoJob || []),
    ...(d.reinforce || []), d.plant || '', d.anchor || '',
  ].join(' ')
  const assigned = new Set(seats.map((s) => (s.op || '').toLowerCase()))
  // Whole-word match so "Ace" does not fire on "placed". No regex building —
  // escaping it through a generator is what broke this the first time.
  const words = new Set(text.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean))
  // ONLY operators on your own side. An attack plan names enemy defenders too
  // ("EMP to kill a Jager ADS"), and banning one of those makes the plan easier,
  // not broken — flagging it told the player his plan was dead when the ban had
  // gone in his favour.
  const named = (OP_ROSTER[side] || [])
    .filter((op) => op.toLowerCase().split(' ').every((w) => words.has(w)))
  return named.filter((op) => gone.has(op.toLowerCase()) && !assigned.has(op.toLowerCase()))
}

// What this plan takes on faith, and how much of it would fall over.
//
// Every setup already carries an `unverifiedSpots` list, and nothing rendered
// it. So Oregon Kids' Dorms shipped wearing a Verified badge with eleven steps
// hanging off a ceiling hatch that does not exist — its own data said the hatch
// was unconfirmed and the page never showed anyone. "Verified" means the room
// NAMES came off the screen. It has never meant the geometry was checked.
//
// Ranked by how many steps actually depend on each one, so the thirty seconds
// in a custom game go to the assumption that would cost the most rounds.
function assumptionRisk(full, side) {
  const spots = full?.unverifiedSpots || []
  if (!spots.length) return []
  const s = full[side] || {}
  const steps = [
    ...(s.reinforce || []), ...(s.job || []), ...(s.duoJob || []), ...(s.approach || []),
    s.anchor, s.fallback, s.roam, s.randoms, s.spawn, s.plant, s.ifStalled,
  ].filter(Boolean)

  return spots.map((spot) => {
    // The head noun is everything before the em-dash explanation.
    const head = spot.split(/\s+[—-]\s+/)[0].replace(/^The\s+/i, '').replace(/\(.*?\)/g, '')
      .split(/,| inside | between | leading | reachable /)[0].trim()
    const depends = head.length > 8
      ? steps.filter((t) => t.toLowerCase().includes(head.toLowerCase())).length
      : 0
    return { spot, head, depends }
  }).filter((x) => x.depends > 0).sort((a, b) => b.depends - a.depends)
}

function Assumptions({ full, side }) {
  const risk = assumptionRisk(full, side)
  const uncertain = full?.uncertain || []
  if (!risk.length && !uncertain.length) return null
  const worst = risk[0]
  const heavy = worst && worst.depends >= 4

  return (
    <div className={`sx-assume${heavy ? ' heavy' : ''}`}>
      <h4>
        {heavy
          ? `Check this before you trust the plan — ${worst.depends} steps rest on it`
          : 'What this plan assumes'}
      </h4>
      {risk.length > 0 && (
        <ul className="sx-assume-list">
          {risk.map((r) => (
            <li key={r.spot}>
              <span className="sx-assume-n">{r.depends}</span>
              <span>{r.spot}</span>
            </li>
          ))}
        </ul>
      )}
      {uncertain.length > 0 && (
        <details className="sx-assume-more">
          <summary>{uncertain.length} open question{uncertain.length === 1 ? '' : 's'} to settle in a custom game</summary>
          <ul>{uncertain.map((u) => <li key={u}>{u}</li>)}</ul>
        </details>
      )}
      <p className="sx-assume-foot">
        Verified means the room names were read off your own screen. It does not mean anyone has
        stood in the room and checked the geometry. If one of these is wrong, tell me and the plan
        gets rewritten around it.
      </p>
    </div>
  )
}

// What the squad's locked picks mean for the round.
//
// Telling him "Thermite is gone" was only ever half the information. If a
// teammate took it, the reinforced wall is covered and he should stop planning
// around it; if it was banned and nobody else brings hard breach, the wall is
// never opening and half the plan below is fiction. Same chip, opposite advice.
function TeamCapabilities({ side, taken, mates }) {
  if (!taken.size) return null
  const mine = new Set((PICK_ORDER[side] || []).map((p) => p.op.toLowerCase()))
  const caps = teamCapabilities(side, taken)
  const have = caps.filter((c) => c.covered)
  // With one pick locked, everything reads as "missing" and it is all noise —
  // the round has barely started. Gaps only mean something once most of the
  // team has committed, and even then only the two that cost the most.
  const missing = taken.size >= 3 ? caps.filter((c) => !c.covered).slice(0, 2) : []

  return (
    <div className="sx-caps">
      <div className="sx-caps-head">
        <strong>What your team can do</strong>
        <span>{taken.size} pick{taken.size === 1 ? '' : 's'} locked{mates[0] ? ` · with ${mates.filter(Boolean).join(', ')}` : ''}</span>
      </div>

      {have.length > 0 && (
        <ul className="sx-caps-have">
          {have.map((c) => (
            <li key={c.key}>
              <span className="sx-cap-tag">{c.label}</span>
              <span className="sx-cap-by">{c.by.join(', ')}</span>
              <span className="sx-cap-txt">{c.have}</span>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="sx-caps-gap">
          <h4>Missing — and you are still picking</h4>
          <ul>
            {missing.map((c) => {
              // The most useful thing a gap can say is "you can close this".
              // Only offer operators he actually plays and can still take.
              const canFix = c.ops.filter((op) => mine.has(op.toLowerCase()) && !taken.has(op.toLowerCase()))
              return (
                <li key={c.key}>
                  <b>{c.missing}</b>{' '}
                  {canFix.length
                    ? <>You play <b className="sx-cap-fix">{canFix.join(' and ')}</b> — taking {canFix.length > 1 ? 'one' : 'it'} closes this. Otherwise: {c.then.charAt(0).toLowerCase() + c.then.slice(1)}</>
                    : c.then}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function VerifiedSetup({ setupKey, squad, mates, gone = new Set(), taken = new Set(), banned = new Set(), side, runs = {}, setRuns = () => {} }) {
  const data = setupFor(setupKey.split(':')[0], setupKey.split(':')[1])
  if (!data) return null
  // The page shows the FULL plan. The short fields exist for the coach's voice,
  // and rendering those here produced fragments like "confirm it worked" with
  // nothing before it saying what to do.
  const raw = (data.full && data.full[side]) || data[side]
  const stacked = squad > 1
  // Solo queue: strip the partner out of the prose. Written plans name Aaron and
  // Jackson throughout, and in solo that is instructions for someone who is not
  // in the lobby. Steps that were ENTIRELY the partner's job drop out.
  // Non-owners get the same plan with the names and personal numbers taken out.
  // Runs for EVERYONE, owner included.
  //
  // The setup data no longer contains a name — it says "you" and "your duo"
  // literally, so the substitutions below are no-ops now and what actually earns
  // its keep is the verb agreement and sentence casing that agree() does. The
  // raw prose reads "you goes up first"; conjugating it is this pass, not the
  // data file.
  //
  // One path for owner and customer on purpose. A gate that changes the words
  // people read is a gate whose broken side nobody notices, and the broken side
  // would have been the paying customer's.
  const own = (o) => ({
    ...o,
    reinforce: dpList(o.reinforce), job: dpList(o.job), duoJob: dpList(o.duoJob),
    approach: dpList(o.approach), anchor: depersonalise(o.anchor),
    fallback: depersonalise(o.fallback), roam: depersonalise(o.roam),
    randoms: depersonalise(o.randoms), spawn: depersonalise(o.spawn),
    plant: depersonalise(o.plant), ifStalled: depersonalise(o.ifStalled),
  })
  const d = stacked ? own(raw) : own({
    ...raw,
    reinforce: soloList(raw.reinforce, mates[0]),
    job: soloList(raw.job, mates[0]),
    approach: soloList(raw.approach, mates[0]),
    anchor: soloise(raw.anchor, mates[0]),
    fallback: soloise(raw.fallback, mates[0]),
    roam: soloise(raw.roam, mates[0]),
    randoms: soloise(raw.randoms, mates[0]),
    spawn: soloise(raw.spawn, mates[0]),
    plant: soloise(raw.plant, mates[0]),
    ifStalled: soloise(raw.ifStalled, mates[0]),
  })

  // The verified data names two picks: his and his partner's. For a trio or
  // bigger, fill the remaining seats from the pick order, skipping anything
  // already taken. Better than showing three players nothing.
  const claimed = new Set([d.me, d.duo].filter(Boolean).map((x) => x.toLowerCase()))
  const extras = (PICK_ORDER[side] || [])
    .filter((p) => !claimed.has(p.op.toLowerCase()) && !gone.has(p.op.toLowerCase()))
    .slice(0, Math.max(0, squad - 2))

  // One ordered list, resolved once, so no two players are handed the same op.
  const seats = resolveSeats([
    { who: 'You', op: d.me },
    ...(stacked && d.duo ? [{ who: mates[0] || 'Your duo', op: d.duo }] : []),
    ...extras.map((p, i) => ({
      who: mates[i + 1] || `Player ${i + 3}`,
      op: p.op,
      note: p.win ? `next best open · ${p.win}` : 'next best open · unmeasured',
    })),
  ], side, gone)

  // Two different verdicts on a step, and they are not the same strength.
  //
  //   dead    — every operator that could do it is banned. Nobody in the match
  //             can run this step. It is not advice, it is fiction.
  //   uncovered — the squad's own cards do not cover it, but it is not banned,
  //             so a random might bring it. Worth saying, not worth striking.
  //
  // Derived from the seats actually assigned above, so it works from the ban
  // chips alone — he should not have to tell us his whole team before the page
  // notices that the plan's breacher is gone.
  const capState = (() => {
    const held = new Set([...taken, ...seats.map((s) => s.op).filter(Boolean).map((o) => o.toLowerCase())])
    const dead = new Set(); const uncovered = new Set()
    for (const c of teamCapabilities(side, held)) {
      if (c.ops.every((op) => banned.has(op.toLowerCase()))) dead.add(c.key)
      else if (!c.covered) uncovered.add(c.key)
    }
    return { dead, uncovered }
  })()

  return (
    <div className="sx-setup">
      <RunTracker runKey={`${setupKey}:${side}`} runs={runs} setRuns={setRuns} side={side} />
      {(() => {
        const broken = brokenPremise(d, seats, gone, side)
        if (!broken.length) return null
        return (
          <div className="sx-broken">
            <strong>This plan no longer works.</strong>
            <p>
              It is built around <b>{broken.join(' and ')}</b>, {broken.length > 1 ? 'both banned' : 'which is banned'}.
              The steps below still call for {broken.length > 1 ? 'those gadgets' : 'that gadget'} and nobody in your
              squad has {broken.length > 1 ? 'them' : 'it'} — do not run this as written.
            </p>
            {d.ifStalled ? <p className="sx-broken-alt"><span>Use the fallback:</span> {d.ifStalled}</p> : null}
          </div>
        )
      })()}

      <div className="sx-picks">
        {seats.map((s) => (
          <Seat key={s.who + (s.op || '')} who={s.who} op={s.op} side={side}
                swappedFrom={s.swappedFrom} swapReason={s.swapReason} note={s.note} />
        ))}
      </div>

      {side === 'defense' ? (
        <>
          <Steps title="Reinforce, in this order" items={d.reinforce} side={side} capState={capState} />
          <Steps title="Your job" items={d.job} side={side} capState={capState} />
          {stacked && <Steps title={mates[0] ? `Tell ${mates[0]}` : 'Tell your duo'} items={d.duoJob} side={side} capState={capState} />}
          <Field label="Anchor" value={d.anchor} />
          {/* The plan writes this as "ask your randoms for three things". In a
              3+ stack they are not randoms — they are named players on comms, so
              it becomes an assignment rather than a request. It was rendered
              nowhere at all before, which left the extra seats with no job. */}
          {d.randoms && (
            <Field
              label={stacked && squad > 2
                ? `Tell ${mates.slice(1, squad - 1).filter(Boolean).join(' and ') || 'the other two'}`
                : 'Ask your randoms'}
              value={d.randoms}
            />
          )}
          <Field label="Roam" value={d.roam} />
          <Field label="If you lose site" value={d.fallback} />
        </>
      ) : (
        <>
          <Field label="Spawn" value={d.spawn} />
          <Steps title="Approach" items={d.approach} side={side} capState={capState} />
          <Steps title="Your job" items={d.job} side={side} capState={capState} />
          {stacked && <Steps title={mates[0] ? `Tell ${mates[0]}` : 'Tell your duo'} items={d.duoJob} side={side} capState={capState} />}
          <Field label="Plant" value={d.plant} />
        </>
      )}

      {/* Same solo treatment. These are verification notes rather than in-round
          instructions, but "Aaron's second-room job assumes..." still reads as
          third person on his own page. */}
      <Assumptions
        full={stacked ? data.full : {
          ...data.full,
          [side]: d,
          uncertain: soloList(data.full?.uncertain, mates[0]),
          unverifiedSpots: soloList(data.full?.unverifiedSpots, mates[0]),
        }}
        side={side}
      />
    </div>
  )
}

// One custom game, one map, and the site stops being a guess.
//
// 62 sites have confirmed room names and no confirmed geometry, and no amount
// of ranked play fixes that on its own — the objective screen prints names, not
// walls. The three facts below are the whole gap between "names confirmed" and
// a setup that can actually be written: what reinforces, what is overhead, and
// where they come in.
//
// Deliberately per MAP rather than per site, because he walks the whole building
// in one custom game. Twelve short answers and the map is done.
function verifyTemplate(map) {
  const pending = map.sites.filter((s) => s.status !== 'verified')
  const lines = [map.name.toUpperCase(), '']
  for (const s of pending) {
    lines.push(`${s.floor} ${s.name}`)
    lines.push('  reinforce:   ')       // which walls into the site can be reinforced
    lines.push('  overhead:    ')       // hatch above? soft ceiling? nothing?
    lines.push('  under:       ')       // hatch in the floor? which room below?
    lines.push('  main way in: ')
    lines.push('')
  }
  lines.push('Shorthand is fine — "no hatch above, floor hatch to 1F Kitchen,')
  lines.push('2 walls: Hallway + exterior, they come from Hallway" is plenty.')
  return lines.join('\n')
}

function VerifyMap({ map }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pending = map.sites.filter((s) => s.status !== 'verified').length
  if (!pending) return null
  const text = verifyTemplate(map)

  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000) },
      () => { /* clipboard blocked — the textarea is still selectable */ },
    )
  }

  return (
    <div className="sx-verify">
      <button className="sx-verify-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : `Verify this map — ${pending} site${pending === 1 ? '' : 's'} need geometry`}
      </button>
      {open && (
        <div className="sx-verify-body">
          <p>
            Load {map.name} in a custom game, walk each site once, and fill these in. Paste it back
            and I write the real setups the same day. Everything else about this map is already read
            off your own screen — this is the only part footage cannot give me.
          </p>
          <textarea readOnly value={text} rows={Math.min(26, text.split('\n').length)} spellCheck={false} />
          <button className="sx-verify-copy" onClick={copy}>{copied ? 'Copied' : 'Copy template'}</button>
        </div>
      )}
    </div>
  )
}

// A playable card for a site with NO written setup.
//
// Twenty-three of twenty-five maps used to render one paragraph saying no setup
// exists, which is honest and useless: "I can not play off 2 sites in this."
// But the reason those maps have no setup is that we have their callouts and
// not their geometry, and a plan invented from callout names is exactly what
// put a ceiling hatch above Kids' Dorms.
//
// So this is composed, never generated. Every line is either a field read off
// his own screen (floor, rooms, spawns, callouts), a number from his own
// tracker (the picks), or a rule that holds regardless of what the building
// looks like. There is no step here that names a wall, because nobody has
// confirmed a wall. It cannot invent geometry because it never writes any.
const TWO_MAN_RULES = {
  attack: [
    'Travel together from the same spawn. A two-man split on attack is two 1v5s.',
    'Drone before you walk, and keep one drone alive for the entry. The round is decided by who has intel when the first shot goes off, not by who peeks first.',
    'You are utility, not entry — that is where your win rate is. Let the site come to you and take the trade, not the duel.',
    'Never re-enter through the hole you just took fire from. Make a second way in, or wait for them to look away from the first.',
    'Plant where you can defend it from outside the room. Both of you standing over the defuser is one grenade.',
  ],
  defense: [
    'Two of you cannot hold four entries. Pick the two that reach the defuser and give up the far lane deliberately.',
    'Short roam only — the top of the nearest stairs, one angle, one trade, back inside. Deep roaming with two is how the site gets taken for free.',
    'Set up after their drone phase, not before it. The spot you took in prep is the spot they cleared.',
    'One of you calls, one of you holds. If you are both talking about where they are, nobody is watching the door.',
    'Do not walk back into the angle that just killed your teammate. That is the one angle you know is covered.',
  ],
}

// What he would need to look at, once, for this site to earn a real setup.
// This is the loop he asked for: "as I play them then they become verified."
const CONFIRM_LIST = {
  attack: [
    'Which spawn actually reaches this site fastest — run each once.',
    'Which walls into the site are reinforceable, and which are already soft.',
    'Whether there is a hatch above or below this site, and which room it drops into.',
    'What has a sightline onto the plant area once the site is open.',
  ],
  defense: [
    'How many walls in this site can actually be reinforced.',
    'What is directly above and directly below it — and whether there is a hatch either way.',
    'Which entry is furthest from the defuser, so you know which one to give up.',
    'Where an anchor can sit with cover and still see the main door.',
  ],
}

function DraftCard({ mapId, site, side, squad, mates, gone, roster, runs = {}, setRuns = () => {} }) {
  const geo = VERIFIED_CALLOUTS[mapId]
  const rooms = site.name.split(' / ')
  const spawns = (geo?.spawns || []).map((s) => s.name)
  // Same floor first — on a 2F site the basement callouts are real but they are
  // not what he needs in his mouth during the round.
  const nearby = (geo?.callouts || [])
    .filter((c) => !rooms.some((r) => r.toLowerCase() === c.name.toLowerCase()))
    .sort((a, b) => (b.floor === site.floor) - (a.floor === site.floor))
    .slice(0, 16)

  return (
    <div className="sx-draft">
      <p className="sx-draft-lead">
        No written setup for this site — nobody has confirmed its walls or hatches yet, and a plan
        invented from room names is how a ceiling hatch that does not exist ended up in a Verified
        setup. Everything below is either read off your own screen or true regardless of the layout.
      </p>

      <div className="sx-draft-grid">
        <div className="sx-block">
          <h4>The site</h4>
          <p className="sx-draft-rooms">
            <b>{site.floor}</b> · {rooms.join('  and  ')}
          </p>
          {side === 'attack' && spawns.length > 0 && (
            <p className="sx-field"><span>Spawns</span>{spawns.join(' · ')} — pick one and both go there.</p>
          )}
        </div>

        <div className="sx-block">
          <h4>Who to play</h4>
          {/* Site-specific BEFORE the generic ladder. On defense the pick is
              final once op select closes, so "figure it out yourself" is the
              one thing the page must not do. */}
          {side === 'defense' && (() => {
            const fp = floorPicks(site.floor, (PICK_ORDER.defense || []).map((p) => p.op), gone)
            if (!fp) return null
            return (
              <div className="sx-floor">
                <h5>{fp.label} site — take these first</h5>
                <p className="sx-floor-ops">{fp.lift.join(' · ')}</p>
                <p className="sx-floor-why">{fp.why}</p>
                <p className="sx-floor-check"><span>Check in prep</span>{fp.check}</p>
              </div>
            )
          })()}
          <PickOrder side={side} squad={squad} mates={mates} gone={gone} roster={roster} />
        </div>
      </div>

      <RunTracker runKey={`${mapId}:${site.id}:${side}`} runs={runs} setRuns={setRuns} side={side} />

      <Steps title={`Rules that hold on any layout — ${side}`} items={TWO_MAN_RULES[side]} side={side} capState={null} />

      {nearby.length > 0 && (
        <div className="sx-block">
          <h4>Confirmed callouts on this map — use these names on comms</h4>
          <p className="sx-callouts">
            {nearby.map((c) => `${c.floor ? c.floor + ' ' : ''}${c.name}`).join('  ·  ')}
          </p>
        </div>
      )}

      <div className="sx-assume">
        <h4>Check these while you are in there and this becomes a real setup</h4>
        <ul className="sx-assume-list">
          {CONFIRM_LIST[side].map((q) => (
            <li key={q}><span className="sx-assume-n">?</span><span>{q}</span></li>
          ))}
        </ul>
        <p className="sx-assume-foot">
          Tell me the answers and I will write this site properly. That is the whole loop — the maps
          with real setups got them exactly this way.
        </p>
      </div>
    </div>
  )
}

function GeographyOnly({ mapId }) {
  const geo = VERIFIED_CALLOUTS[mapId]
  const callouts = geo ? geo.callouts.slice(0, 14) : []
  return (
    <div className="sx-partial">
      <p>
        The room names on this site are confirmed — they were read off your own objective screen
        {geo ? ` across ${geo.framesRead} frames from ${geo.sessions} recorded ${geo.sessions === 1 ? 'session' : 'sessions'}` : ''}.
        No setup is written for it yet, so nothing below tells you where to stand: that would be a guess,
        and guesses are what this library exists to replace.
      </p>
      {geo && geo.spawns?.length > 0 && (
        <Field label="Attack spawns" value={geo.spawns.map((s) => s.name).join(' · ')} />
      )}
      {callouts.length > 0 && (
        <div className="sx-block">
          <h4>Confirmed callouts on this map</h4>
          <p className="sx-callouts">
            {callouts.map((c) => `${c.floor ? c.floor + ' ' : ''}${c.name}`).join('  ·  ')}
          </p>
        </div>
      )}
    </div>
  )
}

function Unverified() {
  return (
    <div className="sx-partial">
      <p>
        Nothing verified here yet. Play this site with the coach recording and its geography gets read
        off the footage — room names, floors and attack spawns — which moves it up a tier automatically.
        Until then there is deliberately nothing here rather than a plausible guess.
      </p>
    </div>
  )
}

// Who to play, on ANY site, verified or not. The setup is map-specific; the pick
// is not — it comes from his own win rates. Withholding it on unverified sites
// left the page blank in the exact moment it was needed.
function PickOrder({ side, squad = 1, mates = [], gone = new Set(), roster = [] }) {
  // Every percentage in PICK_ORDER is Aaron's, off his own Tracker table. A
  // customer reading "Ash 54%" reasonably assumes it is THEIRS, and plays a
  // season on someone else's ladder. The ORDER is still defensible general
  // advice; the numbers behind it are not transferable, so they come off.
  const isOwner = useIsOwner()
  // "gone" = banned by either team, or already taken by a teammate. Same thing
  // from your seat: you cannot have it, so it must not be the recommendation.
  const list = (PICK_ORDER[side] || []).filter((p) => !gone.has(p.op.toLowerCase()))

  // Assign a seat to every player, not just Aaron. Naming the squad was
  // pointless while the page still only answered "what do YOU play" on the 92
  // sites with no written setup.
  const taken = new Set()
  const seats = []
  const yours = list.find((p) => !taken.has(p.op.toLowerCase()))
  if (yours) { taken.add(yours.op.toLowerCase()); seats.push({ who: 'You', op: yours.op, win: yours.win, sure: true }) }
  for (let i = 0; i < squad - 1; i++) {
    const name = mates[i]
    // Saved roster is the only teammate-specific source. We do not ship a
    // private player's historical pool in the browser bundle.
    const saved = rosterPool(roster, name, side)
    const own = saved ? { [side]: saved } : null
    const pick = own
      ? (own[side] || []).find((op) => !taken.has(op.toLowerCase()) && !gone.has(op.toLowerCase()))
      : (list.find((p) => !taken.has(p.op.toLowerCase())) || {}).op
    if (!pick) continue
    taken.add(String(pick).toLowerCase())
    seats.push({
      who: name || (i === 0 ? 'Your duo' : `Player ${i + 2}`),
      op: pick,
      sure: !!own,
    })
  }

  return (
    <div className="sx-pickorder">
      {squad > 1 && (
        <div className="sx-seats">
          <h4>Your squad here — {side}</h4>
          <div className="sx-picks">
            {seats.map((s) => (
              <Seat key={s.who + s.op} who={s.who} op={s.op} side={side}
                    note={
                      // Your own seat is not "their own pool" — that label is
                      // for a teammate we hold a saved pool for. With the win
                      // rate hidden from non-owners the seat fell through to it
                      // and told the reader his own pick came from someone else.
                      s.who === 'You'
                        ? (isOwner && s.win ? `your ${s.win}` : 'highest still open')
                        : s.sure ? 'from their own pool' : 'best still open'
                    } />
            ))}
          </div>
          <p className="sx-pickorder-note">
            Names we hold a pool for get an operator they actually play. Anyone else gets the best
            pick still open, marked as such — we are not pretending to know what a stranger runs.
          </p>
        </div>
      )}
      <h4>Full order — {side === 'attack' ? 'attack' : 'defense'}</h4>
      <p className="sx-pickorder-note">
        {isOwner
          ? 'Take the highest name that is open and not banned. This comes from your own win rate, so it holds on every map — including the ones with no setup written yet.'
          : 'Take the highest name that is open and not banned. This order is the coach’s, built from tracked ranked play, not from your account — it is a starting point that holds on every map, including the ones with no setup written yet. Link your own tracker and it gets rebuilt around what you actually play.'}
      </p>
      <ol className="sx-picklist">
        {list.map((p) => (
          <li key={p.op}>
            <strong>{p.op}</strong>
            {/* A number earned on a loadout he no longer runs must not be shown
                as if it were current — that is what kept pushing him onto Vigil
                while he was struggling with the BOSG. */}
            {isOwner && (
              <span className={`sx-win${p.staleStat ? ' stale' : ''}`} title={p.staleStat || undefined}>
                {p.win || 'n/a'}{p.staleStat ? ' ⚠' : ''}
              </span>
            )}
            {/* Eight of the twenty-three rationales are nothing but Aaron's
                record once the tactical half is taken out, so a customer gets
                the operator and no reason. That is the honest outcome — an
                empty line beats a sentence we made up to fill it. */}
            {(isOwner ? p.why : dpWhy(p.why)) && (
              <span className="sx-why">{isOwner ? p.why : dpWhy(p.why)}</span>
            )}
            {isOwner && p.staleStat && <span className="sx-stale">Stat {p.staleStat}</span>}
          </li>
        ))}
      </ol>
      {/* Owner only, and not merely because of the numbers.
          AVOID is "operators Aaron personally loses on" — Mute is on it at a
          0.73 K/D. Mute is one of the strongest defenders in the game. Shown to
          a customer under the heading "Not these" that is not a redacted stat,
          it is bad coaching: we would be talking someone off a good operator on
          the strength of one player's bad season with it. Scrubbing the number
          off makes it worse, not better, because it removes the only clue that
          the advice was personal. */}
      {isOwner && (
        <p className="sx-avoid">
          <span>Not these</span>
          {AVOID.map((a) => `${a.op} ${a.win}${a.note ? ` (${a.note})` : ''}`).join(' · ')}
        </p>
      )}
    </div>
  )
}

export default function SetupsPage() {
  const { plan, isAdmin } = useAuth()
  const { catalog, loading: catalogLoading, error: catalogError } = useProtectedCatalog()
  const hasEliteAccess = isAdmin || plan === 'elite' || plan === 'champion'
  configureSetupCatalog(hasEliteAccess ? catalog : null)
  const [openMap, setOpenMap] = useState('oregon')
  const [openSite, setOpenSite] = useState(null)
  const [openSide, setOpenSide] = useState('attack')
  // Squad SIZE and WHO. Size alone was not enough — "duo" could not say which
  // of your mates takes the second pick, and a trio or 5-stack had no option at
  // all. Names persist so this is set once, not every visit.
  const [squad, setSquad] = useState(() => {
    const n = parseInt(localStorage.getItem('recon6-squad-size') || '2', 10)
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 2
  })
  const [mates, setMates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recon6-squad-mates') || '[]') } catch { return [] }
  })
  const [editSquad, setEditSquad] = useState(false)
  const [roster, setRoster] = useState(() => loadRoster())
  const [runs, setRuns] = useState(() => loadRuns())
  const [rankedOnly, setRankedOnly] = useState(true)
  // Two different facts that used to be one. Both remove an operator from YOUR
  // options, so the old code stored a single "gone" set — but they mean opposite
  // things for the plan. A banned Thermite means nobody opens the wall. A
  // teammate's Thermite means the wall is already somebody's job.
  //
  // One tap cycles open -> banned -> taken by team -> open, because this gets
  // used during a prep phase and nobody has time for a menu.
  // Not persisted: bans change every match and a stale ban is worse than none.
  const [marks, setMarks] = useState(() => new Map())
  const cycleMark = (op) => setMarks((prev) => {
    const next = new Map(prev)
    const k = op.toLowerCase()
    const cur = next.get(k)
    if (!cur) next.set(k, 'ban')
    else if (cur === 'ban') next.set(k, 'take')
    else next.delete(k)
    return next
  })
  // Unavailable to you, whatever the reason — what the pick logic still wants.
  const gone = useMemo(() => new Set(marks.keys()), [marks])
  // Locked by a teammate: this is capability the squad HAS.
  const taken = useMemo(
    () => new Set([...marks].filter(([, v]) => v === 'take').map(([k]) => k)),
    [marks],
  )
  // Banned outright: nobody in the match gets it. The only signal strong enough
  // to call a step impossible rather than merely uncovered.
  const banned = useMemo(
    () => new Set([...marks].filter(([, v]) => v === 'ban').map(([k]) => k)),
    [marks],
  )

  const setSquadSize = (n) => {
    setSquad(n)
    localStorage.setItem('recon6-squad-size', String(n))
  }
  const setMate = (i, v) => {
    const next = [...mates]
    next[i] = v
    setMates(next)
    localStorage.setItem('recon6-squad-mates', JSON.stringify(next))
  }

  const maps = useMemo(() => {
    const list = SITE_INDEX.filter((m) => !m.comingSoon)
    // A map you have actually PLAYED is never hidden. Villa and Skyscraper are
    // out of the ranked rotation, so the filter swallowed them the same night
    // their geography got verified off Aaron's own footage — you record a map,
    // it verifies, and then it is invisible. Footage always beats the filter.
    const shown = rankedOnly
      ? list.filter((m) => m.rankedPool || m.framesRead > 0)
      : list
    // Most-verified first — the finished work should be the first thing seen,
    // and the empty maps read as a queue rather than as failure.
    return [...shown].sort((a, b) => {
      const score = (m) => m.sites.filter((s) => s.status === 'verified').length * 10
        + m.sites.filter((s) => s.status === 'geography').length
      return score(b) - score(a) || a.name.localeCompare(b.name)
    })
  }, [rankedOnly])

  const active = maps.find((m) => m.id === openMap) || maps[0]

  return (
    <div className="setups-page">
      <header className="sx-head">
        <h1>Setup Library</h1>
        <p className="sx-sub">
          Every map, every bomb site. Each one carries its own status, because a setup read off real
          footage and a setup someone imagined are not the same thing and should never look the same.
        </p>
        <div className="sx-tally">
          <span className="sx-badge sx-ok">{SITE_TALLY.verified} verified</span>
          <span className="sx-badge sx-part">{SITE_TALLY.geography} names confirmed</span>
          <span className="sx-badge sx-none">{SITE_TALLY.unverified} not yet</span>
        </div>
        {hasEliteAccess && catalogLoading && <p className="sx-sub">Loading your verified setup library…</p>}
        {hasEliteAccess && catalogError && <p className="sx-sub">The protected setup library could not load: {catalogError.message}</p>}
      </header>

      <div className="sx-controls">
        {/* Side lives at page level: the ban chips depend on it, and it used to
            be reachable only inside an expanded site — close them all and you
            were stuck on attack with no way back. */}
        <div className="sx-seg sx-seg-side">
          <button className={openSide === 'attack' ? 'on' : ''} onClick={() => setOpenSide('attack')}>Attack</button>
          <button className={openSide === 'defense' ? 'on' : ''} onClick={() => setOpenSide('defense')}>Defense</button>
        </div>
        <div className="sx-seg">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={squad === n ? 'on' : ''} onClick={() => setSquadSize(n)}>
              {['Solo', 'Duo', 'Trio', '4-stack', '5-stack'][n - 1]}
            </button>
          ))}
        </div>
        {squad > 1 && (
          <button className="sx-who" onClick={() => setEditSquad((v) => !v)}>
            {mates.slice(0, squad - 1).filter(Boolean).length
              ? `with ${mates.slice(0, squad - 1).filter(Boolean).join(', ')}`
              : 'who are you playing with?'}
          </button>
        )}
        <label className="sx-check">
          <input type="checkbox" checked={rankedOnly} onChange={(e) => setRankedOnly(e.target.checked)} />
          Ranked pool only
        </label>
      </div>

      <div className="sx-bans">
        <div className="sx-bans-head">
          <strong>Who's off the board</strong>
          <span>
            Tap once if it's <b className="sx-k-ban">banned</b>, twice if <b className="sx-k-take">someone on your team locked it</b>.
            Bans take an option away; a teammate's pick gives the squad something, and the plan below changes for both.
          </span>
          {marks.size > 0 && <button className="sx-clear" onClick={() => setMarks(new Map())}>clear {marks.size}</button>}
        </div>
        <div className="sx-banchips">
          {/* Full roster for the side you are actually on. Yours are marked so
              they are findable in a list of forty. */}
          {[...(OP_ROSTER[openSide] || [])].sort().map((op) => {
            const mine = (PICK_ORDER[openSide] || []).some((p) => p.op.toLowerCase() === op.toLowerCase())
            const mark = marks.get(op.toLowerCase())
            return (
              <button
                key={op}
                className={`sx-banchip${mark === 'ban' ? ' out' : ''}${mark === 'take' ? ' took' : ''}${mine ? ' mine' : ''}`}
                onClick={() => cycleMark(op)}
                title={mark === 'ban' ? 'banned' : mark === 'take' ? 'your team has this' : mine ? 'in your pool' : undefined}
              >{op}</button>
            )
          })}
        </div>
      </div>

      <TeamCapabilities side={openSide} taken={taken} mates={mates} />

      {squad > 1 && editSquad && (
        <>
          <SquadRoster roster={roster} setRoster={setRoster} onClose={() => setEditSquad(false)} />
          <div className="sx-squadedit">
            <p>Who is in each seat tonight?</p>
            <div className="sx-mateinputs">
              {Array.from({ length: squad - 1 }).map((_, i) => (
                <select key={i} value={mates[i] || ''} onChange={(e) => setMate(i, e.target.value)}>
                  <option value="">{i === 0 ? 'Your duo…' : `Player ${i + 2}…`}</option>
                  {roster.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              ))}
            </div>
            <button className="sx-done" onClick={() => setEditSquad(false)}>Done</button>
          </div>
        </>
      )}

      <div className="sx-layout">
        <nav className="sx-maps">
          {maps.map((m) => {
            const v = m.sites.filter((s) => s.status === 'verified').length
            const g = m.sites.filter((s) => s.status === 'geography').length
            return (
              <button
                key={m.id}
                className={m.id === active?.id ? 'on' : ''}
                onClick={() => { setOpenMap(m.id); setOpenSite(null) }}
              >
                <span className="sx-mapname">{m.name}</span>
                <span className="sx-dots">
                  {m.sites.map((s, i) => <i key={i} className={`sx-dot sx-${STATUS[s.status].cls}`} />)}
                </span>
                <span className="sx-mapmeta">
                  {v ? `${v} verified` : g ? `${g} confirmed` : 'not yet'}
                  {!m.rankedPool && m.framesRead > 0 ? <span className="sx-offpool"> · off-pool</span> : null}
                </span>
              </button>
            )
          })}
        </nav>

        <section className="sx-detail">
          {active && (
            <>
              <div className="sx-detail-head">
                <h2>{active.name}</h2>
                {active.framesRead > 0 && (
                  <p className="sx-receipt">
                    Read from {active.framesRead} frames across {active.sessions} recorded{' '}
                    {active.sessions === 1 ? 'session' : 'sessions'}
                    {active.spawns.length ? ` · spawns: ${active.spawns.join(', ')}` : ''}
                  </p>
                )}
              </div>

              <VerifyMap map={active} />

              {active.sites.map((s) => {
                const open = openSite === s.id
                return (
                  <article key={s.id} className={`sx-site ${open ? 'open' : ''}`}>
                    <button className="sx-site-head" onClick={() => setOpenSite(open ? null : s.id)}>
                      <span className="sx-site-name">
                        {s.floor ? <em>{s.floor}</em> : null} {s.name}
                      </span>
                      <Badge status={s.status} />
                    </button>
                    {open && (
                      <div className="sx-site-body">
                        <p className="sx-status-blurb">{STATUS[s.status].blurb}</p>
                        {s.status === 'verified' ? (
                          <ChampionGate label="Elite — verified setups">
                            <VerifiedSetup setupKey={s.setupKey} squad={squad} mates={mates} gone={gone} taken={taken} banned={banned} runs={runs} setRuns={setRuns}
                                           side={openSide} setSide={setOpenSide} />
                          </ChampionGate>
                        ) : (
                          <>
                            {/* No setup yet, but the pick is still answerable. */}
                            <PickOrder side={openSide} squad={squad} mates={mates} gone={gone} roster={roster} />
                            {s.status === 'geography'
                              ? <DraftCard mapId={active.id} site={s} side={openSide} squad={squad}
                                            mates={mates} gone={gone} taken={taken} banned={banned}
                                            roster={roster} runs={runs} setRuns={setRuns} />
                              : <Unverified />}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </>
          )}
        </section>
      </div>

      <footer className="sx-foot">
        <p>
          How a site gets verified: play it with the coach recording. The objective screen, spawn screen
          and in-world labels are read straight off your own footage, so the room names here are the ones
          the game actually prints — not the ones a guide remembers.
        </p>
        {!isAdmin && plan !== 'elite' && plan !== 'champion' && (
          <p className="sx-foot-cta">Verified setups unlock at Elite. Everything else on this page is free to browse.</p>
        )}
      </footer>
    </div>
  )
}
