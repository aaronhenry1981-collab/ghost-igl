// Player Success & Support routes (docs/player-success/ARCHITECTURE.md §4).
//
// The whole module registers NO routes unless config.features.support is
// true, so with the flag off every path below is a plain 404.
//
// Identity always comes from the verified token (requireUser). Staff routes
// first require any support role (403 otherwise); the service then checks
// the specific permission for the action (roles.mjs). Player partitions are
// derived from the identity with ctx.keyFor (PR #24 contactKeyFor until the
// HMAC key lands), never from a path, query or body.
//
// Engines: `createSupportRoutes({ engines })` (tests), else
// ctx.supportEngines, else support/engines.mjs (real modules or stubs).

import { contactKeyFor } from '../lib/ids.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'
import { createSupportService, assertCaseNumber } from '../support/service.mjs'
import { isStaff, rolesFor } from '../support/roles.mjs'
import { INCIDENT_ID } from '../support/incidents.mjs'

const SMALL = 4 * 1024
const MEDIUM = 16 * 1024

export function createSupportRoutes({ engines = null } = {}) {
  return function supportRoutes({ ctx, requireUser }) {
    if (ctx.config?.features?.support !== true) return { routes: [] }

    let servicePromise = null
    const service = () => {
      servicePromise ||= (async () => createSupportService({
        ctx,
        now: () => ctx.now(),
        keyFor: ctx.keyFor || contactKeyFor,
        engines: engines || ctx.supportEngines || (await import('../support/engines.mjs')),
      }))()
      return servicePromise
    }

    async function requireStaff(req) {
      const identity = await requireUser(req)
      if (!isStaff(rolesFor(identity))) throw new HttpError(403, 'support role required')
      return identity
    }

    const caseNumberOf = (req) => assertCaseNumber(req.params.caseNumber)
    const bodyOf = (req, maxBytes = SMALL) => parseJsonBody(req.rawBody, { maxBytes })
    const incidentIdOf = (req) => {
      if (!INCIDENT_ID.test(String(req.params.id || ''))) throw new HttpError(400, 'invalid incident id')
      return req.params.id
    }

    const player = (method, path, fn, status = 200) => ({
      method,
      path,
      handler: async (req) => {
        const identity = await requireUser(req)
        return json(status, await fn(await service(), identity, req))
      },
    })
    const staff = (method, path, fn, status = 200) => ({
      method,
      path,
      handler: async (req) => {
        const identity = await requireStaff(req)
        return json(status, await fn(await service(), identity, req))
      },
    })
    const publicRoute = (method, path, fn) => ({
      method,
      path,
      handler: async (req) => json(200, await fn(await service(), req)),
    })

    const incidentPatch = (s, me, req) => s.updateIncident(me, incidentIdOf(req), bodyOf(req, MEDIUM))

    const routes = [
      // ---- player (own data only) ------------------------------------------------------
      player('POST', '/cs/me/support/triage', (s, me, req) => s.triage(me, bodyOf(req, MEDIUM))),
      {
        method: 'POST',
        path: '/cs/me/support/cases',
        handler: async (req) => {
          const me = await requireUser(req)
          const out = await (await service()).createCase(me, bodyOf(req, MEDIUM))
          return json(out.replayed ? 200 : 201, out)
        },
      },
      player('GET', '/cs/me/support/cases', (s, me) => s.listMyCases(me)),
      player('GET', '/cs/me/support/cases/{caseNumber}', (s, me, req) => s.getMyCase(me, caseNumberOf(req))),
      player('POST', '/cs/me/support/cases/{caseNumber}/messages', (s, me, req) => s.addPlayerMessage(me, caseNumberOf(req), bodyOf(req, MEDIUM)), 201),
      player('POST', '/cs/me/support/cases/{caseNumber}/attachments', (s, me, req) => s.requestAttachmentUpload(me, caseNumberOf(req), bodyOf(req))),
      player('POST', '/cs/me/support/cases/{caseNumber}/resolve-confirm', (s, me, req) => s.confirmResolved(me, caseNumberOf(req))),
      player('POST', '/cs/me/support/cases/{caseNumber}/reopen', (s, me, req) => s.reopen(me, caseNumberOf(req), bodyOf(req, MEDIUM))),
      player('POST', '/cs/me/support/cases/{caseNumber}/csat', (s, me, req) => s.submitCsat(me, caseNumberOf(req), bodyOf(req)), 201),

      // ---- Help Center (public; reviewed articles only) -----------------------------
      publicRoute('GET', '/cs/help/articles', (s, req) => s.searchHelpArticles({ q: req.query.q || '' })),
      publicRoute('GET', '/cs/help/articles/{slug}', (s, req) => s.getHelpArticle(req.params.slug)),

      // ---- staff -----------------------------------------------------------------------------
      staff('GET', '/cs/admin/support/queue', (s, me, req) => s.queue(me, req.query.view || 'unassigned')),
      staff('GET', '/cs/admin/support/cases/{caseNumber}', (s, me, req) => s.getCaseForStaff(me, caseNumberOf(req))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/messages', (s, me, req) => s.staffReply(me, caseNumberOf(req), bodyOf(req, MEDIUM)), 201),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/notes', (s, me, req) => s.addPrivateNote(me, caseNumberOf(req), bodyOf(req, MEDIUM)), 201),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/status', (s, me, req) => s.setStatus(me, caseNumberOf(req), bodyOf(req))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/assign', (s, me, req) => s.assign(me, caseNumberOf(req), bodyOf(req))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/escalate', (s, me, req) => s.escalate(me, caseNumberOf(req), bodyOf(req))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/link-incident', (s, me, req) => s.linkIncident(me, caseNumberOf(req), bodyOf(req))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/resolve', (s, me, req) => s.resolve(me, caseNumberOf(req), bodyOf(req, MEDIUM))),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/action-requests', (s, me, req) => s.createActionRequest(me, caseNumberOf(req), bodyOf(req)), 201),
      staff('POST', '/cs/admin/support/cases/{caseNumber}/action-requests/{requestId}/decision', (s, me, req) => s.decideActionRequest(me, caseNumberOf(req), req.params.requestId, bodyOf(req))),

      staff('GET', '/cs/admin/support/incidents', (s, me, req) => s.listIncidents(me, { status: req.query.status || null })),
      staff('POST', '/cs/admin/support/incidents', (s, me, req) => s.createIncident(me, bodyOf(req, MEDIUM)), 201),
      staff('GET', '/cs/admin/support/incidents/{id}', (s, me, req) => s.getIncident(me, incidentIdOf(req))),
      staff('PATCH', '/cs/admin/support/incidents/{id}', incidentPatch),
      // PUT alias kept for clients that cannot send PATCH (CORS allows both).
      staff('PUT', '/cs/admin/support/incidents/{id}', incidentPatch),
      staff('POST', '/cs/admin/support/incidents/{id}/timeline', (s, me, req) => s.addIncidentTimeline(me, incidentIdOf(req), bodyOf(req, MEDIUM)), 201),

      staff('GET', '/cs/admin/support/metrics', (s, me, req) => s.metrics(me, { from: req.query.from || null, to: req.query.to || null })),

      staff('GET', '/cs/admin/support/email/unmatched', (s, me) => s.listUnmatchedEmail(me)),
      staff('POST', '/cs/admin/support/email/unmatched/{id}/assign', (s, me, req) => s.assignUnmatched(me, req.params.id, bodyOf(req))),

      staff('GET', '/cs/admin/support/kb/proposals', (s, me, req) => s.listKbProposals(me, { status: req.query.status || null })),
      staff('POST', '/cs/admin/support/kb/proposals/{id}/decision', (s, me, req) => s.decideKbProposal(me, req.params.id, bodyOf(req))),

      // Dry run unless dryRun=0 explicitly; creation also needs support.proactive.
      staff('POST', '/cs/admin/support/proactive/run', (s, me, req) => s.runProactive(me, { dryRun: String(req.query.dryRun ?? '1') !== '0' })),

      // Lead/admin. Dry run unless dryRun=0 explicitly; audited either way.
      staff('POST', '/cs/admin/support/maintenance/auto-close', (s, me, req) => s.runAutoClose(me, { dryRun: String(req.query.dryRun ?? '1') !== '0' })),
    ]

    return { routes }
  }
}

export const supportRoutes = createSupportRoutes()
