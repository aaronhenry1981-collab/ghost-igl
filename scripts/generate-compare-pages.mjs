#!/usr/bin/env node
// public/compare/: comparison and category pages for the searches buyers run
// before they pay ("R6 coach vs app", "is it worth it", "what coaching tools
// exist", "R6 Tracker vs ..."). Recon 6 facts come from planFacts and the
// coaching page's published prices. A named product is described only from
// its own website: quoted, dated "checked on <date>", and listed under
// Sources. Re-check those pages before changing what they say.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FREE_MAP_NAMES, MAP_COUNT, PLAN_FACTS } from '../src/config/planFacts.js'
import {
  ARTICLE_CSS, SITE_URL, TEMPLATE_REVISED, articleSchema, bylineHtml, firstPublished, fitDescription, fitTitle,
  footerHtml, navHtml, sourcesHtml,
} from './lib/article-seo.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'compare')
const { pro, elite, champion } = PLAN_FACTS
// Published on /coaching/ (scripts/generate-coaching-page.mjs).
const SESSION = 40
const FIRST_SESSION = 20
// When the named products below were last read from their own sites.
const CHECKED = '6 October 2026'

const escape = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const PAGES = [
  {
    slug: 'recon-6-vs-1-on-1-coaching',
    title: 'Recon 6 vs a 1-on-1 R6 Coach: Cost and What You Get',
    description: `What $${pro.monthlyUsd} a month of Recon 6 Pro gives you next to a $${SESSION} one-hour Rainbow Six Siege coaching session, and when each one is the better spend.`,
    h1: 'Recon 6 vs a 1-on-1 coaching session',
    definition: `Recon 6 Pro is a $${pro.monthlyUsd}-a-month Rainbow Six Siege coaching tool: a plan for the round you're about to play, ${pro.aiReviewsPerMonth} AI reviews of your own screenshots a month, and a Windows desktop coach. A 1-on-1 session is an hour with a human coach going through your rounds with you.`,
    table: {
      head: ['', 'Recon 6 Pro', '1-on-1 session'],
      rows: [
        ['Price', `$${pro.monthlyUsd} a month`, `$${SESSION} an hour ($${FIRST_SESSION} for your first)`],
        ['When it helps', 'Before and after every match', 'When you book it'],
        ['What you get', `Advanced strategy plans, ${pro.aiReviewsPerMonth} screenshot reviews a month, the desktop coach`, 'A review of the rounds you bring and a plan for your next queue'],
        ['What it can\'t do', 'It only sees the screenshots you upload, not the whole round', 'It lasts an hour, then you play on your own'],
      ],
    },
    sections: [
      {
        q: 'Which costs less?',
        a: `<p>Pro costs $${pro.monthlyUsd} a month. One session costs $${SESSION}, and your first is $${FIRST_SESSION}. Two sessions a month would be $${SESSION * 2}; Champion is $${champion.monthlyUsd} a month and includes ${champion.liveSessionsPerMonth} sessions plus everything in Elite.</p>`,
      },
      {
        q: 'What does a human coach catch that software can\'t?',
        a: '<p>A coach sees the whole round: your timing, your comms, the sound cue you ignored, and the decision ten seconds before the death. Recon 6\'s review only sees the screenshots you upload, so it can only judge what is in them.</p>',
      },
      {
        q: 'What does Recon 6 do that one session can\'t?',
        a: `<p>Recon 6 is there every match. Pick the map, site and side and you get one plan with five operator jobs, the callouts and the utility. After the match, Pro reviews screenshots from your rounds and keeps the mistake you need to fix in front of you. ${FREE_MAP_NAMES} are free to try.</p>`,
      },
      {
        q: 'What happens in a 1-on-1 session?',
        a: `<p>A session is one full hour. You bring 2-3 clips or screenshots of rounds you lost, the coach breaks down the decisions that cost you those rounds, and you leave with a plan for your next queue. Sessions are for PC and console players at any rank. You pick an open time on the calendar, pay through Stripe, and get a calendar invite.</p>`,
      },
      {
        q: 'What are the limits of each?',
        a: `<p>Pro includes ${pro.aiReviewsPerMonth} AI reviews a month, each of up to ${pro.screenshotsPerReview} screenshots, and a review can only judge what those screenshots show. Elite raises that to ${elite.aiReviewsPerMonth} reviews of up to ${elite.screenshotsPerReview} screenshots. A session covers the rounds you bring to that one hour. Champion's ${champion.liveSessionsPerMonth} monthly sessions don't roll over to the next month.</p>`,
      },
      {
        q: 'Which should you pick?',
        a: `<p>If you don't know what you're doing wrong, start with one session; the first is $${FIRST_SESSION}. If you know the problem and need reps with a plan, Pro is the cheaper habit. If you want both every month, Champion covers them. Elite ($${elite.monthlyUsd}) sits between: more reviews, no live sessions.</p>`,
      },
    ],
    faq: [
      ['Is Recon 6 a replacement for a coach?', 'No. It covers the plan before the round and a review of your screenshots after it. A coach watches the whole round and talks it through with you, which software doesn\'t do.'],
      ['Can I book a session without a subscription?', `Yes. Single sessions are $${SESSION} an hour with no subscription, and your first is $${FIRST_SESSION}.`],
      ['Who runs the sessions?', 'Aaron Henry, who founded Recon 6. Sessions are booked from the coaching page.'],
      ['Is there a free trial?', `No. Paid plans start when you check out. ${FREE_MAP_NAMES} are free to open without paying.`],
    ],
    related: [
      { name: '1-on-1 coaching sessions', url: '/coaching/' },
      { name: 'Every plan, side by side', url: '/pricing' },
      { name: 'Recon 6 vs YouTube guides and Discord strat sheets', url: '/compare/recon-6-vs-youtube-and-discord.html' },
    ],
    sources: [],
  },
  {
    slug: 'recon-6-vs-youtube-and-discord',
    title: 'Recon 6 vs YouTube Guides and Discord Strat Sheets',
    description: 'Free R6 YouTube guides and Discord strat sheets teach a lot. What Recon 6 adds for the exact round you are about to play, and what it costs.',
    h1: 'Recon 6 vs YouTube guides and Discord strat sheets',
    definition: 'YouTube guides and Discord strat sheets are the free ways most players learn Rainbow Six Siege. Recon 6 is a strat tool built around the round in front of you: pick the map, site and side, and get one plan with five operator jobs.',
    table: {
      head: ['', 'YouTube guides', 'Discord strat sheets', 'Recon 6'],
      rows: [
        ['Price', 'Free', 'Free', `${FREE_MAP_NAMES} free; Pro $${pro.monthlyUsd} a month`],
        ['Best for', 'Learning a concept or a map in depth', 'Your stack\'s own calls', 'The plan for the round you\'re about to play'],
        ['Finding the exact site and side', 'Search and scrub through video', 'Depends on who keeps the sheet', 'Pick map, site and side'],
        ['Feedback on your own play', 'No', 'From teammates, if they have time', 'Pro reviews your screenshots'],
      ],
    },
    sections: [
      {
        q: 'What do YouTube guides do well?',
        a: '<p>YouTube guides teach. A good guide shows why a setup works, how pros play it and what the angles look like. They\'re free and there are a lot of them. The catch is finding the right one for the exact site and side with prep running, and knowing whether it still matches the current season.</p>',
      },
      {
        q: 'What do Discord strat sheets do well?',
        a: '<p>A sheet your stack keeps is built around how you play, and everyone agreed to it. It only stays useful while someone keeps it updated, and it rarely says what each of the five players should do.</p>',
      },
      {
        q: 'What does Recon 6 add?',
        a: `<p>Speed and structure: one plan for the map, site and side you picked, with a job for each of the five players, the callouts and the utility. Plans cover ${MAP_COUNT} maps. With Pro, Recon 6 also reviews screenshots from your own rounds and points out the mistake to fix next. The strats are in beta, so if a plan doesn't match your game, tell us.</p>`,
      },
      {
        q: 'How do the three work together?',
        a: `<p>Say your stack queues Bank. Watch one guide on CEO Office to learn why the attack opens the CEO wall with Thermite. Write your stack's own calls for that site in the Discord sheet. Before the round, open the CEO Office attack plan in Recon 6 so all five players know their job. After the match, upload screenshots from the rounds you lost and compare them with the plan.</p>`,
      },
      {
        q: 'What does each option cost?',
        a: `<p>YouTube guides and Discord strat sheets are free. Recon 6's free tier opens ${FREE_MAP_NAMES}. Pro is $${pro.monthlyUsd} a month with ${pro.aiReviewsPerMonth} AI reviews. Elite is $${elite.monthlyUsd} a month with ${elite.aiReviewsPerMonth}. Champion is $${champion.monthlyUsd} a month with ${champion.aiReviewsPerMonth} reviews and ${champion.liveSessionsPerMonth} live sessions. There is no free trial.</p>`,
      },
      {
        q: 'Should you stop watching guides?',
        a: '<p>No. Watch a guide to understand an idea, open Recon 6 to get the plan for the round, play it, then review it. They do different jobs.</p>',
      },
    ],
    faq: [
      ['Is Recon 6 free?', `${FREE_MAP_NAMES} are free to open without paying. Pro is $${pro.monthlyUsd} a month for advanced strategies, AI review and the desktop coach.`],
      ['Does Recon 6 replace my stack\'s Discord?', 'No. Recon 6 gives everyone the same plan to start from; your stack\'s own calls and adjustments still matter.'],
      ['Are the strats current?', 'Plans follow Ubisoft\'s current map list, and a plan that can\'t be backed up is withdrawn instead of guessed. They are marked beta.'],
    ],
    related: [
      { name: 'Open the free Bank defense', url: '/strats/bank/ceo/defense' },
      { name: 'Map guides', url: '/guides/' },
      { name: 'Recon 6 vs a 1-on-1 coaching session', url: '/compare/recon-6-vs-1-on-1-coaching.html' },
    ],
    sources: [],
  },
  {
    slug: 'rainbow-six-siege-coaching-tools',
    title: 'Rainbow Six Siege Coaching Tools: What Each Type Does',
    description: 'Rainbow Six Siege coaching tools by type (strat references, stat trackers, VOD review, live coaching, practice): what each fixes and where Recon 6 fits.',
    h1: 'Rainbow Six Siege coaching tools, by type',
    definition: 'A Rainbow Six Siege coaching tool is anything that helps you play better rounds: a strat reference for the plan, a stat tracker for your numbers, VOD review for your mistakes, live coaching, or structured practice. Each one fixes a different problem.',
    table: {
      head: ['Type', 'What it answers', 'What it can\'t tell you'],
      rows: [
        ['Strat reference', 'What should my team do on this site?', 'Whether you executed it well'],
        ['Stat tracker', 'How am I doing over time?', 'Why you lost a round'],
        ['VOD review', 'What went wrong in this round?', 'What to do before the next one, unless it says so'],
        ['Live coaching', 'What should I change, from someone watching?', 'Anything once the session ends'],
        ['Practice routine', 'How do I fix one habit?', 'Which habit to fix first'],
      ],
    },
    sections: [
      {
        q: 'What is a strat reference?',
        a: '<p>A strat reference gives your team a plan: operators, the execute or the setup, callouts and utility for a site. It answers what to do, not how well you did it.</p>',
      },
      {
        q: 'What is a stat tracker?',
        a: '<p>A stat tracker shows numbers from your matches over time, such as kills, deaths, win rate and rank. It tells you that something is off, not why.</p>',
      },
      {
        q: 'What is VOD review?',
        a: '<p>VOD review looks at your own rounds to find the mistake. A human reviewer sees the whole recording; an AI review sees what you give it. The useful ones end with one thing to change next match.</p>',
      },
      {
        q: 'What is live coaching?',
        a: '<p>Live coaching is a person watching you play, or watching your rounds with you, and telling you what to change. It catches what software misses, and it costs more per hour than any tool.</p>',
      },
      {
        q: 'How do the tools work together?',
        a: '<p>Here is one example. A stat tracker shows your deaths per round went up this month. VOD review of three of those rounds shows the same mistake: you peeked a door nobody had droned. A strat reference gives your team a plan in which someone drones that door first. A practice routine then makes droning before a peek a habit.</p>',
      },
      {
        q: 'What does Recon 6 not do?',
        a: `<p>Recon 6 does not track your stats, and it never needs your game login. Nothing is injected into the game, and accounts are not shared. Its AI review sees only the screenshots you upload: up to ${pro.screenshotsPerReview} per review on Pro and ${elite.screenshotsPerReview} on Elite and Champion.</p>`,
      },
      {
        q: 'Where does Recon 6 fit?',
        a: `<p>Recon 6 is a strat reference for ${MAP_COUNT} maps, an AI screenshot review on paid plans, a Windows desktop coach, and live 1:1 sessions. It is not a stat tracker. <a href="/pricing">Plans</a> start free with ${FREE_MAP_NAMES}.</p>`,
      },
    ],
    faq: [
      ['Which coaching tool should I start with?', 'If you lose rounds without knowing why, start with VOD review. If your team argues about what to do, start with a strat reference. If your numbers look fine but you aren\'t climbing, watch your own rounds.'],
      ['Is AI review as good as a human coach?', 'No. AI review only sees the screenshots you upload. It is cheaper and always available, which makes it good for the mistakes you repeat; a human coach is better for finding the ones you don\'t know about.'],
    ],
    related: [
      { name: 'Recon 6 vs a 1-on-1 coaching session', url: '/compare/recon-6-vs-1-on-1-coaching.html' },
      { name: 'Recon 6 vs YouTube guides and Discord strat sheets', url: '/compare/recon-6-vs-youtube-and-discord.html' },
      { name: 'AI VOD review', url: '/vod' },
    ],
    sources: [
      { label: 'Ubisoft: official Rainbow Six Siege operators', note: 'the game\'s operator roster and abilities', url: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/game-info/operators' },
      { label: 'SiegeGG: operator stats', note: 'pick and ban rates in professional play', url: 'https://siege.gg/operators' },
    ],
  },
  {
    slug: 'recon-6-vs-replay-analytics-tools',
    title: 'Recon 6 vs Replay-Analytics Tools for Rainbow Six Siege',
    description: 'Replay-analytics tools like DataCoach turn replay files into stats, but not for Siege. What Recon 6 does for Rainbow Six Siege instead, and what it costs.',
    h1: 'Recon 6 vs replay-analytics tools',
    definition: 'A replay-analytics tool reads the replay files your matches save and turns them into stats and charts. DataCoach is one; its site calls it "Performance analytics for competitive Esports." Recon 6 is built for Rainbow Six Siege and works from the other end of the round: a plan for the map, site and side before you play, then a review of your screenshots that names one mistake to fix.',
    table: {
      head: ['', 'Replay-analytics tool (DataCoach)', 'Recon 6'],
      rows: [
        ['Rainbow Six Siege', 'Not supported', 'Built only for Siege'],
        ['Works from', 'Replay files you upload after matches', 'The map, site and side you pick, and screenshots you upload'],
        ['What you get', 'A dashboard of analytics, game history and training plans', 'A plan with five operator jobs before the round; a review naming one mistake and a fix after it'],
        ['Price', 'Free for 10 replays a month; $11 a month for 50; $18 a month for unlimited', `${FREE_MAP_NAMES} free; Pro $${pro.monthlyUsd} a month with ${pro.aiReviewsPerMonth} reviews`],
      ],
    },
    sections: [
      {
        q: 'What does a replay-analytics tool do?',
        a: '<p>It reads the replay file a game saves after each match and turns it into numbers you can track. DataCoach describes the job as converting "replay files into powerful esports performance analytics": you upload replays, then review a dashboard of analytics, game history and training plans. It can only measure what the replay file records.</p>',
      },
      {
        q: 'Does DataCoach work for Rainbow Six Siege?',
        a: `<p>No, not when we checked on ${CHECKED}. DataCoach's player plans are built for another game's 1v1, 2v2 and 3v3 playlists, and Rainbow Six Siege isn't mentioned on its site. Siege players who want numbers from their matches use a stat tracker instead; see <a href="/compare/recon-6-vs-r6-tracker.html">Recon 6 vs R6 Tracker</a>.</p>`,
      },
      {
        q: 'What does Recon 6 do instead?',
        a: '<p>Recon 6 covers both ends of a Siege round. Before it, pick the map, site and side, and you get one plan with a job for each of the five players, the callouts and the utility. After the match, upload screenshots such as death cams or end-of-round scoreboards; the review names the mistake they show, the pattern across the session, and a fix to apply next round. Each review is saved to Road to Champion as coaching evidence.</p>',
      },
      {
        q: 'Can Recon 6 read Siege replay files?',
        a: `<p>No. Recon 6 reviews the screenshots you upload, not replay files, so a review can only judge what those screenshots show: up to ${pro.screenshotsPerReview} per review on Pro and ${elite.screenshotsPerReview} on Elite and Champion.</p>`,
      },
      {
        q: 'Which should you use?',
        a: `<p>If you play a game a replay-analytics tool supports and want charts from every replay, that tool is built for it. If you play Siege and lose rounds without knowing why, Recon 6 gives your team the plan before the round and one fix after it. ${FREE_MAP_NAMES} are free to open without paying.</p>`,
      },
    ],
    faq: [
      ['Is Recon 6 a replay analyzer?', 'No. It does not read replay files. It gives you a plan before the round and reviews the screenshots you upload after it.'],
      ['Does Recon 6 track my stats?', 'No. Recon 6 is not a stat tracker, and it never needs your game login.'],
      ['Is Recon 6 connected to DataCoach?', `No. Recon 6 is not affiliated with DataCoach. The DataCoach details on this page come from its own website, checked on ${CHECKED}.`],
      ['Is there a free trial?', `No. Paid plans start when you check out. ${FREE_MAP_NAMES} are free to open without paying.`],
    ],
    related: [
      { name: 'Recon 6 vs R6 Tracker', url: '/compare/recon-6-vs-r6-tracker.html' },
      { name: 'Rainbow Six Siege coaching tools, by type', url: '/compare/rainbow-six-siege-coaching-tools.html' },
      { name: 'A sample AI review', url: '/vod?demo=1' },
    ],
    sources: [
      { label: 'DataCoach: home page', note: `its description and player plans, checked ${CHECKED}`, url: 'https://www.datacoach.gg/' },
      { label: 'DataCoach: pricing', note: `player plans and replay limits, checked ${CHECKED}`, url: 'https://www.datacoach.gg/pricing' },
    ],
  },
  {
    slug: 'recon-6-vs-r6-tracker',
    title: 'Recon 6 vs R6 Tracker: Siege Stats or a Round Plan?',
    description: 'R6 Tracker shows your Siege stats, match history and every player\'s rank. Recon 6 plans the round and finds one fix after it. What each does and costs.',
    h1: 'Recon 6 vs R6 Tracker',
    definition: 'R6 Tracker, from Tracker.gg, is a Rainbow Six Siege stats site and Windows overlay app; its site invites you to "Check Detailed Rainbow Six: Siege Stats and Leaderboards." Recon 6 is a Siege coaching tool: one plan for the map, site and side you are about to play, then a review of your screenshots that names one mistake to fix.',
    table: {
      head: ['', 'R6 Tracker', 'Recon 6'],
      rows: [
        ['What it answers', 'How am I doing, and who am I playing against?', 'What should my team do on this site, and what do I fix next?'],
        ['Works from', 'Your Siege profile and match data', 'The map, site and side you pick, and screenshots you upload'],
        ['During the match', 'A Windows overlay with every player\'s rank and your victory chances (not on console)', 'An optional Windows desktop coach that reads your own capture feed; console through a capture card'],
        ['After the match', 'Match history with roster, scoreboard and timeline; operator, map and weapon stats', 'A screenshot review naming the mistake, the pattern and a fix'],
        ['Price', 'Free; Premium is $3.99 a month and removes ads', `${FREE_MAP_NAMES} free; Pro $${pro.monthlyUsd} a month`],
      ],
    },
    sections: [
      {
        q: 'What does R6 Tracker do well?',
        a: '<p>Numbers. R6 Tracker keeps your match history, with the roster, an advanced scoreboard and a timeline for each match, and breaks your stats down by operator, map and weapon. Its Windows overlay shows every player\'s rank in your current match; in its own words, "Scout the enemy and build your battle plan." The site is free, and Premium ($3.99 a month) removes the ads.</p>',
      },
      {
        q: 'What can\'t a stat tracker tell you?',
        a: '<p>Why you lost the round. A tracker shows where your numbers are weak, such as a map, an operator or a weapon. It doesn\'t give your team a plan for the site: who drones, who opens the wall, who watches the flank. And it doesn\'t say what went wrong in the round you just lost.</p>',
      },
      {
        q: 'What does Recon 6 do instead?',
        a: `<p>Recon 6 starts before the round. Pick the map, site and side, and you get one plan with a job for each of the five players, the callouts and the utility, across ${MAP_COUNT} maps. After the match, Pro reviews up to ${pro.screenshotsPerReview} screenshots at a time, such as death cams or end-of-round scoreboards, and names the mistake they show and a fix for your next round. Recon 6 does not track your stats and never needs your game login.</p>`,
      },
      {
        q: 'How do they work together?',
        a: '<p>Say R6 Tracker shows Bank is your worst map. Open the Recon 6 plan for the Bank site you keep losing, so your stack plays one execute instead of five ideas. Play it, upload screenshots from the rounds you still lose, and carry the one fix into your next match. A month later, the tracker tells you whether Bank got better.</p>',
      },
      {
        q: 'What does each cost?',
        a: `<p>R6 Tracker is free, and its Premium plan is $3.99 a month without ads. Recon 6's ${FREE_MAP_NAMES} plans are free. Pro is $${pro.monthlyUsd} a month with ${pro.aiReviewsPerMonth} AI reviews, Elite is $${elite.monthlyUsd} with ${elite.aiReviewsPerMonth}, and Champion is $${champion.monthlyUsd} with ${champion.aiReviewsPerMonth} reviews and ${champion.liveSessionsPerMonth} live sessions. Recon 6 has no free trial.</p>`,
      },
    ],
    faq: [
      ['Is Recon 6 a stat tracker?', 'No. It does not track your stats or read your match history, and it never needs your game login.'],
      ['Can I use both?', 'Yes. They answer different questions: the tracker shows where your numbers are weak, and Recon 6 gives the plan for the round and the fix after it.'],
      ['Is Recon 6 affiliated with R6 Tracker or Tracker.gg?', `No. The R6 Tracker details on this page come from its own website, checked on ${CHECKED}.`],
      ['Is there a free trial?', `No. Paid plans start when you check out. ${FREE_MAP_NAMES} are free to open without paying.`],
    ],
    related: [
      { name: 'Recon 6 vs replay-analytics tools', url: '/compare/recon-6-vs-replay-analytics-tools.html' },
      { name: 'Rainbow Six Siege coaching tools, by type', url: '/compare/rainbow-six-siege-coaching-tools.html' },
      { name: 'Open the free Bank defense', url: '/strats/bank/ceo/defense' },
    ],
    sources: [
      { label: 'R6 Tracker (Tracker.gg): home page', note: `its features, overlay and Premium price, checked ${CHECKED}`, url: 'https://r6.tracker.network/' },
    ],
  },
]

function shell({ title, description, canonical, body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#121211" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${escape(canonical)}" />
  <meta property="og:image" content="${SITE_URL}/og-image.png" />
  <meta property="og:site_name" content="Recon 6" />
  ${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n  ')}
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #121211; color: #ebe4d7; line-height: 1.7; }
    a { color: #f07430; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .brand { font-weight: 900; letter-spacing: 0.06em; color: #fff; }
    .brand span { color: #f07430; }
    .nav-links a { margin-left: 18px; color: rgba(235,228,215,0.85); font-size: 0.9rem; }
    main { max-width: 780px; margin: 0 auto; padding: 32px 24px 80px; }
    h1 { font-size: 2.05rem; margin: 0 0 8px; line-height: 1.25; }
    h2 { font-size: 1.35rem; margin: 30px 0 10px; color: #fff; border-left: 3px solid #f07430; padding-left: 12px; }
    .definition { font-size: 1.04rem; }
    .compare-wrap { overflow-x: auto; margin: 22px 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
    table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 0.9rem; }
    th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    thead th { color: #f07430; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; border-top: 0; }
    tbody th { color: #fff; }
    .faq dt { font-weight: 700; color: #fff; margin-top: 14px; }
    .faq dd { margin: 4px 0 0; }
    .related { margin: 30px 0; padding: 18px 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }
    .related ul { margin: 0; padding-left: 18px; }
    .breadcrumb { font-size: 0.85rem; color: rgba(235,228,215,0.6); margin-bottom: 12px; }
    .footer-strip { max-width: 780px; margin: 40px auto; padding: 0 24px; color: rgba(235,228,215,0.5); font-size: 0.82rem; text-align: center; }${ARTICLE_CSS}
    @media (max-width: 600px) { main { padding: 20px 16px 40px; } h1 { font-size: 1.55rem; } }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    ${body}
  </main>
  ${footerHtml()}
</body>
</html>
`
}

function renderPage(page) {
  const canonical = `${SITE_URL}/compare/${page.slug}.html`
  const datePublished = firstPublished(join(OUT_DIR, `${page.slug}.html`), TEMPLATE_REVISED)
  const title = fitTitle(page.title, `${page.title.split(':')[0]} | Recon 6`)
  const description = fitDescription(page.description)
  const table = `
    <div class="compare-wrap"><table>
      <thead><tr>${page.table.head.map((h) => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead>
      <tbody>${page.table.rows.map(([label, ...cells]) => `<tr><th scope="row">${escape(label)}</th>${cells.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`
  const body = `
    <nav class="breadcrumb"><a href="/">Recon 6</a> › <a href="/compare/">Compare</a> › <span>${escape(page.h1)}</span></nav>
    <article>
      ${bylineHtml({ datePublished, kind: 'aiPost' })}
      <h1>${escape(page.h1)}</h1>
      <p class="definition">${escape(page.definition)}</p>
      ${table}
      ${page.sections.map((s) => `<h2>${escape(s.q)}</h2>\n      ${s.a}`).join('\n      ')}
      <h2>Questions</h2>
      <dl class="faq">${page.faq.map(([q, a]) => `<dt>${escape(q)}</dt><dd>${escape(a)}</dd>`).join('')}</dl>
      <div class="related"><h3>Related</h3><ul>${page.related.map((l) => `<li><a href="${escape(l.url)}">${escape(l.name)}</a>.</li>`).join('')}</ul></div>
      ${sourcesHtml(page.sources)}
    </article>`
  const jsonLd = [
    articleSchema({ headline: page.h1, description, url: canonical, datePublished, dateModified: TEMPLATE_REVISED, image: `${SITE_URL}/og-image.png`, section: 'Compare' }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [...page.sections.map((s) => [s.q, s.a.replace(/<[^>]+>/g, '')]), ...page.faq].map(([q, a]) => ({
        '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Recon 6', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare/` },
        { '@type': 'ListItem', position: 3, name: page.h1, item: canonical },
      ],
    },
  ]
  return shell({ title, description, canonical, body, jsonLd })
}

function renderIndex() {
  const canonical = `${SITE_URL}/compare/`
  const body = `
    <nav class="breadcrumb"><a href="/">Recon 6</a> › <span>Compare</span></nav>
    <h1>Compare Recon 6 with other ways to improve</h1>
    <p class="definition">Recon 6 is one way to get better at Rainbow Six Siege. These pages put it next to the others: a human coach, free YouTube guides and Discord strat sheets, replay-analytics tools, R6 Tracker, and the other kinds of coaching tools. Each comparison gives the cost, what each option does well, and its limits.</p>
    <h2>Which comparison do you need?</h2>
    <ul>${PAGES.map((p) => `<li><a href="/compare/${p.slug}.html">${escape(p.h1)}</a>. ${escape(p.definition)}</li>`).join('')}</ul>
    <h2>What does each option cost?</h2>
    <p>YouTube guides, Discord strat sheets and Recon 6's ${escape(FREE_MAP_NAMES)} plans are free. Recon 6 Pro is $${pro.monthlyUsd} a month and Elite is $${elite.monthlyUsd}. A 1-on-1 session is $${SESSION} an hour, and your first is $${FIRST_SESSION}. Champion is $${champion.monthlyUsd} a month and includes ${champion.liveSessionsPerMonth} sessions. Recon 6 has no free trial.</p>`
  return shell({
    title: 'Compare Recon 6 With Other Ways to Improve at R6',
    description: 'Recon 6 next to a 1-on-1 coach, free guides and strat sheets, replay-analytics tools, R6 Tracker and other Rainbow Six Siege coaching tools, with costs and limits.',
    canonical,
    body,
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Compare Recon 6', url: canonical,
      hasPart: PAGES.map((p) => ({ '@type': 'Article', headline: p.h1, url: `${SITE_URL}/compare/${p.slug}.html` })),
    }],
  })
}

mkdirSync(OUT_DIR, { recursive: true })
for (const page of PAGES) writeFileSync(join(OUT_DIR, `${page.slug}.html`), renderPage(page), 'utf8')
writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(), 'utf8')
console.log(`✓ Generated ${PAGES.length} compare pages + index in public/compare/`)
