#!/usr/bin/env node
// Registers slash commands for the Recon 6 Discord bot.
// Usage: node scripts/register-discord-commands.mjs
//   Requires env vars: DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN
//   For guild-scoped (fast, dev-only): also set DISCORD_GUILD_ID.
// Run this ONCE after creating the Discord app. Re-run after changing commands.

const APP = process.env.DISCORD_APPLICATION_ID
const TOKEN = process.env.DISCORD_BOT_TOKEN
const GUILD = process.env.DISCORD_GUILD_ID // optional

if (!APP || !TOKEN) {
  console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN env vars.')
  process.exit(1)
}

const COMMANDS = [
  { name: 'ping', description: 'Check that the Recon 6 bot is alive.' },
  { name: 'maps', description: 'List every Rainbow Six Siege map Recon 6 covers.' },
  {
    name: 'strat',
    description: 'Show bomb sites for a map.',
    options: [
      { name: 'map', description: 'Map name (e.g. Bank, Clubhouse)', type: 3, required: true },
    ],
  },
  {
    name: 'callouts',
    description: 'Get copy-ready callouts for a specific map + site.',
    options: [
      { name: 'map', description: 'Map name (e.g. Bank, Clubhouse)', type: 3, required: true },
      { name: 'site', description: 'Bomb site (e.g. CEO, Cash)', type: 3, required: false },
    ],
  },
  { name: 'meta', description: 'Current ranked meta — top essential picks and ban targets.' },
  { name: 'pricing', description: 'Show Recon 6 subscription plans.' },
  { name: 'signup', description: 'Get a link to create a free Recon 6 account.' },
  { name: 'help', description: 'List all Recon 6 bot commands.' },
]

const base = GUILD
  ? `https://discord.com/api/v10/applications/${APP}/guilds/${GUILD}/commands`
  : `https://discord.com/api/v10/applications/${APP}/commands`

const res = await fetch(base, {
  method: 'PUT',
  headers: {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(COMMANDS),
})

if (!res.ok) {
  console.error('Failed:', res.status, await res.text())
  process.exit(1)
}

const j = await res.json()
console.log(`Registered ${j.length} commands ${GUILD ? `to guild ${GUILD}` : 'globally'}.`)
for (const c of j) console.log(`  /${c.name} — ${c.description}`)
