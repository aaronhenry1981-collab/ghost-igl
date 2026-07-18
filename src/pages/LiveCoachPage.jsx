import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MAPS from '../data/maps'
import STRATS from '../data/strats'
import BANS from '../data/bans'
import OPERATORS from '../data/operators'
import R6_LOADOUTS from '../data/games/r6/loadouts'
import { useAuth } from '../hooks/useAuth'
import { useActiveGame } from '../hooks/useActiveGame'
import SignInGate from '../components/SignInGate'
import { track } from '../utils/analytics'
import './LiveCoachPage.css'

// Live Coach — Aaron's "in-match walkthrough" feature.
//
// PROBLEM: The standalone Strats / Bans / Operators / Loadouts pages
// each show a slice of the answer, but during an actual R6 ranked match
// you don't have 5 tabs open and 90 seconds to bounce between them. You
// need ONE screen that walks you through "what do I do right now" in
// the order R6 ranked actually unfolds:
//
//   1. Stack size FIRST → solo / duo / trio / 4-stack / 5-stack. You
//      know this before you even queue, and it changes every op
//      recommendation downstream (solo shouldn't pick Thermite without
//      a Thatcher teammate; a 5-stack should run the full meta lineup)
//   2. You saw the map → pick the map
//   3. Bans phase → mark what got banned
//   4. Side flip → pick atk/def for this round
//   5. Site flip → which bomb site this round
//   6. Operator → filtered to what's NOT banned + fits your queue size
//   7. Loadout + Site setup → primary, secondary, gadget, key callouts,
//      reinforce priorities, spawn-kill spots, post-plant util
//
// Each step shows AS A SINGLE CARD with the next-step CTA. Completed
// steps collapse to a one-line summary so the page stays scannable
// between rounds. Map + bans + queue size persist via localStorage so
// you don't redo the prep on every refresh.

// All maps with real strat content — not ranked-pool-only. Players ban/pick
// from whatever map their match (ranked, unranked, quick match, custom) rolls,
// so the map-ban step shouldn't silently drop non-ranked maps like Favela,
// Fortress, Hereford, House, Plane, Stadium Bravo, Tower, or Yacht.
const LIVE_COACH_MAPS = MAPS.filter((m) => !m.comingSoon && STRATS[m.id])

// Full attacker / defender rosters (every operator the app has strat data for),
// alphabetized, for the ban-phase dropdown. Derived from the computed OPERATORS
// index so it stays in sync with strats.js automatically. NO TYPING mid-match —
// the ban picker is a native dropdown (fast scroll-pick on console/mobile).
const ALL_ATTACKERS = OPERATORS
  .filter((o) => o.sidesSeen?.includes('attack'))
  .map((o) => o.name)
  .sort((a, b) => a.localeCompare(b))
const ALL_DEFENDERS = OPERATORS
  .filter((o) => o.sidesSeen?.includes('defense'))
  .map((o) => o.name)
  .sort((a, b) => a.localeCompare(b))

// Operator team-dependency map — determines which ops are solo-friendly
// vs which require a coordinated stack to be effective. The general rule:
//
//   - Hard breachers (Thermite, Hibana, Ace, Maverick, Kali) NEED a
//     support op clearing electronics. Pointless in solo queue if no one
//     picks Thatcher / Twitch.
//   - Support / Intel ops (Thatcher, Twitch, IQ, Dokkaebi, Lion) are the
//     OTHER half of those combos. Same issue solo.
//   - Anchor / Entry / Roam ops are self-sufficient — they work even
//     when teammates are random.
//
// Anything not in the team-dependent set is considered solo-friendly.
// You can still pick a team-dependent op in solo queue — we just warn
// you it's likely to be wasted.
const TEAM_DEPENDENT_OPS = new Set([
  'Thermite', 'Hibana', 'Ace', 'Maverick', 'Kali',          // hard breach
  'Thatcher', 'Twitch', 'IQ', 'Dokkaebi', 'Lion', 'Flores', // support / intel
])
const NO_BANS = new Set()

const QUEUE_SIZE_LABELS = {
  1: 'Solo queue',
  2: 'Duo',
  3: 'Trio',
  4: '4-stack',
  5: '5-stack',
}

// Group operators by their high-level role for the team-comp builder.
// The strats data uses lots of role labels ("Hard Breach", "Anti-Breach",
// "Soft Breach", "Vertical Play", etc.) — we cluster them into 5 buckets
// so a stack can field one op per bucket and have a coordinated comp.
function bucketForRole(roleStr) {
  const r = (roleStr || '').toLowerCase()
  if (r.includes('hard breach')) return 'hard_breach'
  if (r.includes('support') || r.includes('breach support') || r.includes('utility') || r.includes('soft breach')) return 'support'
  if (r.includes('entry') || r.includes('frag')) return 'entry'
  if (r.includes('intel') || r.includes('drone') || r.includes('recon')) return 'intel'
  if (r.includes('flank') || r.includes('vertical')) return 'flex_atk'
  if (r.includes('anchor') || r.includes('anti-breach') || r.includes('breach denial')) return 'anchor'
  if (r.includes('roam')) return 'roamer'
  if (r.includes('area denial') || r.includes('intel denial')) return 'denial'
  if (r.includes('shield') || r.includes('delay')) return 'flex_def'
  return 'flex'
}

// Bucket order priority — when building the comp, fill these slots first.
// Order matters: a coordinated R6 attack needs breach + support FIRST, then
// entry, then intel, then flex. Defense needs anchor + denial + roamer.
const ATTACK_BUCKET_ORDER = ['hard_breach', 'support', 'entry', 'intel', 'flex_atk', 'flex']
const DEFENSE_BUCKET_ORDER = ['anchor', 'denial', 'roamer', 'flex_def', 'flex']

const ROLE_BUCKET_LABELS = {
  hard_breach: 'Hard breacher',
  support: 'Breach support',
  entry: 'Entry fragger',
  intel: 'Intel / drone',
  flex_atk: 'Flex / flank',
  anchor: 'Anchor',
  denial: 'Area denial',
  roamer: 'Roamer',
  flex_def: 'Flex / shield',
  flex: 'Flex',
}

// Build a coordinated team comp from the strat's full operator pool.
// Filters out banned ops, then walks the priority buckets in order
// picking the highest-priority op for each. Caps at queueSize ops.
function buildTeamComp(operators, banSet, side, queueSize) {
  if (!Array.isArray(operators)) return []
  const order = side === 'attack' ? ATTACK_BUCKET_ORDER : DEFENSE_BUCKET_ORDER
  const priorityWeight = { essential: 3, recommended: 2, flex: 1 }
  // Bucket the available ops
  const buckets = {}
  for (const op of operators) {
    if (banSet.has(op.name)) continue
    const b = bucketForRole(op.role)
    if (!buckets[b]) buckets[b] = []
    buckets[b].push(op)
  }
  // Sort each bucket by priority weight (essential first)
  for (const b of Object.keys(buckets)) {
    buckets[b].sort((a, c) => (priorityWeight[c.priority] || 0) - (priorityWeight[a.priority] || 0))
  }
  // Walk the order and pick one op per bucket, skipping ops already in comp
  const taken = new Set()
  const comp = []
  for (const b of order) {
    const candidate = buckets[b]?.find((op) => !taken.has(op.name))
    if (!candidate) continue
    taken.add(candidate.name)
    comp.push({ ...candidate, bucket: b, bucketLabel: ROLE_BUCKET_LABELS[b] })
    if (comp.length >= queueSize) break
  }
  // If still short (small ops pool / weird role labels), fill with any
  // unbucketed essentials/recommendeds we haven't grabbed yet.
  if (comp.length < queueSize) {
    const leftovers = operators
      .filter((op) => !banSet.has(op.name) && !taken.has(op.name))
      .sort((a, c) => (priorityWeight[c.priority] || 0) - (priorityWeight[a.priority] || 0))
    for (const op of leftovers) {
      if (comp.length >= queueSize) break
      taken.add(op.name)
      comp.push({ ...op, bucket: 'flex', bucketLabel: ROLE_BUCKET_LABELS.flex })
    }
  }
  return comp
}

const QUEUE_ADVICE = {
  1: 'Skip hard-breach + Thatcher-style picks unless your random fill team already locked one — they only work as a duo combo.',
  2: 'Coordinate one hard-breach + one support pick with your duo partner. Skip flex-role ops.',
  3: 'You can run the breach-support combo plus one intel op (Dokkaebi / Lion). Still skip pure flex.',
  4: 'Almost full lineup — run the breach combo, intel, and one anchor / entry frag. One slot stays open for fill.',
  5: 'Full meta lineup. Coordinate breach + support + intel + anchor + entry. No filler picks.',
}

// LocalStorage keys — persist across page refresh so users don't redo
// the prep mid-match.
//
// R6 ranked is BO6 (first to 4) with sides swapping at round 3:
//   • Half 1: rounds 1-3 (one ban phase before round 1)
//   • Half 2: rounds 4-6 (one ban phase before round 4)
//   • Overtime (only if 3-3 after regulation): NO new bans — the existing
//     ban set from the corresponding side carries over. We don't model OT
//     explicitly; users on attack-side OT just keep using H1 if they were
//     attack in H1 (or H2 if they were attack in H2). The half tabs let
//     them swap manually if needed.
//
// Bans are stored as a TWO-ELEMENT array (one per half) — each persists
// to its own localStorage key.
const LS_KEYS = {
  map: 'recon6-live-coach-map',
  bans1: 'recon6-live-coach-bans-h1',
  bans2: 'recon6-live-coach-bans-h2',
  queue: 'recon6-live-coach-queue',
  half: 'recon6-live-coach-half',
}

function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage blocked — silently no-op, state still works in memory
  }
}

// Map operator name → loadout entry from the R6 loadouts file. Loadouts
// are keyed by role category (hard_breach, support, etc.) not op name, so
// we flatten once and memoize.
function buildLoadoutIndex() {
  const idx = {}
  for (const categoryKey of Object.keys(R6_LOADOUTS)) {
    const category = R6_LOADOUTS[categoryKey]
    if (!Array.isArray(category?.operators)) continue
    for (const op of category.operators) {
      idx[op.name] = { ...op, category: category.name, categorySummary: category.summary }
    }
  }
  return idx
}
const LOADOUT_INDEX = buildLoadoutIndex()

export default function LiveCoachPage() {
  const { user, loading: authLoading } = useAuth()
  const { isR6, activeGame } = useActiveGame()

  // R6-only feature. Other games have different pre-round flows
  // (no bans, different ult economies, etc.) — separate UX problem.
  if (!authLoading && !user) {
    return (
      <SignInGate
        feature="Live Coach"
        gameMeta={activeGame?.gameMeta}
        benefits={[
          'One-screen in-match walkthrough — stack size, map, bans, side, site, ops, loadouts',
          'Filters operator picks based on your stack size (solo vs 5-stack)',
          'Persists map + bans across rounds so you only do prep once per match',
        ]}
      />
    )
  }
  if (!isR6) return <NonR6Placeholder />

  return <R6LiveCoach />
}

function NonR6Placeholder() {
  return (
    <div className="live-coach-page">
      <div className="live-coach-empty">
        <h1>Live Coach is R6 Siege only (for now)</h1>
        <p>
          The pre-round flow for non-R6 games (no bans, different ult economy, different objective types)
          needs a different walkthrough. For now Live Coach covers R6 — switch the active game to R6 in the navbar to use it.
        </p>
        <Link to="/match-prep" className="btn btn-primary">Open Match Prep instead</Link>
      </div>
    </div>
  )
}

function R6LiveCoach() {
  const [searchParams] = useSearchParams()

  // URL-encoded prep state takes priority over localStorage on first
  // load — lets squadmates share a Discord link that re-hydrates the
  // exact prep view the sender was looking at. URL → state on mount,
  // state → URL when user clicks Share. Map: ?m=bank&h1=Thatcher,Mira
  // &h2=Maverick&q=5&s=attack&site=ceo&half=1.
  function urlList(key) {
    const v = searchParams.get(key)
    if (!v) return null
    return v.split(',').map((s) => s.trim()).filter(Boolean)
  }

  // ── State ─────────────────────────────────────────────────────────
  const [mapId, setMapId] = useState(() => searchParams.get('m') || getStored(LS_KEYS.map, null))
  // R6 ranked = 2 ban phases per match. bans[0] = half 1 (rounds 1-3),
  // bans[1] = half 2 (rounds 4-6). The activeHalf pointer decides which
  // set drives op filtering at any given moment.
  const [bans, setBans] = useState(() => [
    new Set(urlList('h1') || getStored(LS_KEYS.bans1, [])),
    new Set(urlList('h2') || getStored(LS_KEYS.bans2, [])),
  ])
  const [activeHalf, setActiveHalf] = useState(() => Number(searchParams.get('half')) || getStored(LS_KEYS.half, 1))
  const [side, setSide] = useState(() => searchParams.get('s') === 'defense' ? 'defense' : 'attack')
  const [siteId, setSiteId] = useState(() => searchParams.get('site') || null)
  // Stack size starts null (no default) — it's now step 1 and we want an
  // explicit pick, not a silent 5-stack assumption. Returning users skip
  // ahead automatically via localStorage; share links via ?q=.
  const [queueSize, setQueueSize] = useState(() => Number(searchParams.get('q')) || getStored(LS_KEYS.queue, null))
  const [selectedOpName, setSelectedOpName] = useState(() => searchParams.get('op') || null)
  const [shareCopied, setShareCopied] = useState(false)

  // Persist long-lived state to localStorage on change
  useEffect(() => { if (mapId) setStored(LS_KEYS.map, mapId) }, [mapId])
  useEffect(() => { setStored(LS_KEYS.bans1, [...bans[0]]) }, [bans])
  useEffect(() => { setStored(LS_KEYS.bans2, [...bans[1]]) }, [bans])
  useEffect(() => { if (queueSize) setStored(LS_KEYS.queue, queueSize) }, [queueSize])
  useEffect(() => { setStored(LS_KEYS.half, activeHalf) }, [activeHalf])

  // Reset op pick when any upstream state changes (different round = different op).
  // Deliberate reset-on-dependency-change; null set is cheap and terminal.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelectedOpName(null) }, [side, siteId, activeHalf])

  const map = useMemo(() => MAPS.find((m) => m.id === mapId), [mapId])
  const siteStrats = STRATS[mapId]?.[siteId]
  const stratForSide = siteStrats?.[side]
  const banSuggestions = BANS[mapId]
  // Current half's bans drive all filtering — half 1 ops bank doesn't
  // contaminate half 2 recommendations and vice versa.
  const activeBans = useMemo(() => bans[activeHalf - 1] || NO_BANS, [bans, activeHalf])

  // Filter operator recommendations: not banned + queue-size compatible
  const recommendedOps = useMemo(() => {
    if (!stratForSide?.operators) return []
    return stratForSide.operators
      .filter((op) => !activeBans.has(op.name))
      .filter((op) => {
        if (queueSize >= 4) return true
        if (queueSize >= 2 && (op.priority === 'essential' || op.priority === 'recommended')) return true
        if (queueSize === 1) {
          // Solo: prefer self-sufficient ops, drop hard-breach + support pairs
          if (TEAM_DEPENDENT_OPS.has(op.name)) return false
          return op.priority === 'essential' || op.priority === 'recommended'
        }
        return false
      })
  }, [stratForSide, activeBans, queueSize])

  // Find the selected op's loadout (if any). Some operators don't have
  // loadout entries — we fall back to a graceful "loadout details on the
  // Operators page" link.
  const selectedOpData = recommendedOps.find((op) => op.name === selectedOpName)
  const loadout = selectedOpData ? LOADOUT_INDEX[selectedOpData.name] : null

  // Coordinated team comp — meaningful for 2+ (a duo absolutely coordinates a
  // breach+support combo; only true solo queue has zero teammate control).
  const teamComp = useMemo(() => {
    if (queueSize < 2 || !stratForSide?.operators) return []
    return buildTeamComp(stratForSide.operators, activeBans, side, queueSize)
  }, [stratForSide, activeBans, side, queueSize])

  // Site difficulty scoring — given the current half's bans, score each
  // bomb site by how many of its ESSENTIAL operators got banned. Sites
  // where your essentials are intact = "easy" pick. Sites where 2+ essential
  // ops are banned = "hard" — you're forced into suboptimal picks. Lets
  // the IGL pick the right site to attack or defend each round.
  const siteDifficulty = useMemo(() => {
    if (!map || !map.sites) return {}
    const out = {}
    for (const s of map.sites) {
      const stratHere = STRATS[mapId]?.[s.id]?.[side]
      if (!stratHere?.operators) {
        out[s.id] = { score: null, banned: 0, total: 0, level: 'unknown' }
        continue
      }
      const essentials = stratHere.operators.filter((op) => op.priority === 'essential')
      const bannedEssentials = essentials.filter((op) => activeBans.has(op.name))
      const banned = bannedEssentials.length
      const total = essentials.length
      // Level thresholds: 0 banned = easy, 1 banned = standard, 2+ = hard
      let level = 'easy'
      if (banned >= 2) level = 'hard'
      else if (banned === 1) level = 'standard'
      out[s.id] = { score: banned, banned, total, level, bannedNames: bannedEssentials.map((op) => op.name) }
    }
    return out
  }, [map, mapId, side, activeBans])

  // Sites sorted by ease (easiest first) — so the recommended pick is
  // at the top of the grid. Sites without strats fall to the bottom.
  const sortedSites = useMemo(() => {
    if (!map?.sites) return []
    return [...map.sites]
      .filter((s) => STRATS[mapId]?.[s.id])
      .sort((a, b) => {
        const aDiff = siteDifficulty[a.id]?.banned ?? 99
        const bDiff = siteDifficulty[b.id]?.banned ?? 99
        return aDiff - bDiff
      })
  }, [map, mapId, siteDifficulty])

  // The single recommended site = easiest one. Shown as a one-line
  // banner under the site grid so the IGL has a default to call.
  const recommendedSite = sortedSites[0]
  const recommendedSiteDifficulty = recommendedSite ? siteDifficulty[recommendedSite.id] : null

  // Track when a step is completed
  const completed = {
    map: !!map,
    bans: bans[0].size > 0 || bans[1].size > 0,
    sideSite: !!siteId,
    queue: !!queueSize,
    operator: !!selectedOpName,
  }

  // Smooth-scroll to the next step when previous completes
  function scrollToStep(stepKey) {
    const el = document.getElementById(`step-${stepKey}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function toggleBan(opName) {
    setBans((prev) => {
      const next = [new Set(prev[0]), new Set(prev[1])]
      const target = next[activeHalf - 1]
      if (target.has(opName)) target.delete(opName)
      else target.add(opName)
      return next
    })
    track('Live Coach Ban Toggle', { opName, half: activeHalf })
  }

  function resetMatch() {
    setMapId(null)
    setBans([new Set(), new Set()])
    setActiveHalf(1)
    setSide('attack')
    setSiteId(null)
    setSelectedOpName(null)
    setStored(LS_KEYS.map, null)
    setStored(LS_KEYS.bans1, [])
    setStored(LS_KEYS.bans2, [])
    setStored(LS_KEYS.half, 1)
    track('Live Coach Reset')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build a shareable URL that encodes the entire prep state. Squadmate
  // opens the link → lands on the exact same map / bans / side / site /
  // queue / op view. Every Discord paste is an organic inbound link
  // pointing at our domain.
  function shareUrl() {
    const params = new URLSearchParams()
    if (mapId) params.set('m', mapId)
    if (bans[0].size > 0) params.set('h1', [...bans[0]].join(','))
    if (bans[1].size > 0) params.set('h2', [...bans[1]].join(','))
    if (activeHalf !== 1) params.set('half', String(activeHalf))
    if (side !== 'attack') params.set('s', side)
    if (siteId) params.set('site', siteId)
    if (queueSize) params.set('q', String(queueSize))
    if (selectedOpName) params.set('op', selectedOpName)
    const url = `${window.location.origin}/live?${params.toString()}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      track('Live Coach Share', { mapId, side, hasBans: bans[0].size + bans[1].size > 0 })
      setTimeout(() => setShareCopied(false), 2500)
    }).catch(() => {
      // Clipboard blocked — fall back to prompting the URL inline so
      // the user can copy manually. window.prompt() works everywhere.
      window.prompt('Copy this URL to share with your squad:', url)
    })
  }

  // Mid-match transition to Half 2 — fires when sides swap at round 6.
  // Doesn't wipe Half 1 bans (you might want to reference them) but
  // points the active pointer at Half 2 so subsequent ban edits +
  // op filtering use the new ban set.
  function switchToHalf(half) {
    setActiveHalf(half)
    // Sides flip at half — swap atk/def too
    setSide((s) => (s === 'attack' ? 'defense' : 'attack'))
    setSiteId(null)
    setSelectedOpName(null)
    track('Live Coach Half Switch', { newHalf: half })
    setTimeout(() => {
      const el = document.getElementById(bans[half - 1].size === 0 ? 'step-bans' : 'step-round')
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="live-coach-page">
      <header className="live-coach-header">
        <div className="section-label">In-match walkthrough · R6</div>
        <h1>Live <span className="accent">Coach</span></h1>
        <p>Mirrors the R6 ranked flow: <strong>your stack → map ban → operator ban → round prep</strong>. Tell us who you're queuing with, what the game picked, what got banned — we tell you exactly what to pick and how to play it.</p>
        {(mapId || bans[0].size > 0 || bans[1].size > 0) && (
          <div className="live-coach-header-actions">
            <button
              type="button"
              onClick={shareUrl}
              className="live-coach-share"
              title="Copy a link that re-creates this exact prep view — paste in Discord to share with your squad"
            >
              {shareCopied ? '✓ Link copied' : '🔗 Share with squad'}
            </button>
            <button type="button" onClick={resetMatch} className="live-coach-reset" title="Clear everything and start a new match">
              ↻ New match
            </button>
          </div>
        )}
      </header>

      {/* STEP 1 — Stack size.
          Asked FIRST because the user knows it before they even queue,
          it holds for the whole session, and every op recommendation
          downstream depends on it. Stays expanded after picking so a
          mid-session change (friend joins the stack) is one tap. */}
      <Step
        id="step-queue"
        number={1}
        title="Who are you queuing with?"
        done={completed.queue}
        summary={queueSize ? QUEUE_SIZE_LABELS[queueSize] : null}
        subtitle={completed.queue ? undefined : 'Pick your stack size — op recommendations depend on it'}
      >
        <div className="live-coach-map-grid compact">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`live-coach-map-btn${queueSize === n ? ' active' : ''}`}
              onClick={() => {
                setQueueSize(n)
                track('Live Coach Queue Pick', { queueSize: n })
                if (!mapId) setTimeout(() => scrollToStep('map'), 100)
              }}
            >
              {QUEUE_SIZE_LABELS[n]}
            </button>
          ))}
        </div>
        {queueSize && (
          <p className="live-coach-queue-advice">
            <strong>{QUEUE_SIZE_LABELS[queueSize]}:</strong> {QUEUE_ADVICE[queueSize]}
          </p>
        )}
      </Step>

      {/* STEP 2 — Map ban phase result.
          In real R6 ranked, you don't PICK the map — the map ban phase
          decides it. This step is the user REPORTING which map the game
          locked in. Copy + layout reflect that: compact grid, "tap which
          one survived the ban" framing. */}
      {queueSize && (
      <Step
        id="step-map"
        number={2}
        title="Map ban phase — which map locked in?"
        done={completed.map}
        summary={map?.name}
        subtitle={completed.map ? undefined : 'Tap the map the game picked after both teams banned'}
      >
        <div className="live-coach-map-grid compact">
          {LIVE_COACH_MAPS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`live-coach-map-btn${mapId === m.id ? ' active' : ''}`}
              onClick={() => {
                setMapId(m.id)
                setSiteId(null)
                setSelectedOpName(null)
                track('Live Coach Map Pick', { mapId: m.id })
                setTimeout(() => scrollToStep('bans'), 100)
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </Step>
      )}

      {/* STEP 3 — Operator ban phase.
          R6 ranked has TWO ban phases per match — one before round 1
          (covers rounds 1-3 on the first side) and a fresh ban phase at
          half-time (covers rounds 4-6 on the swapped side). OT inherits
          bans from the matching half. We track both sets via the tabs. */}
      {queueSize && map && (
        <Step
          id="step-bans"
          number={3}
          title="Operator ban phase — what's banned?"
          done={completed.bans}
          summary={completed.bans
            ? `H1: ${bans[0].size > 0 ? [...bans[0]].join(', ') : '—'} · H2: ${bans[1].size > 0 ? [...bans[1]].join(', ') : '—'}`
            : null}
          subtitle="Tap each operator the enemy team banned. R6 has 2 ban phases (sides swap at round 3) — fill Half 1 first, set Half 2 at half-time. OT carries over the previous half's bans."
        >
          <div className="live-coach-half-tabs">
            <button
              type="button"
              className={`live-coach-half-tab${activeHalf === 1 ? ' active' : ''}`}
              onClick={() => setActiveHalf(1)}
            >
              <strong>Half 1</strong>
              <span>Rounds 1-3 · {bans[0].size} bans</span>
            </button>
            <button
              type="button"
              className={`live-coach-half-tab${activeHalf === 2 ? ' active' : ''}`}
              onClick={() => setActiveHalf(2)}
            >
              <strong>Half 2</strong>
              <span>Rounds 4-6 · {bans[1].size} bans</span>
            </button>
          </div>
          <BanGrid mapId={mapId} bans={activeBans} onToggle={toggleBan} suggestions={banSuggestions} />
        </Step>
      )}

      {/* STEP 4 — Round prep (re-runs every round) */}
      {queueSize && map && (
        <Step
          id="step-round"
          number={4}
          title="Round prep — side, site + spawn"
          done={completed.sideSite}
          summary={completed.sideSite
            ? `H${activeHalf} · ${side === 'attack' ? 'Attack' : 'Defense'} · ${map.sites.find((s) => s.id === siteId)?.name} · ${QUEUE_SIZE_LABELS[queueSize]}`
            : null}
          subtitle={completed.sideSite ? undefined : 'Set these once per round — the recommendations update live as you change them.'}
        >
          <div className="live-coach-row">
            <div className="live-coach-toggle-group">
              <span className="live-coach-toggle-label">Side</span>
              <button
                type="button"
                className={`live-coach-toggle ${side === 'attack' ? 'active attack' : ''}`}
                onClick={() => setSide('attack')}
              >
                Attack
              </button>
              <button
                type="button"
                className={`live-coach-toggle ${side === 'defense' ? 'active defense' : ''}`}
                onClick={() => setSide('defense')}
              >
                Defense
              </button>
            </div>

          </div>

          <div className="live-coach-site-section">
            <div className="live-coach-toggle-label">Bomb site</div>
            {/* Recommended site banner — surfaces the site where the
                fewest essential ops got banned. Calling this site means
                your team can actually run the meta plan; calling a "hard"
                site means you're forced into suboptimal picks. */}
            {recommendedSite && recommendedSiteDifficulty?.level === 'easy' && activeBans.size > 0 && (
              <div className="live-coach-site-rec easy">
                <span className="live-coach-site-rec-label">★ Best call this round</span>
                <span><strong>{recommendedSite.name}</strong> — all essential ops available</span>
              </div>
            )}
            {recommendedSite && recommendedSiteDifficulty?.level === 'standard' && activeBans.size > 0 && (
              <div className="live-coach-site-rec standard">
                <span className="live-coach-site-rec-label">★ Best call this round</span>
                <span><strong>{recommendedSite.name}</strong> — {recommendedSiteDifficulty.bannedNames.join(' / ')} banned, the rest of your meta works here</span>
              </div>
            )}
            <div className="live-coach-site-grid">
              {sortedSites.map((s) => {
                const diff = siteDifficulty[s.id]
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`live-coach-site-btn${siteId === s.id ? ' active' : ''} difficulty-${diff?.level || 'unknown'}`}
                    onClick={() => {
                      setSiteId(s.id)
                      track('Live Coach Site Pick', { mapId, siteId: s.id, side, difficulty: diff?.level })
                      setTimeout(() => scrollToStep('op'), 100)
                    }}
                  >
                    <div className="live-coach-site-btn-row">
                      <strong>{s.name}</strong>
                      {diff && diff.level !== 'unknown' && activeBans.size > 0 && (
                        <span className={`live-coach-site-diff diff-${diff.level}`} title={diff.banned > 0 ? `${diff.banned} essential ops banned: ${diff.bannedNames.join(', ')}` : 'No essential ops banned'}>
                          {diff.level === 'easy' ? '● Easy' : diff.level === 'standard' ? '● Standard' : '● Hard'}
                        </span>
                      )}
                    </div>
                    {s.floor && <span className="live-coach-site-floor">{s.floor}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Spawn pick — attack only. In the real game the spawn choice
              comes right after the ban phase (you lock it alongside your
              op), so it lives here in round prep, not buried in the final
              loadout card. Sourced from the site's curated attackSpawns;
              silently absent for sites without that content yet. */}
          {side === 'attack' && siteId && Array.isArray(stratForSide?.premiumTactics?.attackSpawns) && stratForSide.premiumTactics.attackSpawns.length > 0 && (
            <div className="live-coach-site-section">
              <div className="live-coach-toggle-label">
                Spawn pick — hitting {map.sites.find((s) => s.id === siteId)?.name}
              </div>
              <ul className="live-coach-util-list">
                {stratForSide.premiumTactics.attackSpawns.slice(0, 3).map((sp) => (
                  <li key={sp.spawn}>
                    <strong>{sp.spawn}</strong> — {sp.use}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Step>
      )}

      {/* STEP 5 — Operator pick (the system's recommendation) */}
      {queueSize && map && siteId && (
        <Step
          id="step-op"
          number={5}
          title="Your op pick — recommended for this round"
          done={completed.operator}
          summary={selectedOpName}
          subtitle={recommendedOps.length === 0
            ? 'No recommendations — adjust queue size or clear bans'
            : `${recommendedOps.length} ops survive your bans + queue filter. Tap one to lock and see its loadout.`}
        >
          {/* Team-comp suggestion — only renders for 3+ stacks. Lets the
              shot-caller see the whole coordinated lineup and call it
              out in voice before everyone locks ops. The user still
              picks THEIR op from the individual grid below; this is
              the "tell teammates what to run" view. */}
          {teamComp.length > 0 && (
            <div className="live-coach-comp">
              <div className="live-coach-comp-head">
                <span className="live-coach-comp-eyebrow">★ Suggested {QUEUE_SIZE_LABELS[queueSize] || `${queueSize}-stack`} comp</span>
                <span className="live-coach-comp-sub">Coordinate in voice — call these ops before anyone locks. Skip ops you can't fill.</span>
              </div>
              <div className="live-coach-comp-row">
                {teamComp.map((op) => {
                  const isMine = op.name === selectedOpName
                  return (
                    <button
                      key={op.name}
                      type="button"
                      className={`live-coach-comp-slot${isMine ? ' mine' : ''}`}
                      onClick={() => {
                        setSelectedOpName(op.name)
                        track('Live Coach Comp Pick', { mapId, siteId, side, opName: op.name, queueSize })
                        setTimeout(() => scrollToStep('loadout'), 100)
                      }}
                      title={`Tap to lock ${op.name} as your op`}
                    >
                      <div className="live-coach-comp-bucket">{op.bucketLabel}</div>
                      <div className="live-coach-comp-name">{op.name}</div>
                      <div className={`live-coach-comp-priority priority-${op.priority || 'flex'}`}>
                        {op.priority}
                      </div>
                      {isMine && <div className="live-coach-comp-mine-badge">YOU</div>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {recommendedOps.length > 0 ? (
            <>
              {teamComp.length > 0 && (
                <div className="live-coach-op-divider">
                  {selectedOpName ? 'Or pick a different op for your slot' : 'All recommended picks (filtered to your queue size)'}
                </div>
              )}
              <div className="live-coach-op-grid">
                {recommendedOps.map((op) => (
                  <button
                    key={op.name}
                    type="button"
                    className={`live-coach-op-btn priority-${op.priority || 'flex'}${selectedOpName === op.name ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedOpName(op.name)
                      track('Live Coach Op Pick', { mapId, siteId, side, opName: op.name })
                      setTimeout(() => scrollToStep('loadout'), 100)
                    }}
                  >
                    <div className="live-coach-op-name">{op.name}</div>
                    <div className="live-coach-op-role">{op.role}</div>
                    <div className={`live-coach-op-priority priority-${op.priority || 'flex'}`}>
                      {op.priority}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="live-coach-empty-block">
              All operators for this site are filtered out. Try lifting some bans or bumping the queue size.
            </div>
          )}
        </Step>
      )}

      {/* STEP 6 — Loadout + Site setup combined */}
      {queueSize && map && siteId && selectedOpName && stratForSide && (
        <Step
          id="step-loadout"
          number={6}
          title="Your loadout + site setup"
          done={false}
          isFinal
        >
          <div className="live-coach-final-grid">
            <div className="live-coach-loadout-card">
              <div className="live-coach-card-eyebrow">Loadout — {selectedOpName}</div>
              {loadout ? (
                <>
                  <div className="live-coach-loadout-row">
                    <span className="live-coach-loadout-label">Primary</span>
                    <span>{loadout.primary}</span>
                  </div>
                  <div className="live-coach-loadout-row">
                    <span className="live-coach-loadout-label">Secondary</span>
                    <span>{loadout.secondary}</span>
                  </div>
                  <div className="live-coach-loadout-row">
                    <span className="live-coach-loadout-label">Gadget</span>
                    <span>{loadout.gadget}</span>
                  </div>
                  {loadout.secondary_gadget && (
                    <div className="live-coach-loadout-row">
                      <span className="live-coach-loadout-label">2nd gadget</span>
                      <span>{loadout.secondary_gadget}</span>
                    </div>
                  )}
                  {loadout.why && (
                    <div className="live-coach-loadout-why">
                      <strong>Why:</strong> {loadout.why}
                    </div>
                  )}
                  {loadout.counter_picks && (
                    <div className="live-coach-loadout-counter">
                      <strong>Watch out:</strong> {loadout.counter_picks}
                    </div>
                  )}
                </>
              ) : (
                <div className="live-coach-empty-line">
                  No curated loadout for {selectedOpName} yet —{' '}
                  <Link to={`/operators/${encodeURIComponent(selectedOpName.toLowerCase())}`}>
                    open the operator page →
                  </Link>
                </div>
              )}
            </div>

            <div className="live-coach-setup-card">
              <div className="live-coach-card-eyebrow">
                Site setup — {map.sites.find((s) => s.id === siteId)?.name} · {side === 'attack' ? 'Attack' : 'Defense'}
              </div>
              <div className="live-coach-setup-section">
                <div className="live-coach-setup-title">The plan</div>
                <p>{stratForSide.strategy}</p>
              </div>
              {Array.isArray(stratForSide.callouts) && stratForSide.callouts.length > 0 && (
                <div className="live-coach-setup-section">
                  <div className="live-coach-setup-title">Key callouts</div>
                  <div className="live-coach-callout-row">
                    {stratForSide.callouts.slice(0, 8).map((c) => (
                      <span key={c} className="live-coach-callout-pill">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(stratForSide.utility) && stratForSide.utility.length > 0 && (
                <div className="live-coach-setup-section">
                  <div className="live-coach-setup-title">{side === 'attack' ? 'Utility priorities' : 'Reinforce / defend'}</div>
                  <ul className="live-coach-util-list">
                    {stratForSide.utility.slice(0, 4).map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}
              {/* Spawn-kill / runout note from premium tactics, when curated */}
              {side === 'attack' && Array.isArray(stratForSide.premiumTactics?.spawnKillSpots) && stratForSide.premiumTactics.spawnKillSpots.length > 0 && (
                <div className="live-coach-setup-section live-coach-spawn-kill">
                  <div className="live-coach-setup-title">Spawn-kill watch</div>
                  <ul className="live-coach-util-list">
                    {stratForSide.premiumTactics.spawnKillSpots.slice(0, 2).map((sk, i) => (
                      <li key={i}>
                        <strong>{sk.from}</strong> → {sk.target}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {side === 'defense' && Array.isArray(stratForSide.premiumTactics?.runouts) && stratForSide.premiumTactics.runouts.length > 0 && (
                <div className="live-coach-setup-section live-coach-spawn-kill">
                  <div className="live-coach-setup-title">Runout windows</div>
                  <ul className="live-coach-util-list">
                    {stratForSide.premiumTactics.runouts.slice(0, 2).map((r, i) => (
                      <li key={i}>
                        <strong>{r.from}</strong> → {r.target}
                        {r.timing && <span style={{ opacity: 0.7 }}> ({r.timing})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="live-coach-deep-link">
                <Link to={`/strats/${mapId}/${siteId}/${side}`}>
                  Open full {map.sites.find((s) => s.id === siteId)?.name} strat →
                </Link>
              </div>
            </div>
          </div>

          <div className="live-coach-round-controls">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                // Flip side for next round, keep map + bans + queue
                setSide(side === 'attack' ? 'defense' : 'attack')
                setSiteId(null)
                setSelectedOpName(null)
                track('Live Coach Round Flip', { newSide: side === 'attack' ? 'defense' : 'attack' })
                setTimeout(() => scrollToStep('round'), 200)
              }}
            >
              Next round ({side === 'attack' ? 'defense' : 'attack'}) →
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSiteId(null)
                setSelectedOpName(null)
                setTimeout(() => scrollToStep('round'), 100)
              }}
            >
              Same side, different site →
            </button>
            {/* Half-swap CTA — surfaces when we're in H1 to remind that
                bans + sides flip at round 6. Once in H2 it changes to
                offer a swap back (in case the user mistapped). */}
            {activeHalf === 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ffc97a', color: '#0a0f19', borderColor: '#ffc97a' }}
                onClick={() => switchToHalf(2)}
                title="Sides swap at round 3 — set up Half 2 bans"
              >
                Round 3 done → switch to H2 (set new bans) →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => switchToHalf(1)}
                title="Go back to Half 1 (overtime or mistap)"
                style={{ opacity: 0.7 }}
              >
                ← Back to Half 1 bans (overtime / mistap)
              </button>
            )}
          </div>
        </Step>
      )}

      <footer className="live-coach-foot">
        <Link to="/match-prep">Need the full one-page cheatsheet? Open Match Prep →</Link>
      </footer>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

function Step({ id, number, title, subtitle, done, summary, isFinal, children }) {
  return (
    <section
      id={id}
      className={`live-coach-step${done ? ' done' : ''}${isFinal ? ' final' : ''}`}
    >
      <header className="live-coach-step-head">
        <div className="live-coach-step-num">{done ? '✓' : number}</div>
        <div className="live-coach-step-title">
          <h2>{title}</h2>
          {summary && <span className="live-coach-step-summary">{summary}</span>}
          {subtitle && !summary && <span className="live-coach-step-subtitle">{subtitle}</span>}
        </div>
      </header>
      <div className="live-coach-step-body">{children}</div>
    </section>
  )
}

function BanGrid({ mapId: _mapId, bans, onToggle, suggestions }) {
  // Most matches ban from the curated suggestion buttons (one tap). For the
  // rarer "enemy banned something off-meta" case, a native DROPDOWN of the
  // full roster — NOT a text field. Mid-match the user is holding a controller
  // with ~45 seconds of prep; typing an operator name is a non-starter. A
  // native <select> is a fast scroll-pick on console/mobile and a click-list
  // on desktop. Already-banned ops are filtered out so a pick always ADDS
  // (removal happens via the chips below), avoiding an accidental toggle-off.

  const attackBans = suggestions?.attack || []
  const defenseBans = suggestions?.defense || []

  return (
    <div className="live-coach-bans">
      <div className="live-coach-bans-col">
        <div className="live-coach-bans-label attack">Common attack bans</div>
        {attackBans.map((b) => (
          <button
            key={`atk-${b.name}`}
            type="button"
            className={`live-coach-ban-btn${bans.has(b.name) ? ' banned' : ''}`}
            onClick={() => onToggle(b.name)}
          >
            <strong>{b.name}</strong>
            <span>{b.reason.split('.')[0]}.</span>
          </button>
        ))}
      </div>
      <div className="live-coach-bans-col">
        <div className="live-coach-bans-label defense">Common defense bans</div>
        {defenseBans.map((b) => (
          <button
            key={`def-${b.name}`}
            type="button"
            className={`live-coach-ban-btn${bans.has(b.name) ? ' banned' : ''}`}
            onClick={() => onToggle(b.name)}
          >
            <strong>{b.name}</strong>
            <span>{b.reason.split('.')[0]}.</span>
          </button>
        ))}
      </div>
      <div className="live-coach-bans-custom">
        <label htmlFor="live-coach-ban-picker">
          <span>Other ban (any operator) — tap to pick, no typing:</span>
          <select
            id="live-coach-ban-picker"
            className="live-coach-ban-select"
            value=""
            onChange={(e) => { if (e.target.value) onToggle(e.target.value) }}
          >
            <option value="">Pick an operator…</option>
            <optgroup label="Attackers">
              {ALL_ATTACKERS.filter((n) => !bans.has(n)).map((n) => (
                <option key={`atk-opt-${n}`} value={n}>{n}</option>
              ))}
            </optgroup>
            <optgroup label="Defenders">
              {ALL_DEFENDERS.filter((n) => !bans.has(n)).map((n) => (
                <option key={`def-opt-${n}`} value={n}>{n}</option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>
      {bans.size > 0 && (
        <div className="live-coach-bans-active">
          <span>Banned this match:</span>
          {[...bans].map((name) => (
            <button
              key={`active-${name}`}
              type="button"
              className="live-coach-ban-chip"
              onClick={() => onToggle(name)}
              title="Click to remove"
            >
              {name} ×
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
