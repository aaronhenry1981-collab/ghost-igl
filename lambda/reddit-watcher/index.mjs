// Reddit watcher — polls target subs via the public JSON API, scores
// posts by "comment fit" (keyword match × engagement × freshness × flair),
// and writes a daily digest to S3 that Aaron can check once a day.
//
// PHASE 1 (this file): post discovery + scoring + digest generation.
// PHASE 2 (later): per-post comment draft via Bedrock Claude.
// PHASE 3 (later): SES email push instead of S3 check.
//
// Why this is Reddit-safe:
//   - Read-only via public .json endpoints (no API key needed)
//   - One request per sub per run × 8 subs × ~6 runs/day = 48 requests/day
//     (well under Reddit's 60-per-minute unauthenticated limit)
//   - User-Agent set with contact info (Reddit etiquette + bot-spam avoidance)
//   - No posting, no upvoting, no scraping of comment threads
//   - Aaron manually reads the digest, manually posts whatever he writes
//
// Trigger: EventBridge cron, every 4 hours (rate-cron 4 hours).
// Output: s3://r6coaching.com-site/reddit-digest/{latest.html,YYYY-MM-DD.html}
//   + JSON sidecars for programmatic consumption (Phase 2 will use these)

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' })
const BUCKET = process.env.OUTPUT_BUCKET || 'r6coaching.com-site'
// Same model as the VOD analysis Lambda — keeps coaching voice consistent
const BEDROCK_MODEL = process.env.BEDROCK_MODEL || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
// Top-N posts to auto-draft. Each draft costs ~$0.005 — capping at 8 keeps
// the daily Bedrock budget under $0.25/day even at 6 runs.
const DRAFT_TOP_N = parseInt(process.env.DRAFT_TOP_N || '8', 10)
const USER_AGENT = 'recon6-reddit-watcher/1.0 (contact: aaronhenry1981@gmail.com)'

// Reddit blocks unauthenticated requests from AWS IP ranges (403). The
// fix is OAuth via a Reddit-registered "script" app:
//   1. Go to https://www.reddit.com/prefs/apps → "create another app"
//   2. Pick "script" type, name it "recon6-watcher", redirect URI
//      http://localhost (unused but required)
//   3. Note the client_id (under the app name) and client_secret
//   4. Set Lambda env vars REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
//   5. Set REDDIT_USERNAME + REDDIT_PASSWORD for the account that owns
//      the app (read-only access, can be a throwaway, doesn't need karma)
//
// Token caching: we get a fresh token per Lambda warm-start (~1 hour TTL,
// Reddit caps at 1000 requests per token). With 8 subs × 6 runs/day =
// 48 requests/day, we're nowhere near the limit.
let cachedToken = null
let cachedTokenExpiry = 0

async function getRedditToken() {
  const now = Date.now()
  if (cachedToken && now < cachedTokenExpiry) return cachedToken

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD
  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Reddit OAuth credentials missing — set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD as Lambda env vars. See instructions in this Lambda\'s source comment.')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  })

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '<unparseable>')
    throw new Error(`Reddit token fetch failed: ${res.status} ${errText.slice(0, 200)}`)
  }
  const tokenData = await res.json()
  cachedToken = tokenData.access_token
  // Refresh 5 min before stated expiry (default 3600s) for safety margin
  cachedTokenExpiry = now + Math.max(60, (tokenData.expires_in - 300)) * 1000
  return cachedToken
}

// Target subs grouped by content priority. Per the audit, focus on the
// games with the deepest Recon 6 content — R6, OW2 Stadium, Tekken — and
// the coaching-friendly subs within each.
const TARGET_SUBS = [
  // OW2 — highest near-term ROI (Stadium content is best-in-class + low
  // competition + audience is hungry for coaching guidance right now)
  { sub: 'OverwatchUniversity', priority: 1, gameTag: 'ow2' },
  { sub: 'CompetitiveOverwatch', priority: 1, gameTag: 'ow2' },
  { sub: 'Overwatch', priority: 2, gameTag: 'ow2' },
  // R6 — brand DNA + deepest content, but karma-gated for Aaron's account
  { sub: 'SiegeAcademy', priority: 1, gameTag: 'r6' },
  { sub: 'Rainbow6', priority: 2, gameTag: 'r6' },
  // Tekken — coaching-welcoming community, less competition
  { sub: 'Tekken', priority: 2, gameTag: 'tk8' },
  // Apex — decent fit, less priority
  { sub: 'CompetitiveApex', priority: 3, gameTag: 'apex' },
  // Dota — coaching-friendly within the sub but Dota community is brutal
  { sub: 'learndota2', priority: 3, gameTag: 'dota2' },
]

// Keywords that boost a post's comment-fit score by game. Posts matching
// these in title/body are likely tactical questions Aaron can add insight
// to. Bonus weight for Stadium-specific terms since that's the biggest
// content advantage right now.
const KEYWORD_WEIGHTS = {
  ow2: {
    stadium: 5, build: 3, 'power pick': 4, 'item shop': 4, economy: 3,
    matchmaking: 2, rank: 2, climb: 2, advice: 2, help: 1, mistake: 3,
    why: 2, how: 1, tier: 3, vod: 4, review: 3, improve: 3,
  },
  r6: {
    ban: 3, meta: 3, operator: 2, site: 2, callout: 3, ranked: 2,
    advice: 2, help: 2, mistake: 3, plat: 2, diamond: 2, vod: 4,
    review: 3, climb: 2, drone: 2, utility: 3,
  },
  tk8: {
    punish: 4, frame: 3, matchup: 4, juggle: 3, combo: 2, advice: 2,
    help: 2, beginner: 2, ranked: 2, fundamentals: 3,
  },
  apex: {
    rotation: 3, fight: 2, edge: 2, ranked: 2, advice: 2, mistake: 3,
  },
  dota2: {
    laning: 3, draft: 3, macro: 4, ward: 2, rotation: 3, mid: 2,
    support: 2, carry: 2, advice: 2, mistake: 3,
  },
}

// Flairs that signal coaching-question content. We don't have a way to
// know every sub's flair set without crawling, so we score on keyword
// presence in the flair string when present.
const POSITIVE_FLAIRS = ['question', 'discussion', 'help', 'advice', 'guide', 'esports', 'competitive']
const NEGATIVE_FLAIRS = ['meme', 'humor', 'highlight', 'fan content', 'fanart', 'news', 'leak', 'bug', 'art', 'cosmetics']

async function fetchSubHot(subName, limit = 25) {
  // OAuth endpoint is oauth.reddit.com (not www.reddit.com) when using
  // an authenticated token. Public endpoint silently fails from AWS IPs.
  const token = await getRedditToken()
  const url = `https://oauth.reddit.com/r/${subName}/hot?limit=${limit}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
  })
  if (!res.ok) {
    console.warn(`Sub ${subName} fetch failed: ${res.status}`)
    return []
  }
  const data = await res.json()
  return (data?.data?.children || []).map((c) => c.data)
}

// Compute a comment-fit score 0-100 for a post.
//   - Keyword density in title/body (game-specific weights)
//   - Engagement velocity (upvotes per hour since post)
//   - Flair signal (positive flairs boost, negative flairs zero-out)
//   - Title ends in '?' boost (questions = coachable)
//   - Stickied / locked / NSFW = zero
function scorePost(post, gameTag) {
  if (post.stickied || post.locked || post.over_18) return 0
  if (!post.title) return 0

  const flairText = (post.link_flair_text || '').toLowerCase()
  if (NEGATIVE_FLAIRS.some((f) => flairText.includes(f))) return 0

  const text = `${post.title} ${post.selftext || ''}`.toLowerCase()
  const weights = KEYWORD_WEIGHTS[gameTag] || {}
  let keywordScore = 0
  for (const [kw, weight] of Object.entries(weights)) {
    if (text.includes(kw)) keywordScore += weight
  }

  const ageHours = Math.max(0.5, (Date.now() / 1000 - post.created_utc) / 3600)
  const upvotesPerHour = (post.ups || 0) / ageHours

  // Flair boost (positive flair = +5, otherwise neutral)
  const flairBoost = POSITIVE_FLAIRS.some((f) => flairText.includes(f)) ? 5 : 0

  // Question-mark boost — title posts ending in '?' are nearly always
  // coachable questions
  const questionBoost = post.title.trim().endsWith('?') ? 4 : 0

  // Final score blends keyword fit + engagement velocity + signals
  const raw = (keywordScore * 1.5) + Math.min(upvotesPerHour, 50) * 0.5 + flairBoost + questionBoost

  // Penalize stale posts (>24h old) — replies after 24h get buried
  const stalenessPenalty = ageHours > 24 ? (ageHours - 24) * 0.5 : 0
  return Math.max(0, Math.round(raw - stalenessPenalty))
}

// Draft a copy-paste-ready Reddit comment via Bedrock Claude. The prompt
// constrains tone (genuine community insight, NOT promotion), length
// (100-200 words), and structure (validates → analyzes → ends with a
// question for engagement). Zero r6coaching.com mentions — drafts are
// pure value-add so Aaron's username builds reputation.
async function draftComment(post) {
  const gameContext = {
    ow2: 'Overwatch 2 — focus on Stadium mode mechanics (Cash economy, Power picks, Item shop) if Stadium-related; otherwise hero positioning, ult timing, cooldown tracking, team comp synergy.',
    r6: 'Rainbow Six Siege ranked — focus on operator picks, ban-phase strategy, site setups, drone discipline, utility timing (Thatcher EMP / Thermite / Bandit-trick combos), spawn-peek windows.',
    tk8: 'Tekken 8 — focus on punish flows, frame data, matchup-specific punish strings, neutral game positioning, wall-game pressure.',
    apex: 'Apex Legends ranked — focus on rotation reads, edge fights, third-party awareness, legend synergy, ring positioning.',
    dota2: 'Dota 2 — focus on lane priority, item timings, ward placement, rotation reads, draft strategy.',
  }[post.gameTag] || 'competitive multiplayer game — focus on tactical decision-making and game-sense fundamentals.'

  const prompt = `You're helping me write a Reddit comment for r/${post.sub}. I run a coaching SaaS but my comments are PURE VALUE — NEVER mention any website, tool, or product. Just genuine tactical insight that builds my reputation as someone who knows the game.

GAME CONTEXT: ${gameContext}

POST TITLE: ${post.title}

POST BODY: ${post.selftext || '(image/link post — react to the title)'}

Write a 120-180 word Reddit comment that:
1. Opens by validating the OP's framing (no condescension)
2. Adds a SPECIFIC tactical insight they probably haven't considered (named operators/heroes/items, real numbers, concrete situations)
3. Avoids generic advice — specificity is what gets upvoted
4. Ends with a question that invites the OP to share more (drives reply engagement = upvote multiplier)
5. NO links, NO mentions of any tool/site/app
6. Uses casual Reddit voice — contractions, occasional bolded keyword, NOT corporate

Output ONLY the comment text — no preamble, no "Here's a draft:", no quotes around it. Just the comment ready to copy-paste.`

  try {
    const res = await bedrock.send(new InvokeModelCommand({
      modelId: BEDROCK_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    }))
    const payload = JSON.parse(new TextDecoder().decode(res.body))
    const text = payload?.content?.[0]?.text || ''
    return text.trim() || null
  } catch (err) {
    console.warn(`Draft failed for "${post.title.slice(0, 40)}":`, err.message)
    return null
  }
}

function htmlEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderDigestHtml(picks, generatedAt) {
  const rows = picks.map((p, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td>
        <div class="title"><a href="${htmlEscape(p.url)}" target="_blank" rel="noopener">${htmlEscape(p.title)}</a></div>
        <div class="meta">
          <span class="sub">r/${htmlEscape(p.sub)}</span>
          <span class="game">${htmlEscape(p.gameTag.toUpperCase())}</span>
          <span class="score">score ${p.score}</span>
          <span class="upvotes">↑ ${p.ups}</span>
          <span class="age">${p.ageHours.toFixed(1)}h ago</span>
          ${p.flair ? `<span class="flair">${htmlEscape(p.flair)}</span>` : ''}
        </div>
        ${p.selftext ? `<div class="body">${htmlEscape(p.selftext).slice(0, 300)}${p.selftext.length > 300 ? '…' : ''}</div>` : ''}
        ${p.draft ? `
          <div class="draft-wrap">
            <div class="draft-label">✏️ Ready-to-post draft (review, edit, paste into Reddit)</div>
            <textarea class="draft-text" readonly onclick="this.select()">${htmlEscape(p.draft)}</textarea>
          </div>
        ` : '<div class="draft-pending">Draft generation pending — set REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD env vars on the Lambda to enable.</div>'}
        <div class="action">
          <a class="btn" href="${htmlEscape(p.url)}" target="_blank" rel="noopener">Open on Reddit →</a>
          ${p.draft ? '<span class="hint">Click the draft to select-all → copy → paste in Reddit → edit → post.</span>' : ''}
        </div>
      </td>
    </tr>
  `).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Recon 6 Reddit Watcher — ${generatedAt}</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    body { font: 14px/1.5 -apple-system, system-ui, sans-serif; background: #0a0f19; color: #ecedf3; max-width: 880px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 1.6rem; margin: 0 0 4px; color: #00e5ff; }
    .gen { font-size: 0.78rem; color: rgba(230,233,239,0.55); margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 14px 12px; vertical-align: top; border-bottom: 1px solid rgba(0,229,255,0.15); }
    td.rank { font-family: ui-monospace, monospace; font-size: 1.4rem; color: rgba(0,229,255,0.85); width: 36px; font-weight: 800; }
    .title { font-size: 1.05rem; font-weight: 700; margin-bottom: 4px; }
    .title a { color: #ecedf3; text-decoration: none; }
    .title a:hover { color: #00e5ff; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.72rem; color: rgba(230,233,239,0.6); margin-bottom: 8px; }
    .meta span { padding: 2px 7px; background: rgba(255,255,255,0.04); border-radius: 4px; }
    .sub { color: #ffa67a !important; }
    .game { color: #ffc97a !important; }
    .body { font-size: 0.86rem; color: rgba(230,233,239,0.75); margin-top: 4px; padding: 6px 10px; background: rgba(255,255,255,0.02); border-left: 2px solid rgba(0,229,255,0.3); }
    .action { margin-top: 8px; display: flex; align-items: center; gap: 12px; }
    .btn { display: inline-block; padding: 5px 12px; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.5); border-radius: 6px; color: #00e5ff; font-weight: 700; text-decoration: none; font-size: 0.82rem; }
    .hint { font-size: 0.75rem; color: rgba(230,233,239,0.5); }
    .empty { padding: 24px; background: rgba(255,180,80,0.06); border: 1px dashed rgba(255,180,80,0.3); border-radius: 8px; color: rgba(230,233,239,0.75); }
    .draft-wrap { margin-top: 10px; padding: 10px 12px; background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.25); border-radius: 6px; }
    .draft-label { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: #00e5ff; margin-bottom: 6px; }
    .draft-text { width: 100%; box-sizing: border-box; min-height: 120px; padding: 8px 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,229,255,0.3); border-radius: 4px; color: #ecedf3; font-family: ui-monospace, monospace; font-size: 0.82rem; line-height: 1.5; resize: vertical; }
    .draft-pending { margin-top: 8px; padding: 6px 10px; background: rgba(255,180,80,0.06); border-left: 2px solid #ffc97a; font-size: 0.75rem; color: rgba(230,233,239,0.7); }
  </style>
</head>
<body>
  <h1>🔍 Recon 6 Reddit Watcher</h1>
  <div class="gen">Top ${picks.length} high-fit posts · Generated ${generatedAt} UTC · Refreshes every 4 hours · Powered by Reddit JSON API (read-only)</div>
  ${picks.length === 0
    ? '<div class="empty">No high-fit posts right now. Check back in 4 hours.</div>'
    : `<table>${rows}</table>`
  }
</body>
</html>`
}

export const handler = async () => {
  console.log('Reddit watcher starting…')
  const allPicks = []
  for (const target of TARGET_SUBS) {
    try {
      const posts = await fetchSubHot(target.sub)
      console.log(`r/${target.sub}: ${posts.length} posts fetched`)
      for (const p of posts) {
        const score = scorePost(p, target.gameTag)
        if (score < 8) continue // floor — anything below this isn't worth Aaron's time
        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600
        allPicks.push({
          sub: target.sub,
          gameTag: target.gameTag,
          subPriority: target.priority,
          title: p.title,
          selftext: (p.selftext || '').slice(0, 600),
          url: `https://www.reddit.com${p.permalink}`,
          ups: p.ups || 0,
          numComments: p.num_comments || 0,
          ageHours,
          flair: p.link_flair_text || '',
          score,
        })
      }
    } catch (err) {
      console.error(`r/${target.sub} fetch error:`, err.message)
    }
  }

  // Sort by score descending, take top 12, dedupe by URL
  const seen = new Set()
  const top = allPicks
    .sort((a, b) => b.score - a.score)
    .filter((p) => {
      if (seen.has(p.url)) return false
      seen.add(p.url)
      return true
    })
    .slice(0, 12)

  // Phase 2: auto-draft comments for the top DRAFT_TOP_N posts via Bedrock.
  // Runs in parallel — Lambda has plenty of compute and the calls are
  // independent. Each draft adds ~2-4s; parallelized = ~5s total max.
  if (top.length > 0) {
    console.log(`Drafting comments for top ${Math.min(DRAFT_TOP_N, top.length)} posts…`)
    const draftPromises = top.slice(0, DRAFT_TOP_N).map(async (post, idx) => {
      const draft = await draftComment(post)
      if (draft) top[idx].draft = draft
    })
    await Promise.all(draftPromises)
    const draftedCount = top.filter((p) => p.draft).length
    console.log(`Drafted ${draftedCount}/${Math.min(DRAFT_TOP_N, top.length)} comments`)
  }

  const generatedAt = new Date().toISOString()
  const today = generatedAt.slice(0, 10)

  // Write both an HTML view (human-readable) and a JSON sidecar (Phase 2
  // will consume this to draft comments via Bedrock).
  const html = renderDigestHtml(top, generatedAt)
  const jsonPayload = JSON.stringify({ generatedAt, picks: top }, null, 2)

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'reddit-digest/latest.html',
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      // No-cache so refreshes always pull the fresh version
      CacheControl: 'no-cache, must-revalidate',
    }))
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `reddit-digest/${today}.html`,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
    }))
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'reddit-digest/latest.json',
      Body: jsonPayload,
      ContentType: 'application/json',
      CacheControl: 'no-cache, must-revalidate',
    }))
  } catch (err) {
    console.error('S3 write failed:', err)
    throw err
  }

  console.log(`Wrote digest with ${top.length} picks`)
  return {
    statusCode: 200,
    body: JSON.stringify({
      picks: top.length,
      digestUrl: `https://r6coaching.com/reddit-digest/latest.html`,
    }),
  }
}
