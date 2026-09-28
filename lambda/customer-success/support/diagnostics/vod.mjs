// VOD review provider.
//
// What production records (and nothing more):
//   - a usage counter on the subscription row (vod_sessions_used /
//     vod_lifetime_used, vod_period_start_at, vod_updated_at), reserved
//     BEFORE the model call;
//   - player-data `vod_reviewed` events (recon-player-events) for completed
//     reviews;
//   - a review archive table (often empty) - read only if the deployment wires
//     an optional `tables.vodReviewArchive(email)`; otherwise "not connected".
// There are NO job ids, request ids or stored failure records.

import { computeVodUsage, createPlanCatalog, pickBestSub } from '../../domain/plans.mjs'
import { dateOnly, fact, inference, isoOrNull, NOT_RECORDED, panel, sourceData, sourceStatus, toMs } from './shared.mjs'

const DEFAULT_CATALOG = createPlanCatalog()

export function vodEvidence({ row = null, events = [], plan = 'free', tierScope = 'single', now = Date.now(), limits, eventsTruncated = false } = {}) {
  const usage = plan && plan !== 'free' ? computeVodUsage(row, plan, tierScope, { now, limits }) : null
  const periodStartMs = row?.trial === true ? NaN : toMs(row?.vod_period_start_at)
  const reviews = (Array.isArray(events) ? events : []).filter((e) => e?.event_type === 'vod_reviewed')
    .map((e) => ({ at: toMs(e.occurred_at), id: e.event_id || e.event_key || null, map: e.data?.detected_map || null }))
    .filter((e) => Number.isFinite(e.at))
    .sort((a, b) => b.at - a.at)
  const inPeriod = Number.isFinite(periodStartMs) ? reviews.filter((r) => r.at >= periodStartMs) : reviews
  const used = usage ? Number(usage.used || 0) : 0
  const gap = usage && !usage.unlimited ? Math.max(0, used - inPeriod.length) : 0
  return {
    usage,
    counterUpdatedAt: isoOrNull(row?.vod_updated_at),
    periodStartAt: Number.isFinite(periodStartMs) ? new Date(periodStartMs).toISOString() : null,
    reviewRecordsInPeriod: inPeriod.length,
    lastReviewAt: reviews[0] ? new Date(reviews[0].at).toISOString() : null,
    lastReviewId: reviews[0]?.id || null,
    lastReviewMap: reviews[0]?.map || null,
    unmatchedUsage: gap,
    eventsTruncated,
  }
}

export async function vodProvider({ one, facts, ctx, now, identity }) {
  const billingStatus = sourceStatus(one, 'billing')
  if (billingStatus !== 'ok' || !facts) {
    return panel('vod', 'AI VOD review', billingStatus === 'not_connected' ? 'not_connected' : 'unavailable', {
      facts: [fact('VOD usage', 'could not be read right now', 'ghost-igl-subscriptions', null, 'player')],
    })
  }
  const plan = facts.billing.plan || 'free'
  if (plan === 'free' && !facts.identity.isAdmin) {
    return panel('vod', 'AI VOD review', 'ok', {
      facts: [fact('AI VOD review', 'not included on your current plan', 'Recon membership record', null, 'player')],
      signals: { vodIncluded: false },
    })
  }
  const rows = Array.isArray(sourceData(one, 'billing')) ? sourceData(one, 'billing') : []
  const row = pickBestSub(rows, { catalog: ctx?.catalog || DEFAULT_CATALOG, now })
  const playerStatus = sourceStatus(one, 'player')
  const events = playerStatus === 'ok' ? sourceData(one, 'player')?.events || [] : []
  const ev = vodEvidence({ row, events, plan, tierScope: facts.billing.tierScope, now, limits: ctx?.config?.vodLimits, eventsTruncated: events.length >= 50 })

  let archive = { status: 'not_connected', count: null }
  if (typeof ctx?.tables?.vodReviewArchive === 'function') {
    try {
      const items = await ctx.tables.vodReviewArchive(identity?.email || facts.identity.email)
      archive = { status: 'ok', count: Array.isArray(items) ? items.length : 0 }
    } catch {
      archive = { status: 'unavailable', count: null }
    }
  }

  const u = ev.usage
  const out = []
  if (u && !u.unlimited) out.push(fact('Reviews used this period', `${u.used} of ${u.limit}`, 'usage counter on your membership', ev.counterUpdatedAt, 'player'))
  if (u?.periodEnd) out.push(fact('Allowance resets', dateOnly(u.periodEnd), 'usage counter on your membership', null, 'player'))
  out.push(fact('Last completed review', ev.lastReviewAt ? dateOnly(ev.lastReviewAt) : 'none on record', 'Recon review history', ev.lastReviewAt, 'player'))
  out.push(
    fact('Usage counter', u ? `${u.unlimited ? 'no usage row' : `${u.used}/${u.limit}`}; period start ${ev.periodStartAt || 'n/a'}; counter updated ${ev.counterUpdatedAt || NOT_RECORDED}` : 'n/a', 'ghost-igl-subscriptions vod_* fields', ev.counterUpdatedAt),
    fact('Completed review records this period', playerStatus === 'ok' ? String(ev.reviewRecordsInPeriod) : `could not be read (${playerStatus})`, 'recon-player-events vod_reviewed', ev.lastReviewAt),
    fact('Review archive', archive.status === 'ok' ? `${archive.count} item(s)` : archive.status === 'unavailable' ? 'could not be read' : 'not connected in this deployment', 'VOD review archive table'),
    fact('Review job / request ids', NOT_RECORDED, 'VOD Lambda (no job records exist)'),
    fact('Failed-review records', NOT_RECORDED, 'VOD Lambda (failures are not stored)'),
  )
  if (ev.lastReviewId) out.push(fact('Last review event id', ev.lastReviewId, 'recon-player-events', ev.lastReviewAt, 'engineering'))
  if (ev.lastReviewMap) out.push(fact('Last review map', ev.lastReviewMap, 'recon-player-events vod_reviewed', ev.lastReviewAt))

  const infs = []
  const user = []
  const recon = []
  if (playerStatus === 'ok' && ev.unmatchedUsage > 0) {
    infs.push(inference('Possible failed or unrecorded review(s)', `${ev.unmatchedUsage} counted use(s) without a completed review record`,
      'the usage counter is reserved before the model call; a use with no vod_reviewed event may be a failed review (or an event that did not reach player-data)',
      ev.eventsTruncated ? 0.35 : 0.55))
    recon.push('Engineering handoff (vod_ai): compare counted uses with completed review records for this period; no job ids or failure records exist to confirm.')
    user.push('If a review failed, try again with clear PNG or JPG screenshots from the same round.')
  }
  const nothingRecorded = u && (u.unlimited || (u.used === 0 && !ev.counterUpdatedAt)) && !ev.lastReviewAt
  const status = playerStatus !== 'ok' ? 'degraded' : nothingRecorded ? 'not_recorded' : 'ok'
  return panel('vod', 'AI VOD review', status, {
    facts: out,
    inferences: infs,
    user,
    recon,
    signals: { vodIncluded: true, vodUsed: u?.used ?? null, vodLimit: u?.limit ?? null, vodLastReviewAt: ev.lastReviewAt, vodUnmatchedUsage: ev.unmatchedUsage },
    context: { vod: ev },
  })
}
