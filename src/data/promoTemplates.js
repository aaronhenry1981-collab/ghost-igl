// Data-driven promo post generator.
// Uses actual strats, ops, meta, bans data so posts sound like a competitive R6
// player, not marketing slop. Each post is a self-contained function that takes
// a seed and returns { channel, subject, body, whyItWorks, cta }.

import MAPS from './maps'
import STRATS from './strats'
import OPERATORS from './operators'
import META from './meta'
import BANS from './bans'

const SITE_URL = 'https://r6coaching.com'

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length]
}

function firstSentence(text) {
  if (!text) return ''
  const m = text.match(/[^.!?]+[.!?]/)
  return m ? m[0].trim() : text.trim()
}

// Deterministic seeded integer from any string + number
function seedInt(seed, offset = 0) {
  let h = 2166136261 + offset
  const s = String(seed)
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0
  return h
}

function rankedMapsWithStrats() {
  return MAPS.filter((m) => m.rankedPool && !m.comingSoon && STRATS[m.id])
}

function sitesWithStrats(map) {
  return map.sites.filter((s) => STRATS[map.id]?.[s.id])
}

// ─── Discord templates ───

function discordTacticalTip(seed) {
  const maps = rankedMapsWithStrats()
  const map = pick(maps, seedInt(seed, 1))
  const sites = sitesWithStrats(map)
  const site = pick(sites, seedInt(seed, 2))
  const side = seedInt(seed, 3) % 2 === 0 ? 'attack' : 'defense'
  const strat = STRATS[map.id]?.[site.id]?.[side]
  if (!strat) return null
  const essentials = strat.operators.filter((o) => o.priority === 'essential').map((o) => o.name)
  const body = [
    `**${side === 'attack' ? 'Attacking' : 'Defending'} ${map.name} ${site.name}?**`,
    `Lock in: **${essentials.join(', ')}**.`,
    firstSentence(strat.strategy),
    ``,
    `Full callouts + utility breakdown (free): ${SITE_URL}/guides/${map.id}.html`,
  ].join('\n')
  return {
    channel: 'discord',
    subject: `${map.name} · ${site.name} · ${side}`,
    body,
    whyItWorks: 'Concrete tactical value first (real ops + strategy sentence), soft link after. Not a sales post — a free tip that proves the product has depth.',
  }
}

function discordPollOfTheDay(seed) {
  const banOpEntries = META.banBoard.slice(0, 8)
  const a = pick(banOpEntries, seedInt(seed, 4))
  const b = pick(banOpEntries.filter((e) => e.name !== a.name), seedInt(seed, 5))
  const body = [
    `**Priority ban check** — on defense, who goes first:`,
    ``,
    `🔨  **${a.name}** — ${firstSentence(a.sampleReasons[0]?.reason || '')}`,
    `🛡️  **${b.name}** — ${firstSentence(b.sampleReasons[0]?.reason || '')}`,
    ``,
    `Full ban reasoning per map: ${SITE_URL}/meta`,
  ].join('\n')
  return {
    channel: 'discord',
    subject: `Ban poll: ${a.name} vs ${b.name}`,
    body,
    whyItWorks: 'Engagement bait with specific ops. Sparks debate in voice/chat. Link shows aggregated meta data, not a pricing page.',
  }
}

function discordGuideDrop(seed) {
  const maps = rankedMapsWithStrats()
  const map = pick(maps, seedInt(seed, 6))
  const siteCount = sitesWithStrats(map).length
  const bans = BANS[map.id]
  const hasBans = (bans?.attack?.length || 0) + (bans?.defense?.length || 0) > 0
  const body = [
    `Dropped a free strat writeup for **${map.name}**:`,
    `• ${siteCount} bomb sites, attack + defense`,
    `• Operator picks with priority tiers (essential / recommended / flex)`,
    `• Full callout lists + utility usage`,
    hasBans ? `• Ban recommendations with reasoning per side` : null,
    ``,
    `No signup, no paywall: ${SITE_URL}/guides/${map.id}.html`,
  ].filter(Boolean).join('\n')
  return {
    channel: 'discord',
    subject: `Free ${map.name} guide drop`,
    body,
    whyItWorks: 'Value-first announcement. No signup friction, drives traffic to SEO guide pages.',
  }
}

function discordOperatorSpotlight(seed) {
  const topOps = META.opBoard.slice(0, 10)
  const op = pick(topOps, seedInt(seed, 7))
  const essentialSites = op.sites?.filter((s) => s.priority === 'essential') ||
    OPERATORS.find((o) => o.name === op.name)?.sites.filter((s) => s.priority === 'essential') || []
  const sampleSites = essentialSites.slice(0, 3).map((s) => `${s.mapName} (${s.siteName}, ${s.side})`).join(', ')
  const body = [
    `**${op.name} spotlight** — essential on **${op.essential}** sites across the ranked pool.`,
    `Top sites to pick them: ${sampleSites}.`,
    ``,
    `Every map ${op.name} shows up on: ${SITE_URL}/operators/${encodeURIComponent(op.name.toLowerCase())}`,
  ].join('\n')
  return {
    channel: 'discord',
    subject: `${op.name} — essential on ${op.essential} sites`,
    body,
    whyItWorks: 'Specific count + specific sites = credibility. Link to operator detail page, not landing.',
  }
}

// ─── Reddit templates (r/Rainbow6) ───

function redditValueQuestion(_seed) {
  const top3 = META.opBoard.slice(0, 3)
  const body = [
    `Been building a tool that indexes operator essential-pick frequency across the ranked pool. Current top 3:`,
    ``,
    ...top3.map((o, i) => `${i + 1}. **${o.name}** — essential on ${o.essential} sites (${o.role})`),
    ``,
    `Curious what you all think — who's missing from the top, or who shouldn't be there? The data's pulled from per-site default lineups I've been writing up.`,
    ``,
    `For anyone wanting the full leaderboard: ${SITE_URL}/meta`,
  ].join('\n')
  return {
    channel: 'reddit',
    subject: `What's your take on the current "essential" op tier?`,
    body,
    whyItWorks: 'Genuine discussion opener, not a link drop. Reddit mods + voters kill overt promo but reward data + genuine questions. Link at end is referenced as "for anyone wanting" not a CTA.',
  }
}

function redditGuideWriteup(seed) {
  const maps = rankedMapsWithStrats()
  const map = pick(maps, seedInt(seed, 8))
  const sites = sitesWithStrats(map)
  const siteList = sites.map((s) => `- **${s.floor} ${s.name}**`).join('\n')
  const body = [
    `Wrote up a full ${map.name} strat breakdown — figured I'd share since it comes up a lot in coaching DMs.`,
    ``,
    `Covers:`,
    siteList,
    ``,
    `Each site has attack + defense default lineups (essential/recommended/flex), the key strategy for the side, callouts, and utility placement. Also ban recs per side.`,
    ``,
    `Here's the link: ${SITE_URL}/guides/${map.id}.html`,
    ``,
    `Open to pushback on any of the picks — I update the writeups each season.`,
  ].join('\n')
  return {
    channel: 'reddit',
    subject: `[Guide] ${map.name} default strats — every site, every side`,
    body,
    whyItWorks: 'Reads like a community contribution, not an ad. "Open to pushback" invites engagement. Season-update note signals ongoing maintenance.',
  }
}

// ─── Twitter / X templates ───

function twitterMetaThread(_seed) {
  const top5 = META.opBoard.slice(0, 5)
  const top3Bans = META.banBoard.slice(0, 3)
  const body = [
    `R6 ranked meta at a glance 🧵`,
    ``,
    `Top 5 essentials (across ${META.totals.rankedMaps} ranked maps):`,
    ...top5.map((o, i) => `${i + 1}. ${o.name} — ${o.essential} sites`),
    ``,
    `Top 3 priority bans:`,
    ...top3Bans.map((o, i) => `${i + 1}. ${o.name}`),
    ``,
    `Full breakdown: ${SITE_URL}/meta`,
  ].join('\n')
  return {
    channel: 'twitter',
    subject: `Ranked meta snapshot`,
    body,
    whyItWorks: 'Tight, scannable, data-heavy. Twitter favors listicles. Shows aggregate data only the product has.',
  }
}

function twitterQuickTip(seed) {
  const maps = rankedMapsWithStrats()
  const map = pick(maps, seedInt(seed, 9))
  const sites = sitesWithStrats(map)
  const site = pick(sites, seedInt(seed, 10))
  const strat = STRATS[map.id]?.[site.id]?.attack
  if (!strat) return null
  const essential = strat.operators.find((o) => o.priority === 'essential')
  const callout = strat.callouts?.[0]
  const body = [
    `${map.name} ${site.name} attack: lock in ${essential?.name || 'a hard breacher'}.`,
    `First callout to clear on drone: ${callout || 'check spawn-peeks'}.`,
    `Full site: ${SITE_URL}/guides/${map.id}.html`,
  ].join('\n')
  return {
    channel: 'twitter',
    subject: `Quick tip: ${map.name} ${site.name}`,
    body,
    whyItWorks: 'Under 280 chars, one specific actionable tip, one link. No hashtags (cringe signal on R6 Twitter).',
  }
}

// ─── YouTube comment templates (under R6 coach videos) ───

function youtubeValueComment(seed) {
  const maps = rankedMapsWithStrats()
  const map = pick(maps, seedInt(seed, 11))
  const sites = sitesWithStrats(map)
  const site = pick(sites, seedInt(seed, 12))
  const strat = STRATS[map.id]?.[site.id]?.defense
  if (!strat) return null
  const anchor = strat.operators.find((o) => o.priority === 'essential')
  const body = [
    `Solid breakdown. One addition I'd make for ${map.name} ${site.name} defense: ${anchor?.name} is the anchor you want — ${anchor?.role}.`,
    `I've been tracking which ops show up as essentials across every site at r6coaching.com (not my channel, just a project I built).`,
  ].join(' ')
  return {
    channel: 'youtube',
    subject: `On a ${map.name} video`,
    body,
    whyItWorks: 'Adds to the creator\'s content (gives a specific anchor tip), casually mentions the project without URL tracking. YouTube punishes link spam.',
  }
}

// ─── Public registry ───
//
// Each generator takes a seed (any string) and returns a post or null if it
// couldn't find valid data. Callers loop over a seed list to get variety.

const GENERATORS = [
  // Discord: 4 distinct templates
  { id: 'discord-tip', channel: 'discord', label: 'Tactical tip', gen: discordTacticalTip },
  { id: 'discord-poll', channel: 'discord', label: 'Ban poll', gen: discordPollOfTheDay },
  { id: 'discord-guide', channel: 'discord', label: 'Guide drop', gen: discordGuideDrop },
  { id: 'discord-op', channel: 'discord', label: 'Operator spotlight', gen: discordOperatorSpotlight },
  // Reddit: 2 templates (reddit rewards quality, not volume)
  { id: 'reddit-q', channel: 'reddit', label: 'Value question', gen: redditValueQuestion },
  { id: 'reddit-guide', channel: 'reddit', label: 'Guide writeup', gen: redditGuideWriteup },
  // Twitter: 2 templates
  { id: 'twitter-meta', channel: 'twitter', label: 'Meta thread', gen: twitterMetaThread },
  { id: 'twitter-tip', channel: 'twitter', label: 'Quick tip', gen: twitterQuickTip },
  // YouTube: 1 template (high-value comments only, high friction)
  { id: 'youtube-value', channel: 'youtube', label: 'Value comment', gen: youtubeValueComment },
]

export const CHANNELS = [
  { id: 'discord', label: 'Discord', icon: '💬', tip: 'Paste into r/Rainbow6 community servers. Discord rewards specificity — these use real ops + real callouts.' },
  { id: 'reddit', label: 'Reddit', icon: '🗨️', tip: 'r/Rainbow6 kills promo posts. These are framed as community contributions — expect to respond in comments.' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦', tip: 'Short, data-heavy, no hashtags. R6 Twitter hates hashtag stacks.' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', tip: 'Post under R6 coach videos as value-add comments. Never drop naked links — YouTube shadowbans them.' },
]

export function generatePosts({ channel = null, seed = Date.now().toString() } = {}) {
  const gens = channel ? GENERATORS.filter((g) => g.channel === channel) : GENERATORS
  return gens
    .map((g, idx) => {
      const post = g.gen(`${seed}-${idx}`)
      return post ? { id: `${g.id}-${idx}-${seed}`, templateId: g.id, templateLabel: g.label, ...post } : null
    })
    .filter(Boolean)
}

export default generatePosts
