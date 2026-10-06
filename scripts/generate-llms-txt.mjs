#!/usr/bin/env node
// public/llms.txt: a plain-text brief of Recon 6 for AI assistants
// (https://llmstxt.org). Plan facts come from src/config/planFacts.js and the
// guide list from the same data the sitemap uses, so nothing here is typed by
// hand. No paid strat content: scripts/audit-public-content.mjs checks
// dist/*.txt too.
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MAPS from '../src/data/maps.js'
import STRATS from '../src/data/strats.js'
import { FREE_MAP_NAMES, MAP_COUNT, PLAN_FACTS } from '../src/config/planFacts.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://r6coaching.com'
const { pro, elite, champion } = PLAN_FACTS

const guides = MAPS.filter((map) => !map.comingSoon && STRATS[map.id])
  .map((map) => `- [${map.name} map guide](${SITE}/guides/${map.id}.html): sites, callouts and the operators each plan uses`)

const body = `# Recon 6

> Recon 6 (r6coaching.com) is a Rainbow Six Siege coaching tool: attack and defense plans for ${MAP_COUNT} maps with five operator jobs per round, match prep, screenshot-based AI VOD review, and a Windows desktop coach. It is built by Aaron Henry in Texas, USA, and is fan-made, not affiliated with Ubisoft.

## Plans
- Basic: free. ${FREE_MAP_NAMES} sample strats, operator lineups, and the map and callout reference.
- Pro: $${pro.monthlyUsd}/month. Advanced strategies, ${pro.aiReviewsPerMonth} AI VOD reviews a month (${pro.screenshotsPerReview} screenshots each), and the Recon 6 Command desktop coach for Windows.
- Elite: $${elite.monthlyUsd}/month. Everything in Pro, ${elite.aiReviewsPerMonth} AI VOD reviews a month (up to ${elite.screenshotsPerReview} screenshots each), premium tactics, and recurring-mistake reports.
- Champion: $${champion.monthlyUsd}/month. Everything in Elite, ${champion.aiReviewsPerMonth} AI VOD reviews a month, and ${champion.liveSessionsPerMonth} live 1:1 coaching sessions with Aaron each month.
- 1-on-1 coaching without a plan: $40 a session; a player's first session is $20.
- Paid plans bill at checkout; there is no free trial. The first charge has a 7-day money-back window, and members cancel from the Stripe customer portal on their Account page.

## Facts
- Recon 6 is not a boosting service: nobody logs into a player's game account.
- The website does not inject into or modify Rainbow Six Siege. The desktop coach reads the player's own capture feed and never touches the game process.
- AI usage on the website is capped per plan; extra usage is prepaid, with no automatic overage.

## Key pages
- [Home](${SITE}/): what Recon 6 does, with a free strat preview
- [Plans and pricing](${SITE}/pricing): every plan side by side
- [Map strats](${SITE}/strats): attack and defense plans by map and site
- [Free Bank defense plan](${SITE}/strats/bank/ceo/defense): a full round plan with no account
- [1-on-1 coaching](${SITE}/coaching/): live sessions with Aaron
- [About and contact](${SITE}/about): who builds Recon 6 and how to reach him
- [Press kit](${SITE}/press): logos, screenshots and product copy
- [Compare Recon 6](${SITE}/compare/): next to a 1-on-1 coach, free guides and other coaching tools
- [Refund policy](${SITE}/refund), [Privacy policy](${SITE}/privacy), [Terms](${SITE}/terms)

## Guides
- [All map guides](${SITE}/guides/)
- [Operator guides](${SITE}/guides/operators/)
- [Blog: rank-up and operator guides](${SITE}/blog/)
${guides.join('\n')}
`

writeFileSync(join(ROOT, 'public', 'llms.txt'), body, 'utf8')
console.log(`✓ Generated llms.txt (${guides.length} map guides)`)
