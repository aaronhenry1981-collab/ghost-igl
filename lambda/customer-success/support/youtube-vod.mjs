import { HttpError } from '../lib/http.mjs'
import { normalizeYoutubeUrl } from './youtube-url.mjs'

export async function submitYoutubeVod({ ctx, service, identity, body }) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => k !== 'url')) throw new HttpError(400, 'Only a YouTube URL is accepted.')
  let video
  try { video = normalizeYoutubeUrl(body.url) } catch (err) { throw new HttpError(400, err.message) }
  const { facts } = await ctx.factsFor(identity)
  const billing = facts?.billing
  if (!identity.isAdmin && (!billing?.available || !billing.hasAccess || !['pro', 'elite', 'champion'].includes(billing.plan))) {
    throw new HttpError(403, 'An active Pro, Elite or Champion membership is required to submit a review link.')
  }
  // Existing persistent support store supplies owner isolation, rate limits,
  // atomic idempotency and the staff queue. No VOD quota or AI call is used.
  const receipt = await service.createCase(identity, {
    text: `YouTube Siege manual-review request\n${video.url}\nSaved link only. Video has not been downloaded or analyzed. Manual review requested; no turnaround promised.`,
    category: 'replay_upload',
    subcategory: 'youtube_manual_review',
    context: { page: '/vod', feature: 'youtube-vod' },
    clientRequestId: `youtube-vod-${video.videoId}`,
  })
  return { caseNumber: receipt.case.caseNumber, replayed: receipt.replayed === true, url: video.url, analysisCompleted: false }
}
