import crypto from 'node:crypto'
import MAPS from './maps.mjs'

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || ''
const INFO_URL = process.env.SITE_URL || 'https://r6coaching.com'

// Discord interaction response types
const PONG = 1
const CHANNEL_MESSAGE = 4

function verifyEd25519(rawBody, signatureHex, timestamp) {
  if (!PUBLIC_KEY) return false
  try {
    const publicKeyDer = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'), // Ed25519 SPKI prefix
      Buffer.from(PUBLIC_KEY, 'hex'),
    ])
    const keyObject = crypto.createPublicKey({ key: publicKeyDer, format: 'der', type: 'spki' })
    const signatureBuf = Buffer.from(signatureHex, 'hex')
    const messageBuf = Buffer.from(timestamp + rawBody)
    return crypto.verify(null, messageBuf, keyObject, signatureBuf)
  } catch (err) {
    console.error('Signature verify error:', err)
    return false
  }
}

export async function handler(event) {
  const method = event.requestContext?.http?.method
  if (method !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const rawBody = event.body || ''
  const signature = event.headers?.['x-signature-ed25519']
  const timestamp = event.headers?.['x-signature-timestamp']

  if (!signature || !timestamp) {
    return { statusCode: 401, body: 'Missing signature headers' }
  }

  if (!verifyEd25519(rawBody, signature, timestamp)) {
    return { statusCode: 401, body: 'Invalid signature' }
  }

  let interaction
  try { interaction = JSON.parse(rawBody) }
  catch { return { statusCode: 400, body: 'Bad JSON' } }

  // Discord PING (type 1) — respond PONG
  if (interaction.type === 1) {
    return json({ type: PONG })
  }

  // Application command (type 2)
  if (interaction.type === 2) {
    const cmd = interaction.data?.name
    try {
      switch (cmd) {
        case 'ping':      return json(channelMsg('pong — Recon 6 bot is live.', true))
        case 'maps':      return json(channelMsg(mapsResponse(), true))
        case 'strat':     return json(channelMsg(stratResponse(interaction), true))
        case 'callouts':  return json(channelMsg(calloutsResponse(interaction), true))
        case 'meta':      return json(channelMsg(metaResponse(), true))
        case 'pricing':   return json(channelMsg(pricingResponse(), true))
        case 'signup':    return json(channelMsg(signupResponse(), true))
        case 'help':      return json(channelMsg(helpResponse(), true))
        default:
          return json(channelMsg(`Unknown command: \`/${cmd}\`. Try \`/help\`.`, true))
      }
    } catch (err) {
      console.error('Command error:', err)
      return json(channelMsg('Something went wrong running that command.', true))
    }
  }

  return json({ type: PONG })
}

function json(obj) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  }
}

function channelMsg(content, ephemeral = false) {
  return {
    type: CHANNEL_MESSAGE,
    data: { content, flags: ephemeral ? 64 : 0 },
  }
}

function mapsResponse() {
  const ranked = MAPS.filter((m) => m.rankedPool).map((m) => `• **${m.name}**`).join('\n')
  const other = MAPS.filter((m) => !m.rankedPool).map((m) => m.name).join(', ')
  return `**Recon 6 — Map Pool**\n\n__Ranked rotation:__\n${ranked}\n\n__Other maps:__ ${other}\n\nUse \`/strat <map>\` for bomb sites.`
}

function stratResponse(interaction) {
  const opts = interaction.data?.options || []
  const mapOpt = opts.find((o) => o.name === 'map')
  if (!mapOpt) return 'Usage: `/strat map:<name>`'

  const wanted = String(mapOpt.value).toLowerCase().trim()
  const map = MAPS.find(
    (m) => m.id === wanted || m.name.toLowerCase() === wanted || m.name.toLowerCase().includes(wanted)
  )
  if (!map) return `No map matching "${mapOpt.value}". Try \`/maps\` for the list.`

  const sites = map.sites
    .map((s) => `• **${s.floor}** — [${s.name}](${INFO_URL}/#/strats/${map.id}/${s.id}/attack)`)
    .join('\n')
  return `**${map.name}** bomb sites:\n${sites}\n\nFull strat breakdown at ${INFO_URL}/#/strats/${map.id} (Pro+).`
}

function pricingResponse() {
  return [
    '**Recon 6 — Plans**',
    '',
    '**Recruit** — Free · Map overviews, operator tier lists, Discord',
    '**Pro** — $12/mo · Live AI callouts, VOD review, advanced strats',
    '**Champion** — $29/mo · Everything + desktop app, team tools, unlimited VOD',
    '',
    `Subscribe at ${INFO_URL}/#pricing`,
  ].join('\n')
}

function signupResponse() {
  return `Create your free account at ${INFO_URL}/#/auth — takes 30 seconds.`
}

// Site callouts per (map, site) — pre-round text you can paste into VC.
// Keep in sync with src/data/strats.js `callouts` arrays.
const CALLOUTS = {
  bank: {
    ceo: ['CEO', 'Executive Lounge', 'Janitor', 'Skylight', 'Server', 'Spiral Stairs', 'Front Door'],
    'open-area': ['Open Area', 'Staff Room', 'Electrical', 'Admin', 'Lobby', 'Main Stairs'],
    tellers: ["Teller's Office", 'Archives', 'Lobby', 'Vault', 'Back Hallway'],
    basement: ['Lockers', 'CCTV', 'Vault Lobby', 'Staff Stairs', 'Back Garage'],
  },
  clubhouse: {
    'cash-cctv': ['Cash Room', 'CCTV', 'Garage', 'Bar Stairs', 'Kitchen', 'Back Roof'],
    'bar-stock': ['Bar', 'Stock Room', 'Kitchen', 'Construction', 'Main Stairs'],
    church: ['Church', 'Arsenal', 'Graveyard', 'Basement Stairs', 'Tunnel'],
    'gym-bedroom': ['Gym', 'Bedroom', 'Garage', 'Roof Hatch', 'Cash Stairs'],
  },
  'emerald-plains': {
    'lounge-bedroom': ['Lounge', 'Bedroom', 'Patio', 'Main Stairs', 'Attic', 'Balcony', 'Kids Bedroom'],
    'kitchen-dining': ['Kitchen', 'Dining', 'Fountain Hall', 'Dining Hallway', 'Stairs', 'Butler Pantry'],
    'bar-irish': ['Bar', 'Irish Room', 'Fountain Hall', 'Reception', 'Main Stairs', 'Back Hall'],
    'gym-studio': ['Gym', 'Studio', 'Hallway', 'Main Stairs', 'Back Stairs', 'Attic', 'Balcony'],
  },
}

function calloutsResponse(interaction) {
  const opts = interaction.data?.options || []
  const mapOpt = opts.find((o) => o.name === 'map')
  const siteOpt = opts.find((o) => o.name === 'site')
  if (!mapOpt) return 'Usage: `/callouts map:<name> site:<name>`'

  const wanted = String(mapOpt.value).toLowerCase().trim()
  const map = MAPS.find(
    (m) => m.id === wanted || m.name.toLowerCase() === wanted || m.name.toLowerCase().includes(wanted),
  )
  if (!map) return `No map matching "${mapOpt.value}". Try \`/maps\`.`

  if (!siteOpt) {
    // List sites on that map
    const sites = map.sites.map((s) => `• **${s.floor}** — ${s.name}`).join('\n')
    return `**${map.name}** sites — pick one with \`/callouts map:${map.id} site:<name>\`:\n${sites}`
  }

  const siteWanted = String(siteOpt.value).toLowerCase().trim()
  const site = map.sites.find(
    (s) => s.id === siteWanted || s.name.toLowerCase().includes(siteWanted),
  )
  if (!site) return `No site matching "${siteOpt.value}" on ${map.name}. Try just \`/callouts map:${map.id}\`.`

  const tags = CALLOUTS[map.id]?.[site.id]
  if (!tags) {
    return `No callouts cached yet for **${map.name} — ${site.name}**. Full breakdown at ${INFO_URL}/#/strats/${map.id}/${site.id}/attack`
  }
  return `**${map.name} — ${site.name}** callouts (click to copy each on the web):\n\`${tags.join('` · `')}\`\n\n${INFO_URL}/#/strats/${map.id}/${site.id}/attack`
}

// Curated meta snapshot — regenerate from /meta page when strats data changes.
const META_SNAPSHOT = {
  updated: '2026-04-22',
  topEssentials: [
    { name: 'Thatcher', count: 14, note: 'Attack support — EMPs enable every hard breach' },
    { name: 'Bandit', count: 13, note: 'Defense anti-breach on every electrified wall' },
    { name: 'Thermite', count: 12, note: 'Primary attack hard breach' },
    { name: 'Maestro', count: 11, note: 'Defense intel & plant denial' },
    { name: 'Smoke', count: 9, note: 'Defense area denial and plant disruption' },
  ],
  topBans: [
    { name: 'Thatcher', note: 'Kills all tricking and hard breach' },
    { name: 'Mira', note: 'Black Mirrors give defenders free intel' },
    { name: 'Maverick', note: 'Silent breach with no counter' },
    { name: 'Kaid', note: 'Multi-hatch electrification across sites' },
  ],
}

function metaResponse() {
  const essentials = META_SNAPSHOT.topEssentials
    .slice(0, 5)
    .map((o, i) => `${i + 1}. **${o.name}** — ${o.count} sites · _${o.note}_`)
    .join('\n')
  const bans = META_SNAPSHOT.topBans
    .slice(0, 4)
    .map((o, i) => `${i + 1}. **${o.name}** — _${o.note}_`)
    .join('\n')
  return [
    `**Ranked Meta** _(snapshot ${META_SNAPSHOT.updated})_`,
    '',
    '__Top essential picks__',
    essentials,
    '',
    '__Top ban targets__',
    bans,
    '',
    `Live leaderboard at ${INFO_URL}/#/meta`,
  ].join('\n')
}

function helpResponse() {
  return [
    '**Recon 6 bot commands:**',
    '`/maps` — list all maps',
    '`/strat map:<name>` — show bomb sites for a map',
    '`/callouts map:<name> site:<name>` — copy-ready callouts for a site',
    '`/meta` — top essentials & ban targets snapshot',
    '`/pricing` — subscription plans',
    '`/signup` — get a free account',
    '`/ping` — health check',
    '`/help` — this message',
  ].join('\n')
}
