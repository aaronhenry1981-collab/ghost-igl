// Reddit reply helper — drafts a reply to whoever responded to your
// Reddit comment, so you don't have to ask Claude in chat every time.
//
// HOW TO USE:
//   1. On the Reddit thread, highlight from YOUR comment down through
//      the reply you want to answer (just click-drag over the text).
//   2. Ctrl+C to copy it.
//   3. Double-click reply-helper.bat (or run: node reply-helper.mjs)
//   4. The drafted reply is printed AND copied to your clipboard.
//   5. Paste it into the Reddit reply box, edit if you want, post.
//
// It reads/writes the Windows clipboard via PowerShell, and drafts via
// Bedrock Claude using your local AWS credentials (same as the watcher).
//
// Your Reddit username is set below so the AI knows which comment in the
// pasted thread is YOURS vs the person you're replying to.

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { execFileSync } from 'node:child_process'

const REGION = 'us-east-1'
const BEDROCK_MODEL = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
// Your Reddit account — used so the AI can tell your comment apart from
// the reply you're answering. Update if you post from a different account.
const MY_REDDIT_USERNAME = 'Scared-Bag-2937'

const bedrock = new BedrockRuntimeClient({ region: REGION })

function readClipboard() {
  try {
    return execFileSync('powershell', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    })
  } catch {
    return ''
  }
}

function writeClipboard(text) {
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', '$input | Set-Clipboard'], {
      input: text,
      encoding: 'utf8',
    })
    return true
  } catch {
    return false
  }
}

async function draftReply(threadText) {
  const prompt = `You're helping me write a reply on a Reddit thread. My Reddit username is "${MY_REDDIT_USERNAME}". Below is a thread I copied — it includes my earlier comment and someone's reply to it.

I run a coaching SaaS but my comments are PURE VALUE — NEVER mention any website, tool, or product. Just genuine conversation that builds my reputation as someone who knows the game.

THREAD (copied from Reddit):
"""
${threadText}
"""

Write a reply to the MOST RECENT comment that is NOT mine. The reply should:
1. Continue the conversation naturally — react to what they actually said, don't restart
2. Add one more specific insight or observation (named operators/heroes/items, concrete situations) — don't just agree
3. Match a casual Reddit voice — contractions, occasional bolded keyword
4. 80-150 words — replies are shorter than top-level comments
5. End with a question ONLY if the conversation has natural energy to continue. If it's winding down, end with a clean statement instead — a forced question reads as desperate
6. NO links, NO mentions of any tool/site/app, NO "as a coach" framing
7. Don't be sycophantic — "great point!" with nothing after it is filler. Respect them by actually engaging

Output ONLY the reply text, ready to copy-paste. No preamble, no quotes around it.`

  const res = await bedrock.send(new InvokeModelCommand({
    modelId: BEDROCK_MODEL,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  }))
  const payload = JSON.parse(new TextDecoder().decode(res.body))
  return (payload?.content?.[0]?.text || '').trim()
}

async function main() {
  const threadText = readClipboard().trim()
  if (!threadText || threadText.length < 30) {
    console.log('\n⚠  Clipboard is empty or too short.')
    console.log('   Highlight the Reddit thread (your comment + the reply),')
    console.log('   press Ctrl+C, then run this again.\n')
    process.exit(1)
  }

  console.log('\nDrafting reply…\n')
  const reply = await draftReply(threadText)
  if (!reply) {
    console.log('⚠  Draft failed — try again.\n')
    process.exit(1)
  }

  const copied = writeClipboard(reply)
  console.log('─'.repeat(64))
  console.log(reply)
  console.log('─'.repeat(64))
  console.log(copied
    ? '\n✅ Reply copied to clipboard — paste it into Reddit, edit, post.\n'
    : '\n✅ Reply drafted above — copy it manually (clipboard write failed).\n')
}

main().catch((err) => {
  console.error('\n⚠  Error:', err.message, '\n')
  process.exit(1)
})
