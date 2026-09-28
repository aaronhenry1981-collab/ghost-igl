// One canonical, dated timeline per player, merged from every source. Each
// entry names its source so nothing looks more certain than it is.

import { toMs } from './facts.mjs'

const EVENT_TITLES = {
  joined_recon: 'Player record created',
  identity_linked: 'Linked an external game identity',
  vod_reviewed: 'VOD review completed',
  coaching_session_completed: 'Coached match recorded',
  road_to_champion_progress_updated: 'Road to Champion updated',
  external_profile_refreshed: 'External profile refreshed',
}

export function buildTimeline({ facts, rows = [], cognito = null, profile = null, bookings = [], playerEvents = [], legacy = null, cs = null, limit = 120 }) {
  const out = []
  const push = (at, kind, title, detail, source) => {
    const ms = toMs(at)
    if (Number.isFinite(ms)) out.push({ at: new Date(ms).toISOString(), kind, title, detail: detail || null, source })
  }

  push(cognito?.createdAt, 'account', 'Account created', cognito?.status ? `Login status ${cognito.status}` : null, 'Cognito')
  if (!cognito?.createdAt) push(profile?.created_at, 'account', 'Profile created', null, 'Profiles')
  push(profile?.last_seen_at, 'activity', 'Last opened the app', null, 'Profiles')

  for (const row of rows) {
    const label = row.comp === true ? (row.trial === true ? 'Trial' : 'Complimentary access') : 'Subscription'
    push(row.created_at, 'billing', `${label} started`, [row.plan, row.price_id].filter(Boolean).join(' · '), 'Webhook ledger')
    if (row.updated_at && row.updated_at !== row.created_at) {
      push(row.updated_at, 'billing', `${label} status: ${row.status}`, row.current_period_end ? `Paid through ${String(row.current_period_end).slice(0, 10)}` : null, 'Webhook ledger')
    }
  }

  for (const event of playerEvents) {
    const title = EVENT_TITLES[event.event_type]
    if (!title) continue
    const map = event.data?.detected_map
    push(event.occurred_at, 'product', title, map ? `Map: ${map}` : null, 'Player data')
  }

  for (const b of bookings) {
    const slot = String(b.slotId || '').split('#')[0]
    push(b.createdAt || b.confirmedAt || slot, 'coaching', `Coaching session ${b.status}`, `Session time ${slot.replace('T', ' ').slice(0, 16)} UTC`, 'Bookings')
  }

  if (legacy) {
    push(legacy.welcome_sent_at, 'outreach', 'Welcome email sent', 'Sent by the existing daily CRM job', 'Legacy CRM')
    push(legacy.confirm_nudge_at, 'outreach', 'Email-confirmation nudge sent', `${legacy.confirm_nudges || 1} nudge(s) total`, 'Legacy CRM')
    push(legacy.winback_sent_at, 'outreach', 'Win-back email sent', 'Sent by the existing daily CRM job', 'Legacy CRM')
    push(legacy.orphan_first_seen_at, 'access', 'Flagged: paid without a site login', legacy.orphan_reason || null, 'Legacy CRM')
    push(legacy.marketing_suppressed_at, 'consent', 'Marketing email suppressed', null, 'Legacy CRM')
  }

  const climb = facts?.activity?.roadToChampion
  if (climb?.updatedAt && !playerEvents.some((e) => e.event_type === 'road_to_champion_progress_updated')) {
    push(climb.updatedAt, 'product', 'Road to Champion updated', `${climb.tasksDone} of ${climb.tasksTotal} habits`, 'Road to Champion')
  }

  if (cs) {
    const byDay = new Map()
    for (const a of cs.activity || []) {
      const day = String(a.at).slice(0, 10)
      const k = `${day}|${a.type}`
      byDay.set(k, { at: a.at, type: a.type, count: (byDay.get(k)?.count || 0) + 1 })
    }
    const names = { strat_viewed: 'round plan', match_prep_opened: 'match prep', live_coach_opened: 'live round guide' }
    for (const v of byDay.values()) {
      push(v.at, 'product', `Opened ${v.count} ${names[v.type] || v.type}${v.count === 1 ? '' : 's'}`, null, 'Recon activity')
    }
    for (const m of cs.messages || []) {
      push(m.createdAt, 'conversation', m.direction === 'inbound' ? 'Player message' : 'Message to player', m.subject || m.bodyPreview || null, m.channel === 'email' ? 'Email' : 'In-app')
    }
    for (const o of cs.outreach || []) {
      push(o.updatedAt || o.createdAt, 'outreach', `Outreach: ${o.workflowName || o.workflowId}`, `Status ${o.status}${o.statusReason ? ` (${o.statusReason})` : ''}`, 'Customer success')
    }
    for (const f of cs.feedback || []) {
      const scores = [Number.isFinite(f.answers?.helpful) ? `helpful ${f.answers.helpful}/5` : null, Number.isFinite(f.answers?.nps) ? `recommend ${f.answers.nps}/10` : null].filter(Boolean).join(', ')
      push(f.createdAt, 'feedback', `Feedback (${f.moment})`, scores || null, 'In-product feedback')
    }
    for (const d of cs.decisions || []) {
      push(d.decidedAt, 'decision', `Queue decision: ${d.decision}`, d.itemTitle || d.itemKey, `Admin ${d.actor || ''}`.trim())
    }
    if (cs.consent?.updatedAt) {
      push(cs.consent.updatedAt, 'consent', 'Contact preferences updated', cs.consent.doNotContact ? 'Do not contact' : null, 'Customer success')
    }
  }

  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}
