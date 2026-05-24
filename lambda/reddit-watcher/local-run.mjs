// Reddit watcher — LOCAL runner (no Reddit credentials needed).
//
// Why this exists: the Lambda version (index.mjs) needs Reddit OAuth
// because AWS datacenter IPs are blocked by Reddit (403). Your home PC
// has a residential IP that Reddit allows for unauthenticated reads of
// the public .json endpoints — so this version skips OAuth entirely.
//
// What it does (identical output to the Lambda):
//   1. Fetches hot posts from the target subs (plain fetch, no auth)
//   2. Scores them by comment-fit
//   3. Drafts comments for the top 8 via Bedrock (uses your LOCAL AWS
//      credentials — same ones the deploy script uses)
//   4. Uploads the digest HTML + JSON to S3 so it's live at
//      https://r6coaching.com/reddit-digest/latest.html
//
// HOW TO RUN:
//   node lambda/reddit-watcher/local-run.mjs
//
// HOW TO AUTOMATE (Windows Task Scheduler — runs every 4 hours):
//   See reddit-watcher-task.md in this folder for the one-time setup.
//
// Requires: Node 18+ (global fetch), AWS CLI configured locally
// (already true — the deploy script uses it).

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const REGION = 'us-east-1'
const BUCKET = 'r6coaching.com-site'
const BEDROCK_MODEL = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
const DRAFT_TOP_N = 8
// Descriptive User-Agent — Reddit blocks generic/empty UAs even from
// residential IPs. A specific one with contact info works fine.
const USER_AGENT = 'recon6-reddit-watcher/1.0 (local; contact aaronhenry1981@gmail.com)'

const s3 = new S3Client({ region: REGION })
const bedrock = new BedrockRuntimeClient({ region: REGION })

const TARGET_SUBS = [
  { sub: 'OverwatchUniversity', priority: 1, gameTag: 'ow2' },
  { sub: 'CompetitiveOverwatch', priority: 1, gameTag: 'ow2' },
  { sub: 'Overwatch', priority: 2, gameTag: 'ow2' },
  { sub: 'SiegeAcademy', priority: 1, gameTag: 'r6' },
  { sub: 'Rainbow6', priority: 2, gameTag: 'r6' },
  { sub: 'Tekken', priority: 2, gameTag: 'tk8' },
  { sub: 'CompetitiveApex', priority: 3, gameTag: 'apex' },
  { sub: 'learndota2', priority: 3, gameTag: 'dota2' },
]

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
  apex: { rotation: 3, fight: 2, edge: 2, ranked: 2, advice: 2, mistake: 3 },
  dota2: {
    laning: 3, draft: 3, macro: 4, ward: 2, rotation: 3, mid: 2,
    support: 2, carry: 2, advice: 2, mistake: 3,
  },
}

const POSITIVE_FLAIRS = ['question', 'discussion', 'help', 'advice', 'guide', 'esports', 'competitive']
const NEGATIVE_FLAIRS = ['meme', 'humor', 'highlight', 'fan content', 'fanart', 'news', 'leak', 'bug', 'art', 'cosmetics']

async function fetchSubHot(subName, limit = 25) {
  // Plain unauthenticated fetch — works from a residential IP. We use
  // old.reddit.com which is more lenient on unauthenticated JSON than
  // www.reddit.com, with a 1.2s polite delay between subs.
  const url = `https://www.reddit.com/r/${subName}/hot.json?limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) {
    console.warn(`  r/${subName}: fetch failed ${res.status}`)
    return []
  }
  const data = await res.json()
  return (data?.data?.children || []).map((c) => c.data)
}

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
  const flairBoost = POSITIVE_FLAIRS.some((f) => flairText.includes(f)) ? 5 : 0
  const questionBoost = post.title.trim().endsWith('?') ? 4 : 0
  const raw = (keywordScore * 1.5) + Math.min(upvotesPerHour, 50) * 0.5 + flairBoost + questionBoost
  const stalenessPenalty = ageHours > 24 ? (ageHours - 24) * 0.5 : 0
  return Math.max(0, Math.round(raw - stalenessPenalty))
}

async function draftComment(post) {
  const gameContext = {
    ow2: 'Overwatch 2 — focus on Stadium mode mechanics (Cash economy, Power picks, Item shop) if Stadium-related; otherwise hero positioning, ult timing, cooldown tracking, team comp synergy.',
    r6: 'Rainbow Six Siege ranked — focus on operator picks, ban-phase strategy, site setups, drone discipline, utility timing.',
    tk8: 'Tekken 8 — focus on punish flows, frame data, matchup-specific punishes, neutral game, wall pressure.',
    apex: 'Apex Legends ranked — focus on rotation reads, edge fights, third-party awareness, ring positioning.',
    dota2: 'Dota 2 — focus on lane priority, item timings, ward placement, rotation reads, draft strategy.',
  }[post.gameTag] || 'competitive game — focus on tactical decision-making.'

  const prompt = `You're helping me write a Reddit comment for r/${post.sub}. I run a coaching SaaS but my comments are PURE VALUE — NEVER mention any website, tool, or product. Just genuine tactical insight that builds my reputation.

GAME CONTEXT: ${gameContext}

POST TITLE: ${post.title}

POST BODY: ${post.selftext || '(image/link post — react to the title)'}

Write a 120-180 word Reddit comment that:
1. Opens by validating the OP's framing (no condescension)
2. Adds a SPECIFIC tactical insight (named operators/heroes/items, real numbers, concrete situations)
3. Avoids generic advice
4. Ends with a question that invites the OP to share more
5. NO links, NO mentions of any tool/site/app
6. Casual Reddit voice — contractions, occasional bolded keyword

Output ONLY the comment text, ready to copy-paste.`

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
    return (payload?.content?.[0]?.text || '').trim() || null
  } catch (err) {
    console.warn(`  draft failed: ${err.message}`)
    return null
  }
}

function htmlEscape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
            <div class="draft-head">
              <span class="draft-label">✏️ Ready-to-post draft</span>
              <button type="button" class="draft-copy" data-draft-id="${i}">📋 Copy draft</button>
            </div>
            <textarea class="draft-text" id="draft-${i}" readonly>${htmlEscape(p.draft)}</textarea>
          </div>` : ''}
        <div class="action">
          <a class="btn" href="${htmlEscape(p.url)}" target="_blank" rel="noopener">Open on Reddit →</a>
          ${p.draft ? '<span class="hint">Copy → open Reddit → paste → edit → post.</span>' : ''}
        </div>
      </td>
    </tr>`).join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
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
  .draft-wrap { margin-top: 10px; padding: 10px 12px; background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.25); border-radius: 6px; }
  .draft-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
  .draft-label { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: #00e5ff; }
  .draft-copy { background: #00e5ff; color: #0a0f19; border: 0; border-radius: 6px; padding: 6px 14px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: background 0.12s, transform 0.1s; white-space: nowrap; }
  .draft-copy:hover { background: #5cefff; transform: translateY(-1px); }
  .draft-copy.copied { background: #78dc8c; }
  .draft-text { width: 100%; box-sizing: border-box; padding: 10px 12px; background: rgba(0,0,0,0.35); border: 1px solid rgba(0,229,255,0.3); border-radius: 4px; color: #ecedf3; font-family: ui-monospace, monospace; font-size: 0.84rem; line-height: 1.55; resize: vertical; overflow: hidden; }
  .action { margin-top: 8px; display: flex; align-items: center; gap: 12px; }
  .btn { display: inline-block; padding: 5px 12px; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.5); border-radius: 6px; color: #00e5ff; font-weight: 700; text-decoration: none; font-size: 0.82rem; }
  .hint { font-size: 0.75rem; color: rgba(230,233,239,0.5); }
  .empty { padding: 24px; background: rgba(255,180,80,0.06); border: 1px dashed rgba(255,180,80,0.3); border-radius: 8px; }
</style></head><body>
  <h1>🔍 Recon 6 Reddit Watcher</h1>
  <div class="gen">Top ${picks.length} high-fit posts · Generated ${generatedAt} · Local run (no Reddit auth)</div>
  ${picks.length === 0 ? '<div class="empty">No high-fit posts right now. Re-run later.</div>' : `<table>${rows}</table>`}
  <script>
    // Auto-size every draft textarea to show the FULL comment — no
    // scrolling-inside-a-box, no manual highlight needed.
    document.querySelectorAll('.draft-text').forEach(function (ta) {
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 6) + 'px';
    });
    // One-click copy — grabs the full draft text to clipboard.
    document.querySelectorAll('.draft-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ta = document.getElementById('draft-' + btn.dataset.draftId);
        if (!ta) return;
        navigator.clipboard.writeText(ta.value).then(function () {
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = '📋 Copy draft';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(function () {
          // Clipboard API blocked — fall back to select + manual copy
          ta.select();
        });
      });
    });
  </script>
</body></html>`
}

async function main() {
  console.log('Reddit watcher (local) starting…')
  const allPicks = []
  for (const target of TARGET_SUBS) {
    try {
      const posts = await fetchSubHot(target.sub)
      console.log(`  r/${target.sub}: ${posts.length} posts`)
      for (const p of posts) {
        const score = scorePost(p, target.gameTag)
        if (score < 8) continue
        allPicks.push({
          sub: target.sub,
          gameTag: target.gameTag,
          title: p.title,
          selftext: (p.selftext || '').slice(0, 600),
          url: `https://www.reddit.com${p.permalink}`,
          ups: p.ups || 0,
          numComments: p.num_comments || 0,
          ageHours: (Date.now() / 1000 - p.created_utc) / 3600,
          flair: p.link_flair_text || '',
          score,
        })
      }
    } catch (err) {
      console.error(`  r/${target.sub} error: ${err.message}`)
    }
    // Polite 1.2s delay between subs — keeps us well within Reddit's
    // unauthenticated rate budget.
    await new Promise((r) => setTimeout(r, 1200))
  }

  const seen = new Set()
  const top = allPicks
    .sort((a, b) => b.score - a.score)
    .filter((p) => { if (seen.has(p.url)) return false; seen.add(p.url); return true })
    .slice(0, 12)

  console.log(`Found ${top.length} high-fit posts. Drafting comments for top ${Math.min(DRAFT_TOP_N, top.length)}…`)
  const draftPromises = top.slice(0, DRAFT_TOP_N).map(async (post, idx) => {
    const draft = await draftComment(post)
    if (draft) top[idx].draft = draft
  })
  await Promise.all(draftPromises)
  console.log(`Drafted ${top.filter((p) => p.draft).length} comments.`)

  const generatedAt = new Date().toISOString()
  const today = generatedAt.slice(0, 10)
  const html = renderDigestHtml(top, generatedAt)
  const json = JSON.stringify({ generatedAt, picks: top }, null, 2)

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: 'reddit-digest/latest.html', Body: html,
    ContentType: 'text/html; charset=utf-8', CacheControl: 'no-cache, must-revalidate',
  }))
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: `reddit-digest/${today}.html`, Body: html,
    ContentType: 'text/html; charset=utf-8',
  }))
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: 'reddit-digest/latest.json', Body: json,
    ContentType: 'application/json', CacheControl: 'no-cache, must-revalidate',
  }))

  console.log(`\n✅ Done. Digest live at: https://r6coaching.com/reddit-digest/latest.html`)
  console.log(`   (${top.length} posts, ${top.filter((p) => p.draft).length} with drafts)`)
}

main().catch((err) => {
  console.error('Watcher failed:', err)
  process.exit(1)
})
