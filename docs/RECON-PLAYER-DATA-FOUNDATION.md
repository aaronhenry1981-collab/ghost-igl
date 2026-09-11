# Recon Player Data Foundation

This is the data spine for Recon 6. External services bootstrap or verify player information; Recon owns the durable historical record.

## Non-negotiable rules

- `recon_player_id` is Recon's canonical player key. It is derived from the stable Cognito `sub`, not email, Ubisoft username, PSN name, Xbox name, or TRN profile name.
- External providers are adapters, never the permanent system of record.
- Historical observations and snapshots are append-oriented. Canonical values are selected separately; conflicts are retained.
- Important observations retain source, capture time, season, confidence, verification, freshness, and visibility.
- Normal customers cannot submit a snapshot and label it `ubisoft`, `trn`, `replay`, `vod`, or another trusted source. Trusted provenance is reserved for admin/server-side ingestion.
- Recon does not accept or store TRN passwords, Ubisoft passwords, platform passwords, access tokens, refresh tokens, cookies, API secrets, or similar credential-shaped fields in player-data payloads.
- Removing one provider must not break the rest of Recon.

## What is implemented

### Canonical identity

`lambda/player-data/core.mjs` generates a deterministic `RP-...` identifier from Cognito's immutable user subject. External identities live in a separate table and attach to that ID.

Username changes do not create a new Recon player. Linked identity rows preserve a bounded username history.

### Historical data model

The isolated SAM stack in `aws/player-data-template.yaml` creates:

| Table | Purpose |
| --- | --- |
| `recon-player-store` | Canonical player record and current selected values |
| `recon-player-identities` | Ubisoft/PSN/Xbox/TRN identity links and username history |
| `recon-player-snapshots` | Immutable point-in-time source snapshots |
| `recon-player-observations` | Field-level values with provenance and conflict history |
| `recon-player-events` | Player improvement/activity timeline |
| `recon-player-provider-health` | Provider availability/latency/schema/auth/rate-limit observations |

Production table names use the `recon-player` prefix by default. Override `TablePrefix` for validation stacks.

Historical tables use DynamoDB point-in-time recovery and CloudFormation retain policies so an accidental stack replacement/deletion does not silently erase player history.

### Existing-player bootstrap

The frontend keeps the existing `/me` flow. When `VITE_PLAYER_DATA_API_URL` is configured, `useUserRole` makes a best-effort authenticated call to `/player-data/me`.

On first use, the player-data Lambda:

1. resolves the Cognito `sub` to `recon_player_id`;
2. reads the existing `ghost-igl-profiles` row;
3. creates a permanent player record;
4. writes a `joined_recon` timeline event;
5. writes a historical onboarding baseline from available profile/R6 fields;
6. marks that baseline as player-reported/manual, not falsely verified external data.

The bootstrap is idempotent and does not block the existing profile experience if the new service is unavailable.

### Provider layer

`lambda/player-data/providers.mjs` defines modular provider descriptors for:

- Ubisoft
- Tracker Network (TRN)
- PlayStation Network
- Xbox Network
- Siege replay parser
- Recon VOD analysis
- Recon Desktop
- Recon coach observations
- manual player input

Official/provider transports are intentionally injected behind the provider contract rather than imported throughout the app.

Expected adapter methods include `resolveIdentity`, `fetchCurrentProfile`, `fetchCurrentSeason`, `fetchRank`, `fetchMatchSummary`, `fetchOperatorStats`, `fetchRecentMatches`, `fetchPlatformMetadata`, `fetchAvailableHistory`, `verifyIdentity`, and `healthCheck`.

### Provenance and canonical selection

Every observation can retain:

- `source`
- `captured_at`
- `season`
- `confidence`
- `verification`
- `fresh_until`
- calculated `freshness_state`
- `visibility`

Recon keeps conflicting observations. `selectCanonicalObservation()` chooses the value the application should currently use based on freshness, field-specific source priority, verification, confidence, and recency.

Example: a fresh authorized Ubisoft rank wins over a fresh TRN rank. A fresh TRN observation can temporarily beat an old/stale Ubisoft observation rather than displaying stale data as current. The stale Ubisoft observation remains in history.

`getLatestVerifiedRank()` is provider-independent; application code should consume that abstraction/canonical player data rather than calling a vendor-specific rank function.

### Source priority

The default hierarchy is configurable in code and can vary by field.

Competitive account statistics favor official/approved external sources. Replay-derived factual gameplay metrics (opening deaths, trades, survival, plants, utility/drone metrics, etc.) favor replay/VOD/Desktop evidence. Coaching/behavioral observations favor coach/VOD/replay evidence.

This prevents one global source order from incorrectly deciding every type of player intelligence.

### Security boundary for trusted data

Authenticated users may submit manual/player-reported snapshots.

Non-admin users cannot mark their own HTTP submission as official Ubisoft, verified TRN, replay-derived, or other trusted provider data.

Trusted provider/replay/VOD ingestion uses direct Lambda invocation (`source: recon.player-data`, `detail.action: ingest_snapshot`) and therefore depends on explicit AWS IAM `lambda:InvokeFunction` permission rather than an unauthenticated public endpoint.

### API

Authenticated routes:

- `GET /player-data/me`
- `POST /player-data/identities`
- `POST /player-data/snapshots`
- `GET /player-data/history?field=rank`
- `POST /player-data/events`
- `GET /player-data/timeline`
- `GET /player-data/export`
- `GET /player-data/providers`
- `POST /player-data/provider-health` (admin only)

`GET /player-data/export` is sectioned/paginated (`profile`, `identities`, `snapshots`, `observations`, `events`) so a long-lived player does not exceed API response limits.

### Privacy/deletion readiness

User-owned records include ownership, deletion classification, and retention-policy metadata. Visibility supports:

- private
- coach
- squad
- Team Recon
- public
- anonymized analytics

This foundation does not automatically publish player intelligence. Future user-facing sharing controls should enforce these values before Squad Finder/Team Recon/public profile data is exposed.

The export API is implemented. Actual account-erasure orchestration should be added only with the final retention/legal policy so the application does not promise deletion behavior that conflicts with required records.

## How this feeds Recon features

All future feature code should read the canonical/historical player layer rather than make its own player-stat tables:

- **Road to Champion:** compare current state, historical weaknesses, mission events, and subsequent observations.
- **Rank progression:** query `rank`, RP/MMR, K/D, win-rate, and match-count histories.
- **Personalized coaching:** consume canonical player context plus replay/VOD-derived observations.
- **Missions:** write `mission_assigned`, `mission_completed`, and performance-change events.
- **Squad Finder:** build matching inputs from rank, role, schedule, map/operator strengths, and verified historical tendencies, with explainable fit factors.
- **Team Recon:** use explicit team-visible fields rather than exposing the whole private profile.
- **Retention/reviews:** trigger prompts from real usage/outcome events while keeping testimonial publication opt-in.
- **Coaching preparation:** provide coaches the fields explicitly visible to coaches plus recent history.

The current repository does not yet contain production implementations of Road to Champion, Squad Finder matchmaking, Team Recon, or the mission engine. This foundation is the shared contract those features should now build on instead of creating disconnected player records.

## External access still required

The architecture is ready for adapters, but no code should pretend external access exists before it is authorized.

- **Ubisoft:** wire the official adapter when approved/authorized access is available.
- **TRN:** use approved API/partnership access if available. Do not automate customer password login and do not store TRN credentials.
- **PSN/Xbox:** wire only supported/authorized identity APIs.
- **Replay parser:** call the trusted ingestion path after the replay parser produces normalized facts.
- **VOD:** the existing VOD service can invoke trusted ingestion after analysis output is mapped to normalized fields.
- **Recon Desktop:** add trusted signed/server-mediated observations when the desktop telemetry/data flow is finalized.

## Validation before deployment

From the repository root:

```powershell
npm ci
npm test
npm run lint
npm run build
```

Validate the isolated stack:

```powershell
cd aws
sam validate --lint -t player-data-template.yaml
sam build -t player-data-template.yaml
```

Deploy a non-production validation stack first with a non-production `TablePrefix`. Verify:

1. a signed-in test account calls `/player-data/me`;
2. the same Cognito user always receives the same `recon_player_id`;
3. the old profile becomes one onboarding baseline only;
4. a second call creates no duplicate baseline;
5. manual rank history appends rather than overwrites;
6. canonical rank changes correctly as fresher/higher-authority observations arrive;
7. a payload containing `password`, `token`, `secret`, `cookie`, or similar credential keys is rejected;
8. a normal user cannot submit `source: ubisoft` or `source: trn`;
9. exports return only the authenticated player's data;
10. provider health writes require an admin Cognito session.

After the stack is approved and deployed, set the frontend deployment environment variable:

```text
VITE_PLAYER_DATA_API_URL=<PlayerDataApiUrl stack output>
```

Then rebuild/deploy the site using the existing approved Recon deployment process.

## Deployment boundary

This branch does not deploy AWS resources, change billing, contact customers, or merge itself. Infrastructure creation and production wiring remain explicit approval gates.
