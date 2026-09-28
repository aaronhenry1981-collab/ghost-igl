# Player Success & Support: API contract

**Status:** review-only. Nothing here is deployed or routed in API Gateway. With `features.support` off (the default), every path below returns the app's catch-all `404 { "error": "not found" }`.

**Source of truth:** the backend in `lambda/customer-success` (`routes/support.mjs` → `support/service.mjs` → engines). This document and the frontend fixtures are checked against it:

- `node scripts/support/generate-fixtures.mjs` runs the real backend in memory (`createApp` + support routes + real engine modules) over fictional data, drives a scripted scenario over HTTP, and writes the responses to `src/features/support/fixtures/generated/*.json`. It also rewrites the **Response shapes** block at the end of this file. `--check` exits 1 if any of them drifted.
- `src/features/support/contract.mjs` lists every field the UI reads. `src/features/support/contract.test.mjs` checks the committed snapshots against it. `scripts/support/contract.test.mjs` checks a fresh backend run against it, checks that the committed snapshots are current and the generator is deterministic, and checks that the UI's copies of the backend vocabularies are equal to the backend's (categories, resolution codes, queue views, teams, action kinds, attachment types, statuses, buckets, staff transitions).

## Conventions

- **Base:** the customer-success HTTP API (`VITE_CUSTOMER_SUCCESS_API_URL`). All paths start with `/cs`.
- **Auth:** `Authorization: Bearer <Cognito ID token>`. The player is always derived from the verified token. No route takes a player identifier. Staff routes need a support role from Cognito groups (`support-agent`, `support-billing`, `support-engineering`, `support-lead`, or `admins`). The service then checks the specific permission (`support/roles.mjs`).
- **Bodies:** JSON objects, limited to 4 KB or 16 KB per route. Unknown fields are a `400` (`unknown field x`).
- **Errors:** `{ "error": string, "code"?: string }`. The UI branches on these:

  | Status | Code | Meaning |
  |---|---|---|
  | 400 | (none), `closed_needs_text` | Validation failed (including text that is empty once bidi / zero-width characters are removed, and `malformed path encoding` for a bad `%` sequence in a path parameter) |
  | 401 | | Not signed in |
  | 403 | | Role or permission missing (`support role required`) |
  | 403 | `four_eyes_required` | The requester tried to authorize their own action request; another lead or admin must do it |
  | 404 | | `{ error: 'not found' }` = the flag is off or there is no such route. `case not found`, `article not found` and `incident not found` = that record is missing or belongs to someone else. |
  | 409 | `version_conflict` | The `version` sent is stale. Reload the case. |
  | 409 | `transition_refused`, `already_rated`, `not_resolved`, `in_progress`, `duplicate`, `invalid_state`, `proactive_disabled` | State conflicts |
  | 413 | | Request or file too large |
  | 429 | `rate_limited` | 5 new cases or 30 messages per player per day (rolling 24 hours, and an atomic per-UTC-day cap that holds under concurrent requests; a case's opening message and attached email count as messages) |
  | 503 | | A cross-contact list is larger than the hard safety bound (25,000 items), or the player directory is unavailable |

- **CORS:** `GET, POST, PUT, PATCH, OPTIONS`. `PUT` stays as an alias of `PATCH` for incident updates.
- **Caching:** every response is `Cache-Control: no-store`.
- **Timestamps:** ISO-8601 UTC. Date-only values (`2026-10-16`) appear only inside diagnostic fact values.
- **Internal only:** SLA clocks (`sla`, `slaState`) are never in a player response and are never quoted to a player.

## Routes

### Player (own data only)

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/cs/me/support/triage` | `{ text, category?, context?: { page?, feature?, platform?, appVersion? } }` | 200: triage. No case is created. |
| POST | `/cs/me/support/cases` | `{ text, category?, subcategory?, answers?: { [id]: string }, context?, clientRequestId }` | 201 `{ replayed: false, case }`, or 200 `{ replayed: true, case }` when the same clientRequestId is sent again |
| GET | `/cs/me/support/cases` | | 200 `{ buckets: { open, waiting_on_recon, waiting_on_me, resolved, closed }, labels, total }` |
| GET | `/cs/me/support/cases/{caseNumber}` | | 200: the player projection (case + actions + timeline + uploads + player-safe diagnostics). Every timeline event carries `visibility: 'public'`; the client renders only events with that mark and an allowlisted kind. A proactive case shows player-safe copy, never the rule's evidence. |
| POST | `…/{caseNumber}/messages` | `{ text, clientRequestId }` | 201 `{ replayed, caseNumber, eventId, status, linkedCaseNumber }`. On a closed case, `linkedCaseNumber` + `linkedCase` (a new linked case). `clientRequestId` is idempotent per case: the same id on another case is a new message. |
| POST | `…/{caseNumber}/attachments` | `{ name, mime, size }` | 200 `{ status: 'upload_disabled' }` while storage is off |
| POST | `…/{caseNumber}/resolve-confirm` | | 200: the player projection (closed) |
| POST | `…/{caseNumber}/reopen` | `{ text? }` | 200 `{ reopened, linkedCaseNumber, case }` |
| POST | `…/{caseNumber}/csat` | `{ rating: 1..5 \| 'up' \| 'down', comment? }` | 201 `{ ok, rating }` |

### Help Center (public, no token)

| Method | Path | Success |
|---|---|---|
| GET | `/cs/help/articles?q=` | 200 `{ q, articles: [{ slug, title, summary, category, status }], status }`. With no `q`, lists every servable article. |
| GET | `/cs/help/articles/{slug}` | 200: the article `{ slug, title, category, intents, summary, keywords, body, status, reviewedBy, sources }`, or 404 |

Only `status: 'reviewed'` articles are served. Every article is still a draft, so production returns `articles: []`. Drafts are served only when a **dev-only engines override** sets `helpPreview: true` (`previewEngines` in the generator). Those responses carry `preview: true`. The production `engines.mjs` never sets it, and a test asserts that.

### Staff

| Method | Path | Permission | Body | Success |
|---|---|---|---|---|
| GET | `/cs/admin/support/queue?view=` | queue.read | | `{ view, me, cases: [row], counts }` |
| GET | `/cs/admin/support/cases/{n}` | case.read | | `{ me, case, timeline, attachments, uploads, audit, actionRequests, player360, previousCases, incident, diagnostics, copilot, permissions }` |
| POST | `…/{n}/messages` | case.reply | `{ text, thenStatus?, clientRequestId? }` | 201 `{ ok, eventId, status, delivery: 'case_timeline_only' }` |
| POST | `…/{n}/notes` | case.note | `{ text, clientRequestId? }` | 201 `{ ok, eventId }` |
| POST | `…/{n}/status` | case.status | `{ status, reason?, version? }` | the staff case view |
| POST | `…/{n}/assign` | case.assign | `{ assignee?: 'me' \| email \| null, team?, version? }` | the staff case view |
| POST | `…/{n}/escalate` | case.escalate | `{ team, reason, version? }` | `{ case, handoff }`. The hand-off is built by the server. |
| POST | `…/{n}/link-incident` | case.link_incident | `{ incidentId, version? }` | the staff case view |
| POST | `…/{n}/resolve` | case.resolve | `{ summary, code, learning?, rootCause?, version? }` | `{ case, kbProposal }` |
| POST | `…/{n}/action-requests` | action.request (+ action.request.billing for billing kinds) | `{ kind, reason }` | 201: the action request |
| POST | `…/{n}/action-requests/{id}/decision` | action.authorize / reject / record_done | `{ decision, note? }` | the action request |
| GET / POST | `/cs/admin/support/incidents` | incident.read / incident.write | create: `{ title, service, status?, severity?, owner?, affectedCount?, workaround?, internalNotes?, customerUpdateDraft? }` | `{ incidents: [...+linkedCaseCount] }` / the incident |
| GET | `/cs/admin/support/incidents/{id}` | incident.read | | `{ incident, timeline, linkedCases }` |
| PATCH (PUT alias) | `/cs/admin/support/incidents/{id}` | incident.write | partial create body | the incident |
| POST | `/cs/admin/support/incidents/{id}/timeline` | incident.write | `{ kind?: 'note' \| 'customer_update_draft', text }` | 201: the timeline entry |
| GET | `/cs/admin/support/metrics?from=&to=` | metrics.read (lead) | | the metrics object |
| GET | `/cs/admin/support/email/unmatched` | email.unmatched.read | | `{ items }` |
| POST | `/cs/admin/support/email/unmatched/{id}/assign` | email.unmatched.assign | `{ caseNumber }` | `{ ok, caseNumber, eventId }` (added as a staff-only event) |
| GET | `/cs/admin/support/kb/proposals?status=` | kb.read | | `{ proposals, trendProposals }` |
| POST | `/cs/admin/support/kb/proposals/{id}/decision` | kb.decide (lead) | `{ decision: 'accept' \| 'reject', note? }` | the proposal (never published) |
| POST | `/cs/admin/support/proactive/run?dryRun=` | proactive.run (lead) | | a dry run unless `dryRun=0` **and** `support.proactive` is on |
| POST | `/cs/admin/support/maintenance/auto-close?dryRun=` | maintenance.run (lead) | | a dry run unless `dryRun=0`. `{ dryRun, checkedAt, due, closed, skipped }`. The run is audited. |

`version` is optional everywhere. When it is sent and does not equal the stored `case.version`, the write is refused with `409 version_conflict`. Without it, the store's own version condition still prevents lost updates.

## Decisions per mismatched field

The frontend was first written against hand-made fixtures. Each field that did not match the backend was settled in one of two ways:

- **Backend:** a UI-friendly projection was added to the route. This was done only where the data is real.
- **UI:** the UI was changed to read the backend's shape.

| UI expected | Decision | Now |
|---|---|---|
| `me` on queue / staff case | **Backend**: the caller's verified email | `queue.me`, `case detail.me` |
| `case.version` + 409 on conflict | **Backend**: optional `version` on status/assign/escalate/link-incident/resolve; mismatch → `409 version_conflict` | UI sends `case.version` |
| `player360.player.key` | **UI**: the payload is `player360.summary` (PR #24 `buildPlayerSummary`, which has `key`) | `player360.summary.key` |
| triage `diagnosticsPreview[]` (flat `{label,status,at}` list) | **UI**: backend sends `{ panels: [{ facts: [...] }] }`; UI renders one line per panel (`diagnosticsRows`) | `diagnosticsPreview.panels` |
| question `kind / options / required` | **UI**: backend questions are `{ id, prompt, why }`, free text and optional; `why` is shown as a hint. Choice questions are not invented | — |
| queue `player { key, handle, planLabel }` | **Backend**: from the Player 360 directory (display name, plan label; nulls when the directory is unavailable; 30 s in-container cache) | `cases[].player` |
| `sla.state` | **Backend**: `slaState()` adds `state: overdue \| at_risk \| on_track \| none`; the UI no longer computes clocks | `cases[].sla.state`, `case.slaState.state` |
| `uploads { enabled, reason }` | **Backend**: from `config.support.attachments` (off → `{ enabled: false, reason }`) on player and staff case | `uploads` |
| `audit[]` | **Backend**: the case's own `support.*` AUDIT items (ids and kinds only) | `audit: [{ id, at, actor, action, detail }]` |
| `actionRequests[]` `{ id, … }` | **UI**: backend key is `requestId`, with `history[]` | `actionRequests[].requestId` |
| `linkedIncident` | **UI**: backend sends the full `incident` and `case.refs.incidentId` | `incident`, `case.refs.incidentId` |
| help `section` | **UI**: sections are presentation; derived from the article's backend `category` (`sectionForCategory`) | `articles[].category` |
| escalate body `{ team, reason, handoff }` | **UI**: the server builds the stored hand-off from its own records; a client `handoff` is refused (400). The dialog shows a local preview only | `{ team, reason, version? }` |
| categories `access / vod / rank_stats …` | **UI**: the backend's 24-category vocabulary (contract-tested) | `CATEGORIES` |
| resolution codes `configuration / explained / provider_issue / wont_fix` | **UI**: backend codes (contract-tested) | `RESOLUTION_CODES` |
| "resolution summary is internal" | **UI copy fixed**: the backend puts the summary on the public `resolved` status event, so the player sees it; the dialog now says so | — |
| attachment types (GIF, PDF) | **UI**: backend allowlist PNG/JPEG/WebP/MP4/text/ZIP, 10 MB (25 MB MP4) | `ATTACHMENT_TYPES` |
| `items` lists (queue, incidents, help) | **UI**: backend keys `cases`, `incidents`, `articles` | — |
| player case `{ case, timeline, diagnostics }` wrapper | **UI**: backend returns the projection flat | — |
| event `{ type, author{role,name}, text }` | **UI**: player events `{ kind, author: 'you' \| 'Recon 6 support' \| 'Recon 6', body }`; staff events are stored items `{ eventId, kind, actor, body, data, visibleToPlayer }` | — |
| metrics `{ open: n, firstResponse.medianMinutes, csat.up … }` | **UI**: backend `open.total`, `firstResponse.medianMs`, `csat.positiveShare`, `aging.buckets`, maps for categories/root causes | — |
| unmatched `{ from, snippet, reasonLabel, candidates[] }` | **UI**: backend `{ senderEmail, text, reason, suggestedCaseNumber }`; labels live in the UI | — |
| incident `{ id, customerUpdate.text, timeline[] inline }` | **UI**: backend `incidentId`, `customerUpdate.draft`; timeline and linked cases come from the detail route | — |
| triage body `context.category / context.source` | **UI**: `category` top-level; `source` goes to `context.page` (the only free-form context key) | — |
| staff note `clientRequestId` | **Backend**: notes accept an optional `clientRequestId` (idempotent, like replies) | — |
| "not enabled" detection (`404` with no code) | **UI**: only the catch-all body `{ error: 'not found' }` means the flag is off; `case not found` is a real 404 | `isNotEnabled` |
| help home listing (no query) | **Backend**: `GET /cs/help/articles` without `q` lists every servable article (`listArticles` engine) instead of returning nothing | — |

## Inbound support email (not an HTTP route)

`service.ingestInboundEmail({ raw, verdicts, providerMessageId })` is called by the mail receipt path when it is wired. It is not wired today. Behavior:

- **Plus-address threading:** the reply address is `support+<caseId>.<hmac>@`. `caseByToken` verifies the HMAC with `config.support.emailTokenSecret`, then resolves the case through the `SUP#CASEID/<caseId>` index. That index is written at case creation. The secret is a string of at least 32 bytes, or an async function that returns one. `index.mjs` resolves `SUPPORT_EMAIL_TOKEN_SECRET_ARN` from Secrets Manager with the SDK in the Lambda runtime. **With the secret unset, token lookups return nothing**, and plus-addressed mail falls back to References threading or the review queue.
- **References threading:** `caseByOutboundMessageId` looks up `SUP#EMAIL/OUT#<sha256(Message-ID)>`. That record is written only when a staff reply is actually sent by email, through `staffReply(…, …, …, { emailMessageId })`; this parameter cannot be reached over HTTP. Outbound support email is off, so **this index is empty until outbound email exists**.
- **Attach rules:** a message attaches only if the sender is verified and owns the case. Anything uncertain goes to `SUP#EMAIL/UNMATCHED#…`, which staff review. Staff can attach a reviewed message only as a staff-only event.
- **Dedupe (claim, then finalize):**
  1. The `MID#<hash>` marker is written as a claim (`state: 'processing'`) before the message is applied.
  2. After a successful apply, the marker becomes `state: 'done'`. A failed apply marks it `failed`, and a retry can reclaim it immediately. A crash leaves it `processing`, and it can be reclaimed after a 5-minute lease.
  3. Every apply is also idempotent: the `email_in` event carries `messageIdHash`, and the review item id is derived from it. A reclaimed retry therefore never applies a message twice.

  Tests: `support/integration.test.mjs`.

## Response shapes

<!-- BEGIN GENERATED SHAPES (scripts/support/generate-fixtures.mjs) -->

_Generated from the snapshots of the real backend. Do not edit by hand; run `node scripts/support/generate-fixtures.mjs`._

### POST /cs/me/support/triage

5 sampled responses.

```ts
{
  suggestedCategory: string
  confidence: number
  intent: string
  questions: Array<{
    id: string
    prompt: string
    why: string
  }>
  diagnosticsPreview: {
    status: string
    observedAt: string
    panels: Array<{
      id: string
      title: string
      status: string
      facts: Array<{
        label: string
        value: string
        source: string
        at: null | string
      }>
      inferences: []
      actions: {
        user: Array<string>
      }
    }>
  }
  helpArticles: Array<{
    slug: string
    title: string
    summary: string
    category: string
    status: string
    score: number
  }>
  redacted: boolean
}
```

### POST /cs/me/support/cases

2 sampled responses.

```ts
{
  replayed: boolean
  case: {
    caseNumber: string
    subject: string
    category: string
    status: string
    bucket: string
    bucketLabel: string
    waitingOn: string
    csat: null
    createdAt: string
    updatedAt: string
    subcategory: null
    description: string
    source: string
    resolvedAt: null
    closedAt: null
    reopenCount: number
    resolution: null
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    actions: {
      canMessage: boolean
      canConfirmResolved: boolean
      canReopen: boolean
      canRate: boolean
    }
    timeline: Array<{
      id: string
      kind: string
      visibility: string
      at: string
      author: string
      body: string
    }>
    attachments: []
    uploads: {
      enabled: boolean
      reason: string
    }
    diagnostics: null
  }
}
```

### GET /cs/me/support/cases

1 sampled response.

```ts
{
  buckets: {
    open: Array<{
      caseNumber: string
      subject: string
      category: string
      status: string
      bucket: string
      bucketLabel: string
      waitingOn: string
      csat: null
      createdAt: string
      updatedAt: string
    }>
    waiting_on_recon: Array<{
      caseNumber: string
      subject: string
      category: string
      status: string
      bucket: string
      bucketLabel: string
      waitingOn: string
      csat: null
      createdAt: string
      updatedAt: string
    }>
    waiting_on_me: Array<{
      caseNumber: string
      subject: string
      category: string
      status: string
      bucket: string
      bucketLabel: string
      waitingOn: string
      csat: null
      createdAt: string
      updatedAt: string
    }>
    resolved: Array<{
      caseNumber: string
      subject: string
      category: string
      status: string
      bucket: string
      bucketLabel: string
      waitingOn: null
      csat: null
      createdAt: string
      updatedAt: string
    }>
    closed: Array<{
      caseNumber: string
      subject: string
      category: string
      status: string
      bucket: string
      bucketLabel: string
      waitingOn: null
      csat: {
        rating: string
      }
      createdAt: string
      updatedAt: string
    }>
  }
  labels: {
    open: string
    waiting_on_recon: string
    waiting_on_me: string
    resolved: string
    closed: string
  }
  total: number
}
```

### GET /cs/me/support/cases/{caseNumber}

5 sampled responses.

```ts
{
  caseNumber: string
  subject: string
  category: string
  status: string
  bucket: string
  bucketLabel: string
  waitingOn: null | string
  csat: {
    rating: string
    at: string
  } | null
  createdAt: string
  updatedAt: string
  subcategory: null | string
  description: string
  source: string
  resolvedAt: null | string
  closedAt: null | string
  reopenCount: number
  resolution: {
    summary: string
    at: string
  }
  linkedFromCaseNumber: null
  linkedCaseNumbers: []
  actions: {
    canMessage: boolean
    canConfirmResolved: boolean
    canReopen: boolean
    canRate: boolean
  }
  timeline: Array<{
    id: string
    kind: string
    visibility: string
    at: string
    author: string
    body: null | string
    status?: string
    channel?: string
    rating?: string
  }>
  attachments: []
  uploads: {
    enabled: boolean
    reason: string
  }
  diagnostics: {
    status: string
    observedAt: string
    panels: Array<{
      id: string
      title: string
      status: string
      facts: Array<{
        label: string
        value: string
        source: string
        at: null | string
      }>
      inferences: []
      actions: {
        user: Array<string>
      }
    }>
  }
}
```

### POST …/messages (player)

1 sampled response.

```ts
{
  replayed: boolean
  caseNumber: string
  eventId: string
  status: string
  linkedCaseNumber: null
}
```

### POST …/messages on a closed case

1 sampled response.

```ts
{
  replayed: boolean
  caseNumber: string
  linkedCaseNumber: string
  status: string
  linkedCase: {
    caseNumber: string
    subject: string
    category: string
    status: string
    bucket: string
    bucketLabel: string
    waitingOn: string
    csat: null
    createdAt: string
    updatedAt: string
    subcategory: null
    description: string
    source: string
    resolvedAt: null
    closedAt: null
    reopenCount: number
    resolution: null
    linkedFromCaseNumber: string
    linkedCaseNumbers: []
    actions: {
      canMessage: boolean
      canConfirmResolved: boolean
      canReopen: boolean
      canRate: boolean
    }
    timeline: []
    attachments: []
    uploads: {
      enabled: boolean
      reason: string
    }
    diagnostics: null
  }
}
```

### POST …/csat

1 sampled response.

```ts
{
  ok: boolean
  rating: string
}
```

### POST …/resolve-confirm

1 sampled response.

```ts
{
  caseNumber: string
  subject: string
  category: string
  status: string
  bucket: string
  bucketLabel: string
  waitingOn: null
  csat: {
    rating: string
    at: string
  }
  createdAt: string
  updatedAt: string
  subcategory: null
  description: string
  source: string
  resolvedAt: string
  closedAt: string
  reopenCount: number
  resolution: {
    summary: string
    at: string
  }
  linkedFromCaseNumber: null
  linkedCaseNumbers: []
  actions: {
    canMessage: boolean
    canConfirmResolved: boolean
    canReopen: boolean
    canRate: boolean
  }
  timeline: []
  attachments: []
  uploads: {
    enabled: boolean
    reason: string
  }
  diagnostics: null
}
```

### POST …/reopen

1 sampled response.

```ts
{
  reopened: boolean
  linkedCaseNumber: null
  case: {
    caseNumber: string
    subject: string
    category: string
    status: string
    bucket: string
    bucketLabel: string
    waitingOn: string
    csat: null
    createdAt: string
    updatedAt: string
    subcategory: null
    description: string
    source: string
    resolvedAt: null
    closedAt: null
    reopenCount: number
    resolution: {
      summary: string
      at: string
    }
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    actions: {
      canMessage: boolean
      canConfirmResolved: boolean
      canReopen: boolean
      canRate: boolean
    }
    timeline: []
    attachments: []
    uploads: {
      enabled: boolean
      reason: string
    }
    diagnostics: null
  }
}
```

### POST …/attachments

1 sampled response.

```ts
{
  status: string
}
```

### GET /cs/admin/support/queue

12 sampled responses.

```ts
{
  view: string
  me: string
  cases: Array<{
    caseNumber: string
    contactKey: string
    player: {
      key: string
      handle: string
      planLabel: string
    }
    subject: string
    category: string
    intent: string
    source: string
    status: string
    priority: string
    severity: string
    assignee: null | string
    team: string
    waitingOn: string
    incidentId: null | string
    createdAt: string
    updatedAt: string
    sla: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
  }>
  counts: {
    unassigned: number
    mine: number
    critical: number
    billing: number
    identity: number
    vod: number
    coaching: number
    bugs: number
    waiting: number
    at_risk: number
    incidents: number
    all_open: number
  }
  incidents?: Array<{
    incidentId: string
    title: string
    service: string
    status: string
    severity: string
    owner: null | string
    affectedCount: null
    workaround: null | string
    internalNotes: null | string
    customerUpdate: {
      draft: string
      published: boolean
      updatedAt: string
      updatedBy: string
    } | null
    createdAt: string
    createdBy: string
    updatedAt: string
    resolvedAt: null
    version: number
    type: string
  }>
}
```

### GET /cs/admin/support/cases/{caseNumber}

11 sampled responses.

```ts
{
  me: string
  case: {
    type: string
    caseId: string
    caseNumber: string
    contactKey: string
    reconPlayerId: string
    email: string
    product: string
    category: string
    subcategory: null | string
    intent: string
    source: string
    subject: string
    description: string
    status: string
    priority: string
    severity: string
    waitingOn: null | string
    assignee: null | string
    team: string
    refs: {
      subscription: {
        stripeCustomerId: string
        stripeSubscriptionId: null | string
      } | null
      coachingSession: null
      vodJob: null
      replay: null
      identitySource: null
      conversation: null
      incidentId: null | string
    }
    escalation: {
      team: string
      at: string
      by: string
      reason: string
      handoff: {
        team: string
        reason: string
        by: string
        at: string
        caseNumber: string
        category: string
        priority: string
        severity: string
        statusBefore: string
        summary: string
        player: {
          plan: string
          billingStatus: string
          stage: string
          accountStatus: string
        }
        diagnosticsFlags: Array<string>
        triedSoFar: {
          playerMessages: number
          publicReplies: number
          privateNotes: number
        }
        latestNote: string
        latestPlayerMessage: string
        openRefs: Array<string>
        text: string
      }
    } | null
    rootCause: null | string
    resolution: {
      summary: string
      code: string
      at: string
      by: string
    } | null
    learning: {
      productArea: string
      avoidable: null
      docGap: boolean | null
      onboardingGap: null
      bug: boolean | null
      featureRequest: null
    } | null
    tags: []
    csat: {
      rating: string
      comment: null
      at: string
      forResolution: number
    } | null
    sla: {
      firstResponseDueAt: string
      firstResponseAt: null | string
      nextResponseDueAt: null | string
      resolveTargetAt: string
    }
    classification: {
      suggestedCategory: string
      confidence: number
      engineStatus: string
    }
    redactions: []
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    playerVisible: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
    lastPlayerMessageAt: string
    resolvedAt: null | string
    closedAt: null | string
    reopenedAt: null
    reopenCount: number
    resolutionCount: number
    version: number
    answers: {
      vod_when?: string
      capture_mode?: string
    } | null
    context: null
    slaState: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
    allowedTransitions: Array<string>
  }
  timeline: Array<{
    type: string
    eventId: string
    caseId: string
    caseNumber: string
    contactKey: string
    kind: string
    visibility: string
    actor: {
      kind: string
      id: string
    }
    body: null | string
    data: {
      from?: string
      to?: string
      redactions?: number
      delivery?: string
      rating?: string
      forResolution?: number
      rule?: string
      fromAssignee?: null
      toAssignee?: string
      fromTeam?: string
      toTeam?: string
      incidentId?: string
      previousIncidentId?: null
      team?: string
      handoff?: {
        team: string
        reason: string
        by: string
        at: string
        caseNumber: string
        category: string
        priority: string
        severity: string
        statusBefore: string
        summary: string
        player: {
          plan: string
          billingStatus: string
          stage: string
          accountStatus: string
        }
        diagnosticsFlags: Array<string>
        triedSoFar: {
          playerMessages: number
          publicReplies: number
          privateNotes: number
        }
        latestNote: string
        latestPlayerMessage: string
        openRefs: Array<string>
        text: string
      }
      subject?: string
      providerMessageId?: null
      messageIdHash?: string
    }
    at: string
    visibleToPlayer: boolean
    requestId?: string
    actionKind?: string
    reason?: string
    requiredVerification?: string
    arStatus?: string
    history?: Array<{
      at: string
      status: string
      by: string
      note?: string
    }>
    executesInSupport?: boolean
  }>
  attachments: []
  uploads: {
    enabled: boolean
    reason: string
  }
  audit: Array<{
    id: string
    at: string
    actor: string
    action: string
    detail: {
      caseNumber: string
      source?: string
      category?: string
      redactions?: number
      linkedFromCaseNumber?: null
      from?: string
      to?: string
      eventId?: string
      statusFrom?: string
      statusTo?: string
      code?: string
      rootCause?: null | string
      rating?: string
      assignee?: string
      team?: string
      incidentId?: string
      requestId?: string
      kind?: string
    }
  }>
  actionRequests: Array<{
    requestId: string
    caseNumber: string
    kind: string
    reason: string
    requiredVerification: string
    status: string
    history: Array<{
      at: string
      status: string
      by: string
      note?: string
    }>
    executesInSupport: boolean
    createdAt: string
  }>
  player360: {
    status: string
    summary: {
      key: string
      email: string
      name: string
      displayName: string
      platform: string
      rank: null | string
      isAdmin: boolean
      plan: string
      planLabel: string
      billingStatus: string
      hasAccess: boolean
      stage: string
      stageLabel: string
      health: string
      healthLabel: string
      reasons: Array<string>
      accountStatus: string
      createdAt: string
      lastSeenAt: string
      lastActiveAt: string
      activation: {
        done: number
        total: number
        complete: boolean
      }
      nextAction: {
        code: string
        label: string
        detail: null | string
        automated: boolean
      }
      monthlyValue: number
      vod: {
        used: null | number
        limit: null | number
        lastAt: null | string
      }
      coaching: {
        upcoming: number
        nextAt: null
        completed: number
        credits: null
        included: number
      }
      activity: {
        strategy7: number
        matchPrep7: number
        liveGuide7: number
        activeDays14: number
        rtcDone: null | number
        evidence: string
      }
    }
  }
  previousCases: Array<{
    caseNumber: string
    status: string
    category: string
    subject: string
    createdAt: string
    resolvedAt: null | string
  }>
  incident: {
    incidentId: string
    title: string
    service: string
    status: string
    severity: string
    owner: null | string
    affectedCount: null
    workaround: null | string
    internalNotes: null | string
    customerUpdate: {
      draft: string
      published: boolean
      updatedAt: string
      updatedBy: string
    } | null
    createdAt: string
    createdBy: string
    updatedAt: string
    resolvedAt: null
    version: number
    type: string
  } | null
  diagnostics: {
    view: string
    panels: Array<{
      id: string
      title: string
      status: string
      facts: Array<{
        label: string
        value: string
        source: string
        at: null | string
      }>
      inferences: Array<{
        label: string
        value: string
        basis: string
        confidence: number
      }>
      actions: {
        user: Array<string>
        recon: Array<string>
      }
    }>
    signals: {
      accountStatus: string
      signedIn: boolean
      profileComplete: boolean
      entitlementKnown: boolean
      plan: string
      hasAccess: boolean
      billingStatus: string
      hasPaidRow: boolean
      identityBound: boolean | null
      mismatchSuspected: boolean
      mismatchRules: Array<string>
      linkedPlatforms: Array<string>
      platform: string
      ubisoftLinked: boolean
      trnLinked: boolean
      globalProviderFailures: Array<string>
      vodIncluded: boolean
      vodUsed?: number
      vodLimit?: number
      vodLastReviewAt?: null | string
      vodUnmatchedUsage?: number
      replaySupported: boolean
      coachingCredits: null
      coachingCreditsKnown: boolean
      coachingMember: boolean
      lifecycleStage: string
      health: string
      activated: boolean
      onboardingStalled: boolean
      activeDays14: number
      hasCoreAction: boolean
      lastActiveAt: string
      desktopVersionKnown: boolean
      openIncidentServices: Array<string>
      matchingIncidentIds: Array<string>
      previousCaseCount: number
      repeatCategoryCount?: number
    }
    observedAt: string
    context: {
      entitlement: {
        source: string
        stripeRefs: Array<{
          customerId: string
          subscriptionId: null | string
          priceId: string
          ledgerPlan: string
          ledgerStatus: string
          currentPeriodEnd: string
          comp: boolean
          trial: boolean
          identityBound: boolean
        }>
        refsMasked: boolean
        product: {
          plan: string
          planLabel: string
          effectivePlanOfBestRow: null | string
          tierScope: string
          priceName: null | string
        }
        stripeReportedState: string
        stripeReportedNote: string
        reconState: {
          status: string
          hasAccess: boolean
          plan: string
          planLabel: string
          rowStatus: null | string
          currentPeriodEnd: null | string
          cancelAtPeriodEnd: boolean
          paymentIssue: null | string
          stale: boolean
          staleReason: null | string
          asOf: string
          rowCount: number
          liveRowCount: number
          resolver: string
        }
        identityBinding: {
          state: string
          rowsBound: number
          rowsTotal: number
          profileBound: boolean
          profileMatchesLogin: null
          loginKnown: boolean
        }
        lastCheck: {
          stateFetchedAt: string
          appliedSeq: string
        }
        mismatchSuspected: boolean
        mismatches: Array<{
          ruleId: string
          rule: string
          detail: string
          count: number
        }>
        repair: null
        note: string
      }
      connections: Array<{
        source: string
        linked: boolean | null
        lastSuccessAt: null | string
        observedAt: null | string
        lastAttemptAt: null
        errorClass: null | string
        freshness: string
        retryEligible: boolean
        userActionRequired: boolean
        reconActionRequired: boolean
        snapshotId: null | string
        notes: Array<string>
      }>
      rank: {
        dataSources: Array<{
          source: string
          observedAt: string
          fetchedAt: string
          season: null | string
          verification: string
          freshness: string
          kind: string
        }>
        latestProvider: {
          kind: string
          source: string
          observedAt: string
          season: string
        } | null
        history: {
          kind: string
          snapshots: number
          withStatFields: number
          oldestAt: null | string
          newestAt: null | string
          seasons: Array<string>
          state: string
        }
        seasonRollover: {
          kind: string
          suspected: boolean
          basis: string
          confidence: number
        }
        classification: {
          kind: string
          value: string
          basis: string
          confidence: number
        }
        notes: Array<string>
      }
      vod?: {
        usage: {
          used: number
          limit: number
          remaining: number
          isTrial: boolean
          periodEnd: null | string
          unlimited: boolean
        }
        counterUpdatedAt: null | string
        periodStartAt: null | string
        reviewRecordsInPeriod: number
        lastReviewAt: null | string
        lastReviewId: null | string
        lastReviewMap: null | string
        unmatchedUsage: number
        eventsTruncated: boolean
      }
      coaching: {
        credits: null
        creditsRowPresent: boolean
        creditsUpdatedAt: null
        bookings: Array<{
          id: string
          status: string
          payment: string
          type: string
        }>
        paidPackages: number
        membership: boolean
        purchaseWithoutCredits: boolean
      }
    }
  }
  copilot: {
    model: string
    summary: {
      kind: string
      text: string
      source: string
      at: string
    }
    playerContext: Array<{
      kind: string
      text: string
      source: string
      at: null
    }>
    facts: Array<{
      kind: string
      panel: string
      label: string
      value: string
      source: string
      at: null | string
    }>
    inferences: Array<{
      kind: string
      panel: string
      label: string
      value: string
      basis: string
      confidence: number
    }>
    category: {
      kind: string
      value: string
      label: string
      source: string
      suggested: {
        kind: string
        value: string
        confidence: number
      } | null
    }
    intent: {
      kind: string
      value: string
      source: string
    }
    severity: {
      kind: string
      value: string
      source: string
    }
    likelyRootCause: {
      kind: string
      text: string
      basis: string
      confidence: number
    }
    recentChanges: Array<{
      kind: string
      text: string
      source: string
      at: string
    }>
    related: {
      cases: Array<{
        kind: string
        text: string
        source: string
        at: string
      }>
      incidents: Array<{
        kind: string
        text: string
        source: string
        at: string
        incidentId: string
      }>
    }
    suggestedSteps: Array<{
      kind: string
      text: string
      basis: string
      confidence: number
      requiresActionRequest?: string
    }>
    draftReply: {
      kind: string
      text: string
      guard: {
        ok: boolean
        violations: []
      }
      basis: string
    }
    helpArticles: Array<{
      kind: string
      slug: string
      title: string
      status: string
      basis: string
    }>
    suggestedEscalation: {
      kind: string
      team: string
      reason: string
      handoff: null | string
      basis: string
    } | null
    disclaimers: Array<string>
    advisoryOnly: boolean
  }
  permissions: {
    "case.reply": boolean
    "case.note": boolean
    "case.status": boolean
    "case.assign": boolean
    "case.escalate": boolean
    "case.link_incident": boolean
    "case.resolve": boolean
    "action.request": boolean
    "action.request.billing": boolean
    "action.authorize": boolean
    "action.record_done": boolean
    "billing.refs.full": boolean
    "diagnostics.technical": boolean
  }
}
```

### actionRequests[] on a staff case

1 sampled response.

```ts
{
  me: string
  case: {
    type: string
    caseId: string
    caseNumber: string
    contactKey: string
    reconPlayerId: string
    email: string
    product: string
    category: string
    subcategory: string
    intent: string
    source: string
    subject: string
    description: string
    status: string
    priority: string
    severity: string
    waitingOn: string
    assignee: string
    team: string
    refs: {
      subscription: {
        stripeCustomerId: string
        stripeSubscriptionId: null
      }
      coachingSession: null
      vodJob: null
      replay: null
      identitySource: null
      conversation: null
      incidentId: null
    }
    escalation: null
    rootCause: null
    resolution: null
    learning: null
    tags: []
    csat: null
    sla: {
      firstResponseDueAt: string
      firstResponseAt: string
      nextResponseDueAt: null
      resolveTargetAt: string
    }
    classification: {
      suggestedCategory: string
      confidence: number
      engineStatus: string
    }
    redactions: []
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    playerVisible: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
    lastPlayerMessageAt: string
    resolvedAt: null
    closedAt: null
    reopenedAt: null
    reopenCount: number
    resolutionCount: number
    version: number
    answers: null
    context: null
    slaState: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
    allowedTransitions: Array<string>
  }
  timeline: Array<{
    type: string
    eventId: string
    caseId: string
    caseNumber: string
    contactKey: string
    kind: string
    visibility: string
    actor: {
      kind: string
      id: string
    }
    body: null | string
    data: {
      from?: string
      to?: string
      redactions?: number
      delivery?: string
      fromAssignee?: null
      toAssignee?: string
      fromTeam?: string
      toTeam?: string
    }
    at: string
    visibleToPlayer: boolean
    requestId?: string
    actionKind?: string
    reason?: string
    requiredVerification?: string
    arStatus?: string
    history?: Array<{
      at: string
      status: string
      by: string
      note?: string
    }>
    executesInSupport?: boolean
  }>
  attachments: []
  uploads: {
    enabled: boolean
    reason: string
  }
  audit: Array<{
    id: string
    at: string
    actor: string
    action: string
    detail: {
      caseNumber: string
      source?: string
      category?: string
      redactions?: number
      linkedFromCaseNumber?: null
      from?: string
      to?: string
      eventId?: string
      statusFrom?: string
      statusTo?: string
      requestId?: string
      kind?: string
      assignee?: string
      team?: string
    }
  }>
  actionRequests: Array<{
    requestId: string
    caseNumber: string
    kind: string
    reason: string
    requiredVerification: string
    status: string
    history: Array<{
      at: string
      status: string
      by: string
      note?: string
    }>
    executesInSupport: boolean
    createdAt: string
  }>
  player360: {
    status: string
    summary: {
      key: string
      email: string
      name: string
      displayName: string
      platform: string
      rank: string
      isAdmin: boolean
      plan: string
      planLabel: string
      billingStatus: string
      hasAccess: boolean
      stage: string
      stageLabel: string
      health: string
      healthLabel: string
      reasons: Array<string>
      accountStatus: string
      createdAt: string
      lastSeenAt: string
      lastActiveAt: string
      activation: {
        done: number
        total: number
        complete: boolean
      }
      nextAction: {
        code: string
        label: string
        detail: string
        automated: boolean
      }
      monthlyValue: number
      vod: {
        used: null
        limit: null
        lastAt: null
      }
      coaching: {
        upcoming: number
        nextAt: null
        completed: number
        credits: null
        included: number
      }
      activity: {
        strategy7: number
        matchPrep7: number
        liveGuide7: number
        activeDays14: number
        rtcDone: null
        evidence: string
      }
    }
  }
  previousCases: []
  incident: null
  diagnostics: {
    view: string
    panels: Array<{
      id: string
      title: string
      status: string
      facts: Array<{
        label: string
        value: string
        source: string
        at: null | string
      }>
      inferences: Array<{
        label: string
        value: string
        basis: string
        confidence: number
      }>
      actions: {
        user: Array<string>
        recon: Array<string>
      }
    }>
    signals: {
      accountStatus: string
      signedIn: boolean
      profileComplete: boolean
      entitlementKnown: boolean
      plan: string
      hasAccess: boolean
      billingStatus: string
      hasPaidRow: boolean
      identityBound: boolean
      mismatchSuspected: boolean
      mismatchRules: Array<string>
      linkedPlatforms: []
      platform: string
      ubisoftLinked: boolean
      trnLinked: boolean
      globalProviderFailures: []
      vodIncluded: boolean
      replaySupported: boolean
      coachingCredits: null
      coachingCreditsKnown: boolean
      coachingMember: boolean
      lifecycleStage: string
      health: string
      activated: boolean
      onboardingStalled: boolean
      activeDays14: number
      hasCoreAction: boolean
      lastActiveAt: string
      desktopVersionKnown: boolean
      openIncidentServices: Array<string>
      matchingIncidentIds: []
      previousCaseCount: number
    }
    observedAt: string
    context: {
      entitlement: {
        source: string
        stripeRefs: Array<{
          customerId: string
          subscriptionId: null
          priceId: string
          ledgerPlan: string
          ledgerStatus: string
          currentPeriodEnd: string
          comp: boolean
          trial: boolean
          identityBound: boolean
        }>
        refsMasked: boolean
        product: {
          plan: string
          planLabel: string
          effectivePlanOfBestRow: string
          tierScope: string
          priceName: string
        }
        stripeReportedState: string
        stripeReportedNote: string
        reconState: {
          status: string
          hasAccess: boolean
          plan: string
          planLabel: string
          rowStatus: string
          currentPeriodEnd: string
          cancelAtPeriodEnd: boolean
          paymentIssue: null
          stale: boolean
          staleReason: string
          asOf: string
          rowCount: number
          liveRowCount: number
          resolver: string
        }
        identityBinding: {
          state: string
          rowsBound: number
          rowsTotal: number
          profileBound: boolean
          profileMatchesLogin: null
          loginKnown: boolean
        }
        lastCheck: {
          stateFetchedAt: string
          appliedSeq: string
        }
        mismatchSuspected: boolean
        mismatches: Array<{
          ruleId: string
          rule: string
          detail: string
          count: number
        }>
        repair: null
        note: string
      }
      connections: Array<{
        source: string
        linked: boolean | null
        lastSuccessAt: null
        observedAt: null
        lastAttemptAt: null
        errorClass: null | string
        freshness: string
        retryEligible: boolean
        userActionRequired: boolean
        reconActionRequired: boolean
        snapshotId: null
        notes: Array<string>
      }>
      rank: {
        dataSources: []
        latestProvider: null
        history: {
          kind: string
          snapshots: number
          withStatFields: number
          oldestAt: null
          newestAt: null
          seasons: []
          state: string
        }
        seasonRollover: {
          kind: string
          suspected: boolean
          basis: string
          confidence: number
        }
        classification: {
          kind: string
          value: string
          basis: string
          confidence: number
        }
        notes: Array<string>
      }
      coaching: {
        credits: null
        creditsRowPresent: boolean
        creditsUpdatedAt: null
        bookings: []
        paidPackages: number
        membership: boolean
        purchaseWithoutCredits: boolean
      }
    }
  }
  copilot: {
    model: string
    summary: {
      kind: string
      text: string
      source: string
      at: string
    }
    playerContext: Array<{
      kind: string
      text: string
      source: string
      at: null
    }>
    facts: Array<{
      kind: string
      panel: string
      label: string
      value: string
      source: string
      at: null | string
    }>
    inferences: Array<{
      kind: string
      panel: string
      label: string
      value: string
      basis: string
      confidence: number
    }>
    category: {
      kind: string
      value: string
      label: string
      source: string
      suggested: null
    }
    intent: {
      kind: string
      value: string
      source: string
    }
    severity: {
      kind: string
      value: string
      source: string
    }
    likelyRootCause: {
      kind: string
      text: string
      basis: string
      confidence: number
    }
    recentChanges: Array<{
      kind: string
      text: string
      source: string
      at: string
    }>
    related: {
      cases: []
      incidents: Array<{
        kind: string
        text: string
        source: string
        at: string
        incidentId: string
      }>
    }
    suggestedSteps: Array<{
      kind: string
      text: string
      basis: string
      confidence: number
      requiresActionRequest?: string
    }>
    draftReply: {
      kind: string
      text: string
      guard: {
        ok: boolean
        violations: []
      }
      basis: string
    }
    helpArticles: Array<{
      kind: string
      slug: string
      title: string
      status: string
      basis: string
    }>
    suggestedEscalation: {
      kind: string
      team: string
      reason: string
      handoff: null
      basis: string
    }
    disclaimers: Array<string>
    advisoryOnly: boolean
  }
  permissions: {
    "case.reply": boolean
    "case.note": boolean
    "case.status": boolean
    "case.assign": boolean
    "case.escalate": boolean
    "case.link_incident": boolean
    "case.resolve": boolean
    "action.request": boolean
    "action.request.billing": boolean
    "action.authorize": boolean
    "action.record_done": boolean
    "billing.refs.full": boolean
    "diagnostics.technical": boolean
  }
}
```

### incident on a linked staff case

1 sampled response.

```ts
{
  me: string
  case: {
    type: string
    caseId: string
    caseNumber: string
    contactKey: string
    reconPlayerId: string
    email: string
    product: string
    category: string
    subcategory: null
    intent: string
    source: string
    subject: string
    description: string
    status: string
    priority: string
    severity: string
    waitingOn: string
    assignee: null
    team: string
    refs: {
      subscription: null
      coachingSession: null
      vodJob: null
      replay: null
      identitySource: null
      conversation: null
      incidentId: string
    }
    escalation: {
      team: string
      at: string
      by: string
      reason: string
      handoff: {
        team: string
        reason: string
        by: string
        at: string
        caseNumber: string
        category: string
        priority: string
        severity: string
        statusBefore: string
        summary: string
        player: {
          plan: string
          billingStatus: string
          stage: string
          accountStatus: string
        }
        diagnosticsFlags: Array<string>
        triedSoFar: {
          playerMessages: number
          publicReplies: number
          privateNotes: number
        }
        latestNote: string
        latestPlayerMessage: string
        openRefs: Array<string>
        text: string
      }
    }
    rootCause: null
    resolution: null
    learning: null
    tags: []
    csat: null
    sla: {
      firstResponseDueAt: string
      firstResponseAt: string
      nextResponseDueAt: string
      resolveTargetAt: string
    }
    classification: {
      suggestedCategory: string
      confidence: number
      engineStatus: string
    }
    redactions: []
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    playerVisible: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
    lastPlayerMessageAt: string
    resolvedAt: null
    closedAt: null
    reopenedAt: null
    reopenCount: number
    resolutionCount: number
    version: number
    answers: {
      vod_when: string
    }
    context: null
    slaState: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
    allowedTransitions: Array<string>
  }
  timeline: Array<{
    type: string
    eventId: string
    caseId: string
    caseNumber: string
    contactKey: string
    kind: string
    visibility: string
    actor: {
      kind: string
      id: string
    }
    body: null | string
    data: {
      from?: string
      to?: string
      redactions?: number
      incidentId?: string
      previousIncidentId?: null
      team?: string
      handoff?: {
        team: string
        reason: string
        by: string
        at: string
        caseNumber: string
        category: string
        priority: string
        severity: string
        statusBefore: string
        summary: string
        player: {
          plan: string
          billingStatus: string
          stage: string
          accountStatus: string
        }
        diagnosticsFlags: Array<string>
        triedSoFar: {
          playerMessages: number
          publicReplies: number
          privateNotes: number
        }
        latestNote: string
        latestPlayerMessage: string
        openRefs: Array<string>
        text: string
      }
      delivery?: string
      subject?: string
      providerMessageId?: null
      messageIdHash?: string
    }
    at: string
    visibleToPlayer: boolean
  }>
  attachments: []
  uploads: {
    enabled: boolean
    reason: string
  }
  audit: Array<{
    id: string
    at: string
    actor: string
    action: string
    detail: {
      caseNumber: string
      source?: string
      category?: string
      redactions?: number
      linkedFromCaseNumber?: null
      from?: string
      to?: string
      eventId?: string
      incidentId?: string
      team?: string
      statusFrom?: string
      statusTo?: string
    }
  }>
  actionRequests: []
  player360: {
    status: string
    summary: {
      key: string
      email: string
      name: string
      displayName: string
      platform: string
      rank: string
      isAdmin: boolean
      plan: string
      planLabel: string
      billingStatus: string
      hasAccess: boolean
      stage: string
      stageLabel: string
      health: string
      healthLabel: string
      reasons: []
      accountStatus: string
      createdAt: string
      lastSeenAt: string
      lastActiveAt: string
      activation: {
        done: number
        total: number
        complete: boolean
      }
      nextAction: {
        code: string
        label: string
        detail: null
        automated: boolean
      }
      monthlyValue: number
      vod: {
        used: number
        limit: number
        lastAt: string
      }
      coaching: {
        upcoming: number
        nextAt: null
        completed: number
        credits: null
        included: number
      }
      activity: {
        strategy7: number
        matchPrep7: number
        liveGuide7: number
        activeDays14: number
        rtcDone: number
        evidence: string
      }
    }
  }
  previousCases: Array<{
    caseNumber: string
    status: string
    category: string
    subject: string
    createdAt: string
    resolvedAt: null | string
  }>
  incident: {
    incidentId: string
    title: string
    service: string
    status: string
    severity: string
    owner: null
    affectedCount: null
    workaround: string
    internalNotes: null
    customerUpdate: null
    createdAt: string
    createdBy: string
    updatedAt: string
    resolvedAt: null
    version: number
    type: string
  }
  diagnostics: {
    view: string
    panels: Array<{
      id: string
      title: string
      status: string
      facts: Array<{
        label: string
        value: string
        source: string
        at: null | string
      }>
      inferences: Array<{
        label: string
        value: string
        basis: string
        confidence: number
      }>
      actions: {
        user: Array<string>
        recon: Array<string>
      }
    }>
    signals: {
      accountStatus: string
      signedIn: boolean
      profileComplete: boolean
      entitlementKnown: boolean
      plan: string
      hasAccess: boolean
      billingStatus: string
      hasPaidRow: boolean
      identityBound: boolean
      mismatchSuspected: boolean
      mismatchRules: []
      linkedPlatforms: Array<string>
      platform: string
      ubisoftLinked: boolean
      trnLinked: boolean
      globalProviderFailures: []
      vodIncluded: boolean
      vodUsed: number
      vodLimit: number
      vodLastReviewAt: string
      vodUnmatchedUsage: number
      replaySupported: boolean
      coachingCredits: null
      coachingCreditsKnown: boolean
      coachingMember: boolean
      lifecycleStage: string
      health: string
      activated: boolean
      onboardingStalled: boolean
      activeDays14: number
      hasCoreAction: boolean
      lastActiveAt: string
      desktopVersionKnown: boolean
      openIncidentServices: Array<string>
      matchingIncidentIds: Array<string>
      previousCaseCount: number
      repeatCategoryCount: number
    }
    observedAt: string
    context: {
      entitlement: {
        source: string
        stripeRefs: Array<{
          customerId: string
          subscriptionId: string
          priceId: string
          ledgerPlan: string
          ledgerStatus: string
          currentPeriodEnd: string
          comp: boolean
          trial: boolean
          identityBound: boolean
        }>
        refsMasked: boolean
        product: {
          plan: string
          planLabel: string
          effectivePlanOfBestRow: string
          tierScope: string
          priceName: string
        }
        stripeReportedState: string
        stripeReportedNote: string
        reconState: {
          status: string
          hasAccess: boolean
          plan: string
          planLabel: string
          rowStatus: string
          currentPeriodEnd: string
          cancelAtPeriodEnd: boolean
          paymentIssue: null
          stale: boolean
          staleReason: null
          asOf: string
          rowCount: number
          liveRowCount: number
          resolver: string
        }
        identityBinding: {
          state: string
          rowsBound: number
          rowsTotal: number
          profileBound: boolean
          profileMatchesLogin: null
          loginKnown: boolean
        }
        lastCheck: {
          stateFetchedAt: string
          appliedSeq: string
        }
        mismatchSuspected: boolean
        mismatches: []
        repair: null
        note: string
      }
      connections: Array<{
        source: string
        linked: boolean | null
        lastSuccessAt: null | string
        observedAt: null | string
        lastAttemptAt: null
        errorClass: null | string
        freshness: string
        retryEligible: boolean
        userActionRequired: boolean
        reconActionRequired: boolean
        snapshotId: null | string
        notes: Array<string>
      }>
      rank: {
        dataSources: Array<{
          source: string
          observedAt: string
          fetchedAt: string
          season: null | string
          verification: string
          freshness: string
          kind: string
        }>
        latestProvider: {
          kind: string
          source: string
          observedAt: string
          season: string
        }
        history: {
          kind: string
          snapshots: number
          withStatFields: number
          oldestAt: string
          newestAt: string
          seasons: Array<string>
          state: string
        }
        seasonRollover: {
          kind: string
          suspected: boolean
          basis: string
          confidence: number
        }
        classification: {
          kind: string
          value: string
          basis: string
          confidence: number
        }
        notes: Array<string>
      }
      vod: {
        usage: {
          used: number
          limit: number
          remaining: number
          isTrial: boolean
          periodEnd: string
          unlimited: boolean
        }
        counterUpdatedAt: string
        periodStartAt: string
        reviewRecordsInPeriod: number
        lastReviewAt: string
        lastReviewId: string
        lastReviewMap: string
        unmatchedUsage: number
        eventsTruncated: boolean
      }
      coaching: {
        credits: null
        creditsRowPresent: boolean
        creditsUpdatedAt: null
        bookings: []
        paidPackages: number
        membership: boolean
        purchaseWithoutCredits: boolean
      }
    }
  }
  copilot: {
    model: string
    summary: {
      kind: string
      text: string
      source: string
      at: string
    }
    playerContext: Array<{
      kind: string
      text: string
      source: string
      at: null
    }>
    facts: Array<{
      kind: string
      panel: string
      label: string
      value: string
      source: string
      at: null | string
    }>
    inferences: Array<{
      kind: string
      panel: string
      label: string
      value: string
      basis: string
      confidence: number
    }>
    category: {
      kind: string
      value: string
      label: string
      source: string
      suggested: {
        kind: string
        value: string
        confidence: number
      }
    }
    intent: {
      kind: string
      value: string
      source: string
    }
    severity: {
      kind: string
      value: string
      source: string
    }
    likelyRootCause: {
      kind: string
      text: string
      basis: string
      confidence: number
    }
    recentChanges: Array<{
      kind: string
      text: string
      source: string
      at: string
    }>
    related: {
      cases: Array<{
        kind: string
        text: string
        source: string
        at: string
      }>
      incidents: Array<{
        kind: string
        text: string
        source: string
        at: string
        incidentId: string
      }>
    }
    suggestedSteps: Array<{
      kind: string
      text: string
      basis: string
      confidence: number
    }>
    draftReply: {
      kind: string
      text: string
      guard: {
        ok: boolean
        violations: []
      }
      basis: string
    }
    helpArticles: Array<{
      kind: string
      slug: string
      title: string
      status: string
      basis: string
    }>
    suggestedEscalation: {
      kind: string
      team: string
      reason: string
      handoff: string
      basis: string
    }
    disclaimers: Array<string>
    advisoryOnly: boolean
  }
  permissions: {
    "case.reply": boolean
    "case.note": boolean
    "case.status": boolean
    "case.assign": boolean
    "case.escalate": boolean
    "case.link_incident": boolean
    "case.resolve": boolean
    "action.request": boolean
    "action.request.billing": boolean
    "action.authorize": boolean
    "action.record_done": boolean
    "billing.refs.full": boolean
    "diagnostics.technical": boolean
  }
}
```

### POST …/status | …/assign | …/link-incident (staff)

3 sampled responses.

```ts
{
  type: string
  caseId: string
  caseNumber: string
  contactKey: string
  reconPlayerId: string
  email: string
  product: string
  category: string
  subcategory: null | string
  intent: string
  source: string
  subject: string
  description: string
  status: string
  priority: string
  severity: string
  waitingOn: string
  assignee: null | string
  team: string
  refs: {
    subscription: {
      stripeCustomerId: string
      stripeSubscriptionId: null
    } | null
    coachingSession: null
    vodJob: null
    replay: null
    identitySource: null
    conversation: null
    incidentId: null | string
  }
  escalation: null
  rootCause: null
  resolution: null
  learning: null
  tags: []
  csat: null
  sla: {
    firstResponseDueAt: string
    firstResponseAt: null | string
    nextResponseDueAt: null | string
    resolveTargetAt: string
  }
  classification: {
    suggestedCategory: string
    confidence: number
    engineStatus: string
  }
  redactions: []
  linkedFromCaseNumber: null
  linkedCaseNumbers: []
  playerVisible: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  lastPlayerMessageAt: string
  resolvedAt: null
  closedAt: null
  reopenedAt: null
  reopenCount: number
  resolutionCount: number
  version: number
  answers: {
    vod_when: string
  } | null
  context: null
  slaState: {
    firstResponse: string
    nextResponse: string
    resolve: string
    atRisk: boolean
    overdue: boolean
    state: string
  }
  allowedTransitions: Array<string>
}
```

### POST …/escalate

1 sampled response.

```ts
{
  case: {
    type: string
    caseId: string
    caseNumber: string
    contactKey: string
    reconPlayerId: string
    email: string
    product: string
    category: string
    subcategory: null
    intent: string
    source: string
    subject: string
    description: string
    status: string
    priority: string
    severity: string
    waitingOn: string
    assignee: null
    team: string
    refs: {
      subscription: null
      coachingSession: null
      vodJob: null
      replay: null
      identitySource: null
      conversation: null
      incidentId: string
    }
    escalation: {
      team: string
      at: string
      by: string
      reason: string
      handoff: {
        team: string
        reason: string
        by: string
        at: string
        caseNumber: string
        category: string
        priority: string
        severity: string
        statusBefore: string
        summary: string
        player: {
          plan: string
          billingStatus: string
          stage: string
          accountStatus: string
        }
        diagnosticsFlags: Array<string>
        triedSoFar: {
          playerMessages: number
          publicReplies: number
          privateNotes: number
        }
        latestNote: string
        latestPlayerMessage: string
        openRefs: Array<string>
        text: string
      }
    }
    rootCause: null
    resolution: null
    learning: null
    tags: []
    csat: null
    sla: {
      firstResponseDueAt: string
      firstResponseAt: null
      nextResponseDueAt: string
      resolveTargetAt: string
    }
    classification: {
      suggestedCategory: string
      confidence: number
      engineStatus: string
    }
    redactions: []
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    playerVisible: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
    lastPlayerMessageAt: string
    resolvedAt: null
    closedAt: null
    reopenedAt: null
    reopenCount: number
    resolutionCount: number
    version: number
    answers: {
      vod_when: string
    }
    context: null
    slaState: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
    allowedTransitions: Array<string>
  }
  handoff: {
    team: string
    reason: string
    by: string
    at: string
    caseNumber: string
    category: string
    priority: string
    severity: string
    statusBefore: string
    summary: string
    player: {
      plan: string
      billingStatus: string
      stage: string
      accountStatus: string
    }
    diagnosticsFlags: Array<string>
    triedSoFar: {
      playerMessages: number
      publicReplies: number
      privateNotes: number
    }
    latestNote: string
    latestPlayerMessage: string
    openRefs: Array<string>
    text: string
  }
}
```

### POST …/resolve

1 sampled response.

```ts
{
  case: {
    type: string
    caseId: string
    caseNumber: string
    contactKey: string
    reconPlayerId: string
    email: string
    product: string
    category: string
    subcategory: null
    intent: string
    source: string
    subject: string
    description: string
    status: string
    priority: string
    severity: string
    waitingOn: null
    assignee: null
    team: string
    refs: {
      subscription: null
      coachingSession: null
      vodJob: null
      replay: null
      identitySource: null
      conversation: null
      incidentId: null
    }
    escalation: null
    rootCause: null
    resolution: {
      summary: string
      code: string
      at: string
      by: string
    }
    learning: {
      productArea: null
      avoidable: null
      docGap: boolean
      onboardingGap: null
      bug: null
      featureRequest: null
    }
    tags: []
    csat: null
    sla: {
      firstResponseDueAt: string
      firstResponseAt: null
      nextResponseDueAt: string
      resolveTargetAt: string
    }
    classification: {
      suggestedCategory: string
      confidence: number
      engineStatus: string
    }
    redactions: []
    linkedFromCaseNumber: null
    linkedCaseNumbers: []
    playerVisible: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
    lastPlayerMessageAt: string
    resolvedAt: string
    closedAt: null
    reopenedAt: null
    reopenCount: number
    resolutionCount: number
    version: number
    answers: null
    context: null
    slaState: {
      firstResponse: string
      nextResponse: string
      resolve: string
      atRisk: boolean
      overdue: boolean
      state: string
    }
    allowedTransitions: Array<string>
  }
  kbProposal: {
    type: string
    id: string
    title: string
    body: null
    reason: string
    sourceCaseNumbers: Array<string>
    origin: string
    status: string
    published: boolean
    createdBy: string
    createdAt: string
    decidedAt: null
    decidedBy: null
    decisionNote: null
  }
}
```

### POST …/messages (staff)

1 sampled response.

```ts
{
  ok: boolean
  eventId: string
  status: string
  delivery: string
}
```

### POST …/notes

1 sampled response.

```ts
{
  ok: boolean
  eventId: string
}
```

### POST …/action-requests

1 sampled response.

```ts
{
  requestId: string
  caseNumber: string
  kind: string
  reason: string
  requiredVerification: string
  status: string
  history: Array<{
    at: string
    status: string
    by: string
  }>
  executesInSupport: boolean
  createdAt: string
}
```

### GET /cs/admin/support/incidents

1 sampled response.

```ts
{
  incidents: Array<{
    incidentId: string
    title: string
    service: string
    status: string
    severity: string
    owner: null | string
    affectedCount: null
    workaround: null | string
    internalNotes: null | string
    customerUpdate: {
      draft: string
      published: boolean
      updatedAt: string
      updatedBy: string
    } | null
    createdAt: string
    createdBy: string
    updatedAt: string
    resolvedAt: null | string
    version: number
    type: string
    linkedCaseCount: number
  }>
}
```

### GET /cs/admin/support/incidents/{id}

3 sampled responses.

```ts
{
  incident: {
    incidentId: string
    title: string
    service: string
    status: string
    severity: string
    owner: null | string
    affectedCount: null
    workaround: null | string
    internalNotes: null | string
    customerUpdate: {
      draft: string
      published: boolean
      updatedAt: string
      updatedBy: string
    } | null
    createdAt: string
    createdBy: string
    updatedAt: string
    resolvedAt: null | string
    version: number
    type: string
  }
  timeline: Array<{
    type: string
    eventId: string
    incidentId: string
    kind: string
    body: null | string
    data: {
      status?: string
      severity?: string
      from?: string
      to?: string
      published?: boolean
    }
    by: string
    at: string
  }>
  linkedCases: Array<{
    caseNumber: string
    status: string
    priority: string
    createdAt: string
  }>
}
```

### GET /cs/admin/support/metrics

2 sampled responses.

```ts
{
  window: {
    from: string
    to: string
  }
  generatedAt: string
  basis: string
  open: {
    total: number
    byStatus: {
      new?: number
      in_progress?: number
      waiting_on_player?: number
      escalated?: number
      triaged?: number
      waiting_on_provider?: number
    }
  }
  aging: {
    buckets: {
      lt_1d: number
      d1_3: number
      d3_7: number
      d7_14: number
      gt_14d: number
    }
    oldestOpenAgeMs: null | number
  }
  created: number
  firstResponse: {
    count: number
    medianMs: number
    p90Ms: number
    meanMs: number
  } | null
  awaitingFirstResponse: number
  resolution: {
    count: number
    medianMs: number
    p90Ms: number
    meanMs: number
  } | null
  reopen: {
    resolved: number
    reopened: number
    rate: null | number
  }
  volumePerActiveMember: number
  activeMembers: number
  categories: {
    desktop_client?: number
    access_entitlement?: number
    billing_question?: number
    rank_stat_discrepancy?: number
    vod_analysis?: number
    coaching_credits?: number
    bug?: number
    ubisoft_connection?: number
  }
  intents: {
    broken?: number
    how_to?: number
  }
  sources: {
    portal?: number
  }
  rootCauses: {
    stale_cache?: number
    answered?: number
  }
  issueCounts: {
    entitlement: number
    provider: number
    vod: number
    coaching: number
  }
  csat: {
    eligible: number
    responses: number
    responseRate: null | number
    distribution: {
      "1": number
      "2": number
      "3": number
      "4": number
      "5": number
      up: number
      down: number
    }
    positiveShare: null | number
  }
  repeatUsers: {
    count: number
    contacts: number
    share: null | number
  }
  incidents: {
    count: number
    perWeek: number
    byService: {
      vod_processing?: number
      identity_psn?: number
      auth?: number
    }
    bySeverity: {
      sev2?: number
      sev3?: number
    }
    linkedCases: number
  }
}
```

### GET /cs/admin/support/metrics (with data)

1 sampled response.

```ts
{
  window: {
    from: string
    to: string
  }
  generatedAt: string
  basis: string
  open: {
    total: number
    byStatus: {
      new: number
      in_progress: number
      waiting_on_player: number
      escalated: number
      triaged: number
      waiting_on_provider: number
    }
  }
  aging: {
    buckets: {
      lt_1d: number
      d1_3: number
      d3_7: number
      d7_14: number
      gt_14d: number
    }
    oldestOpenAgeMs: number
  }
  created: number
  firstResponse: {
    count: number
    medianMs: number
    p90Ms: number
    meanMs: number
  }
  awaitingFirstResponse: number
  resolution: {
    count: number
    medianMs: number
    p90Ms: number
    meanMs: number
  }
  reopen: {
    resolved: number
    reopened: number
    rate: number
  }
  volumePerActiveMember: number
  activeMembers: number
  categories: {
    desktop_client: number
    access_entitlement: number
    billing_question: number
    rank_stat_discrepancy: number
    vod_analysis: number
    coaching_credits: number
    bug: number
    ubisoft_connection: number
  }
  intents: {
    broken: number
    how_to: number
  }
  sources: {
    portal: number
  }
  rootCauses: {
    stale_cache: number
    answered: number
  }
  issueCounts: {
    entitlement: number
    provider: number
    vod: number
    coaching: number
  }
  csat: {
    eligible: number
    responses: number
    responseRate: number
    distribution: {
      "1": number
      "2": number
      "3": number
      "4": number
      "5": number
      up: number
      down: number
    }
    positiveShare: number
  }
  repeatUsers: {
    count: number
    contacts: number
    share: number
  }
  incidents: {
    count: number
    perWeek: number
    byService: {
      vod_processing: number
      identity_psn: number
      auth: number
    }
    bySeverity: {
      sev2: number
      sev3: number
    }
    linkedCases: number
  }
}
```

### GET /cs/admin/support/email/unmatched

1 sampled response.

```ts
{
  items: Array<{
    type: string
    id: string
    senderEmail: string
    senderVerified: boolean
    subject: string
    text: string
    reason: string
    suggestedContactKey: null | string
    suggestedCaseNumber: null | string
    messageIdHash: string
    redactions: []
    status: string
    receivedAt: string
  }>
}
```

### POST …/email/unmatched/{id}/assign

1 sampled response.

```ts
{
  ok: boolean
  caseNumber: string
  eventId: string
}
```

### GET /cs/help/articles

5 sampled responses.

```ts
{
  q: string
  articles: Array<{
    slug: string
    title: string
    summary: string
    category: string
    status: string
    score?: number
  }>
  status: string
  preview: boolean
}
```

### GET /cs/help/articles/{slug}

11 sampled responses.

```ts
{
  slug: string
  title: string
  category: string
  intents: Array<string>
  summary: string
  keywords: Array<string>
  body: string
  status: string
  reviewedBy: string
  reviewedOn: string
  sources: Array<string>
  preview: boolean
}
```

### error bodies

7 sampled responses.

```ts
{
  error: string
  code?: string
}
```

### 409 version_conflict

1 sampled response.

```ts
{
  error: string
  code: string
}
```

<!-- END GENERATED SHAPES -->
