// Title, description, canonical URL and robots rule for every route the app
// serves. One table, two readers:
//   - scripts/generate-route-shells.mjs writes a copy of index.html per route
//     with this head, so crawlers that don't run JavaScript see the right page
//     name (the CloudFront router serves the matching shell);
//   - hooks/useRouteMeta.js applies the same head on client-side navigation.
// Titles render at 30-60 characters and descriptions at 110-160;
// routeMeta.test.mjs fails the build if any route drifts outside them.
// Facts (prices, map counts, free maps) come from planFacts, never typed.
import MAPS from '../data/maps.js'
import STRATS from '../data/public-strats.generated.js'
import { FREE_MAPS, MAP_COUNT, PLAN_FACTS } from './planFacts.js'

export const SITE_URL = 'https://r6coaching.com'
const SUFFIX = ' | Recon 6'

const usd = (n) => `$${n}`
const pro = PLAN_FACTS.pro
const elite = PLAN_FACTS.elite
const champion = PLAN_FACTS.champion
const freeList = FREE_MAPS.map((m) => m.name)
const freeComma = freeList.join(', ')
const freeAnd = freeList.join(' and ')

// The first candidate that fits wins; the last one is the fallback.
function fit(candidates, min, max) {
  return candidates.find((c) => c.length >= min && c.length <= max) || candidates[candidates.length - 1]
}
const title = (...candidates) => fit(candidates, 30, 60)
const description = (...candidates) => fit(candidates, 110, 160)

// "CEO Office / Executive Lounge" -> "CEO Office"; when two sites on a map
// share that first room ("Piano Room / Kitchen"), both rooms are named.
function siteLabel(map, site) {
  const first = (s) => String(s.name).split(' / ')[0]
  const shared = map.sites.some((other) => other.id !== site.id && first(other) === first(site))
  return shared ? String(site.name).replace(' / ', ' & ') : first(site)
}
const sideLabel = (side) => (side === 'attack' ? 'Attack' : 'Defense')

// Operators in the public plans, with the slug the app links to
// (encodeURIComponent(name.toLowerCase()) in the app; decoded here).
function publicOperators() {
  const names = new Set()
  for (const sites of Object.values(STRATS)) {
    for (const sides of Object.values(sites)) {
      for (const side of ['attack', 'defense']) {
        for (const op of sides?.[side]?.operators || []) names.add(op.name)
      }
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

const LIVE_MAPS = MAPS.filter((m) => !m.comingSoon)

const STATIC = {
  '/': {
    title: 'Recon 6 — AI Rainbow Six Siege Coach: Strats & VOD Review',
    description: 'Rainbow Six Siege coaching and reference tools for map strats, callouts, bans, match preparation, and screenshot-based VOD feedback.',
  },
  '/pricing': {
    title: `Recon 6 Pricing — ${usd(pro.monthlyUsd)}/mo Pro, Free Tier, R6 Coaching Plans`,
    description: description(
      `Basic is free with ${freeAnd}. Pro is ${usd(pro.monthlyUsd)}/mo with ${pro.aiReviewsPerMonth} AI VOD reviews, Elite ${usd(elite.monthlyUsd)}/mo with ${elite.aiReviewsPerMonth}, Champion ${usd(champion.monthlyUsd)}/mo adds two live 1:1 sessions.`,
      `Recon 6 plans: Basic is free, Pro is ${usd(pro.monthlyUsd)}/mo, Elite ${usd(elite.monthlyUsd)}/mo and Champion ${usd(champion.monthlyUsd)}/mo. Compare AI VOD reviews, the desktop coach and live sessions.`,
    ),
  },
  '/about': {
    title: 'About Recon 6 — Founder Aaron Henry and How It Works',
    description: 'Recon 6 is a Rainbow Six Siege coaching tool built independently by Aaron Henry in Texas. See how the plans are made and how to reach him.',
  },
  '/strats': {
    title: title(`Free R6 Siege Map Strats — ${freeComma} & More${SUFFIX}`, `Free R6 Siege Map Strats${SUFFIX}`),
    description: description(
      `Attack and defense plans for ${MAP_COUNT} Rainbow Six Siege maps: operator jobs, callouts and utility for every site. ${freeAnd} are free to open.`,
      `Attack and defense plans for ${MAP_COUNT} Rainbow Six Siege maps: operator jobs, callouts and utility for every site.`,
    ),
  },
  '/match-prep': {
    title: `R6 Siege Match Prep for Solo, Duo or Full Stack${SUFFIX}`,
    description: 'Pick a Rainbow Six Siege map once and Recon 6 puts the ban, the first operator choice and the next site action at the top of one plan.',
  },
  '/loadouts': {
    title: `Rainbow Six Siege Loadout Builder${SUFFIX}`,
    description: 'Pick a Rainbow Six Siege operator role to see the weapon, gadget, counter and the reason behind each setup, then go back to your round plan.',
  },
  '/operators': {
    title: `R6 Siege Operators: Roles and the Sites They Fit${SUFFIX}`,
    description: "Every Rainbow Six Siege operator in Recon 6's plans, with the jobs they fill and the map sites where the attack and defense plans use them.",
  },
  '/operators/compare': {
    title: `Compare Rainbow Six Siege Operators Side by Side${SUFFIX}`,
    description: "Put two Rainbow Six Siege operators next to each other and see their roles and the maps and sites where Recon 6's plans pick each one.",
  },
  '/meta': {
    title: `R6 Siege Meta: Most-Used Operators in Our Plans${SUFFIX}`,
    description: "Which Rainbow Six Siege operators come up most often as essential picks across Recon 6's attack and defense plans for the ranked map pool.",
  },
  '/vod': {
    title: `AI VOD Review for Rainbow Six Siege Screenshots${SUFFIX}`,
    description: `Upload screenshots from a Rainbow Six Siege match and get the mistake, the correction and one thing to practice next game. Pro includes ${pro.aiReviewsPerMonth} a month.`,
  },
  '/live': {
    title: `Live Match Coach for Rainbow Six Siege${SUFFIX}`,
    description: 'One clear instruction for the Rainbow Six Siege round you are playing: stack, bans, side, site and operator, then the setup for that round.',
  },
  '/download': {
    title: `Download Recon 6 Command for Windows${SUFFIX}`,
    description: 'Recon 6 Command is the Windows desktop coach included with paid Pro, Elite and Champion plans. Download the installer and sign in to start.',
  },
  '/changelog': {
    title: `Recon 6 Changelog: New Strats, Fixes and Features`,
    description: 'What changed on Recon 6 and when: new Rainbow Six Siege strats and maps, fixes, and new features for match prep, VOD review and the desktop coach.',
  },
  '/press': {
    title: 'Recon 6 Press Kit: Logos, Facts and Founder Contact',
    description: 'The Recon 6 media kit: what the Rainbow Six Siege coaching platform does, logos and screenshots, the founder bio and how to reach Aaron Henry.',
  },
  '/creator-demo': {
    title: `60-Second Rainbow Six Siege Strategy Demo${SUFFIX}`,
    description: 'Pick the site and side and see a full Rainbow Six Siege round plan in 60 seconds: lineup, operator jobs and execute order your squad can run.',
  },
  '/tools/r6-tier-list': {
    title: `R6 Siege Operator Tier List From Our Site Plans${SUFFIX}`,
    description: "A Rainbow Six Siege operator tier list scored from Recon 6's site plans: essential, recommended and flex picks across the ranked maps.",
  },
  '/beginner-guide': {
    title: `Rainbow Six Siege Beginner Workbook${SUFFIX}`,
    description: 'A Rainbow Six Siege workbook for new players: the habits to build first, what to practice in each match, and how to use Recon 6 plans as you learn.',
  },
  '/terms': {
    title: 'Recon 6 Terms of Service for Members and Visitors',
    description: 'The terms for using Recon 6: accounts, paid Rainbow Six Siege coaching memberships, billing and cancellation, AI review limits and acceptable use.',
  },
  '/privacy': {
    title: 'Recon 6 Privacy Policy: What We Collect and Why',
    description: 'What Recon 6 collects when you use the site and its coaching tools, why, how long it is kept, which services process it, and how to request deletion.',
  },
  '/refund': {
    title: 'Recon 6 Refund Policy: 7-Day Money-Back Terms',
    description: 'How refunds work on Recon 6: request one within seven days of your first paid charge, what the policy covers, and how to cancel a membership.',
  },
  '/help': {
    title: `Recon 6 Help Center: Plans, Billing and Tools${SUFFIX}`,
    description: 'Answers about Recon 6 accounts, memberships and billing, AI VOD review limits, the desktop coach and the Rainbow Six Siege strategy tools.',
  },
  '/start': {
    title: 'Recon 6 — Know Your Job Before Prep Ends',
    description: `Open a free Rainbow Six Siege round plan for ${freeAnd}: the five operator jobs, the site setup and the callouts, before your next match starts.`,
  },
  // Signed-in or utility pages: real titles, kept out of search.
  '/auth': { title: 'Sign In or Create a Free Recon 6 Account', noindex: true },
  '/dashboard': { title: 'Your Recon 6 Dashboard', noindex: true },
  '/progress': { title: 'Road to Champion — Your R6 Progress', noindex: true },
  '/setups': { title: 'Your Rainbow Six Siege Setups', noindex: true },
  '/coach-connect': { title: 'Connect a Coach to Recon 6', noindex: true },
  '/account': { title: 'Your Recon 6 Account and Billing', noindex: true },
  '/activate': { title: 'Activate Recon 6 Command', noindex: true },
  '/support': { title: 'Recon 6 Support', noindex: true },
  '/tiktok': { title: 'Recon 6', noindex: true },
}

// Short paths that the app redirects to a real page.
export const ALIAS_ROUTES = ['/activation', '/desktop', '/desktop-app', '/sign-in', '/signin', '/login', '/signup', '/sign-up', '/register']

// Paths the app accepts with any value: one generic, unindexed shell.
export const OPEN_ROUTE_PREFIXES = ['/r/', '/admin', '/support/cases/', '/help/', '/embed/match-prep/']

function forStratsPath(parts) {
  const map = LIVE_MAPS.find((m) => m.id === parts[0])
  if (!map) return null
  if (parts.length === 1) {
    const names = map.sites.map((s) => siteLabel(map, s)).join(', ')
    return {
      title: title(`${map.name} Strats for R6 Siege: All ${map.sites.length} Sites${SUFFIX}`, `${map.name} Strats for Rainbow Six Siege${SUFFIX}`, `${map.name} R6 Strats${SUFFIX}`),
      description: description(
        `${map.name} attack and defense plans for Rainbow Six Siege: ${names}. Operator jobs, callouts and utility for each site.`,
        `${map.name} attack and defense plans for Rainbow Six Siege, with operator jobs, callouts and utility for every site on the map.`,
        `Rainbow Six Siege ${map.name} attack and defense plans with operator jobs, callouts and utility for every bombsite on the map.`,
      ),
    }
  }
  const site = map.sites.find((s) => s.id === parts[1])
  if (!site) return null
  const s = siteLabel(map, site)
  if (parts.length === 2) {
    return {
      title: title(`${map.name} ${s} Strats: Attack & Defense${SUFFIX}`, `${map.name} ${s} Strats${SUFFIX}`, `${s} on ${map.name}: R6 Strats${SUFFIX}`),
      description: description(
        `Rainbow Six Siege plans for ${site.name} on ${map.name}: the attack execute and the defense setup, with operator jobs and callouts for both sides.`,
        `Rainbow Six Siege plans for ${s} on ${map.name}: the attack execute and the defense setup, with operator jobs and callouts for both sides.`,
      ),
    }
  }
  if (parts.length === 3 && (parts[2] === 'attack' || parts[2] === 'defense')) {
    const side = sideLabel(parts[2])
    const verb = parts[2] === 'attack' ? 'execute' : 'setup'
    return {
      title: title(`${map.name} ${s} ${side} Strat for R6 Siege${SUFFIX}`, `${map.name} ${s} ${side} Strat${SUFFIX}`, `${s} ${side} on ${map.name}${SUFFIX}`, `${map.name} ${side} Strat: ${s}`),
      description: description(
        `The ${side.toLowerCase()} plan for ${site.name} on ${map.name} in Rainbow Six Siege: five operator jobs, the ${verb}, callouts and the utility to bring.`,
        `The ${side.toLowerCase()} plan for ${s} on ${map.name} in Rainbow Six Siege: five operator jobs, the ${verb}, callouts and the utility to bring.`,
      ),
    }
  }
  return null
}

function forMatchPrepPath(mapId) {
  const map = LIVE_MAPS.find((m) => m.id === mapId)
  if (!map) return null
  return {
    title: title(`${map.name} Match Prep for Rainbow Six Siege${SUFFIX}`, `${map.name} Match Prep for R6 Siege${SUFFIX}`, `${map.name} R6 Match Prep${SUFFIX}`),
    description: description(
      `Prep a Rainbow Six Siege match on ${map.name}: the ban, the first operator choice and the next site action at the top, with the full plan underneath.`,
      `Prep a Rainbow Six Siege match on ${map.name}: the ban, the first operator choice and the site action at the top of one plan.`,
    ),
  }
}

function forOperatorPath(slug) {
  const name = publicOperators().find((n) => n.toLowerCase() === slug)
  if (!name) return null
  return {
    title: title(`${name} in Rainbow Six Siege: Roles and Sites${SUFFIX}`, `${name} R6 Siege Guide: Roles and Sites${SUFFIX}`),
    description: description(
      `Where ${name} fits in Rainbow Six Siege: the jobs this operator does in Recon 6's plans and the maps and sites where attack or defense picks them.`,
      `Where ${name} fits in Rainbow Six Siege: the operator's jobs in Recon 6's plans and the maps and sites that pick them.`,
    ),
  }
}

function decodeSafe(value) {
  try { return decodeURIComponent(value) } catch { return value }
}

// The head for a pathname, or null when no route serves it.
export function metaForPath(rawPath) {
  const path = (String(rawPath || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/')
  const canonical = `${SITE_URL}${path === '/' ? '/' : path}`
  const base = (meta, extra = {}) => meta && ({ canonical, noindex: false, ...meta, ...extra })

  if (STATIC[path]) return base(STATIC[path])
  if (ALIAS_ROUTES.includes(path)) return base({ title: 'Recon 6', noindex: true })
  const parts = path.split('/').filter(Boolean).map(decodeSafe)
  if (parts[0] === 'strats') return base(forStratsPath(parts.slice(1)))
  if (parts[0] === 'match-prep' && parts.length === 2) return base(forMatchPrepPath(parts[1]))
  if (parts[0] === 'operators' && parts.length === 2) return base(forOperatorPath(parts[1].toLowerCase()))
  if (OPEN_ROUTE_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p.endsWith('/') ? p : `${p}/`))) {
    return base({ title: parts[0] === 'help' ? STATIC['/help'].title : 'Recon 6', noindex: true })
  }
  return null
}

// Every concrete path that gets its own prerendered head (the build writes
// one shell per entry; open-ended routes share /_shell/app.html).
export function allRoutePaths() {
  const paths = [...Object.keys(STATIC).filter((p) => p !== '/'), ...ALIAS_ROUTES]
  for (const map of LIVE_MAPS) {
    paths.push(`/strats/${map.id}`, `/match-prep/${map.id}`)
    for (const site of map.sites) {
      paths.push(`/strats/${map.id}/${site.id}`, `/strats/${map.id}/${site.id}/attack`, `/strats/${map.id}/${site.id}/defense`)
    }
  }
  for (const name of publicOperators()) paths.push(`/operators/${name.toLowerCase()}`)
  return paths
}
