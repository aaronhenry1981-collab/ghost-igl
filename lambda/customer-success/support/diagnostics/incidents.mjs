// Incidents provider (staff view): open incidents passed in by the caller.
// Incident customer-safe updates are drafts and are never shown to players.

import { fact, inference, panel } from './shared.mjs'

// Which incident services matter for which case categories.
export const SERVICE_FOR_CATEGORY = Object.freeze({
  ubisoft_connection: 'identity_ubisoft',
  psn_connection: 'identity_psn',
  xbox_connection: 'identity_xbox',
  trn_data: 'trn',
  rank_stat_discrepancy: 'trn',
  vod_upload: 'vod_processing',
  vod_analysis: 'vod_processing',
  ai_result: 'vod_processing',
  account_login: 'auth',
  email_verification: 'auth',
  access_entitlement: 'payment_access',
  subscription: 'payment_access',
  desktop_client: 'desktop_client',
})

export async function incidentsProvider({ incidents, category = null }) {
  if (!Array.isArray(incidents)) return panel('incidents', 'Known incidents', 'unavailable', { facts: [fact('Incidents', 'could not be read', 'SUP#INCIDENT')] })
  const open = incidents.filter((i) => i && i.status !== 'resolved')
  const service = category ? SERVICE_FOR_CATEGORY[category] || null : null
  const out = [fact('Open incidents', String(open.length), 'SUP#INCIDENT')]
  for (const i of open.slice(0, 5)) {
    out.push(fact(`Incident ${i.title || i.service || 'untitled'}`, `${i.service || 'other'} · ${i.status} · ${i.severity || 'sev?'}${i.workaround ? ` · workaround: ${i.workaround}` : ''}`, 'SUP#INCIDENT', i.updatedAt || i.createdAt))
    if (i.incidentId) out.push(fact('Incident id', i.incidentId, 'SUP#INCIDENT', null, 'engineering'))
  }
  const matching = service ? open.filter((i) => i.service === service) : []
  const infs = matching.map((i) => inference('Case likely related to an open incident', i.title || i.service, `case category maps to service ${service}`, 0.6))
  return panel('incidents', 'Known incidents', 'ok', {
    facts: out,
    inferences: infs,
    recon: matching.length ? ['Link this case to the matching incident instead of troubleshooting it alone.'] : [],
    signals: { openIncidentServices: [...new Set(open.map((i) => i.service).filter(Boolean))], matchingIncidentIds: matching.map((i) => i.incidentId).filter(Boolean) },
  })
}
