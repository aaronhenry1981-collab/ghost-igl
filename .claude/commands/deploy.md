---
description: Fast deploy to r6coaching.com — preflight checks, build, S3 sync, CloudFront invalidate
---

You're running a guided fast deploy of Ghost IGL to production. Aaron triggered this command and wants the site pushed to r6coaching.com with minimal fuss but with safety rails.

## Preflight checks (DO ALL — abort if any fail)

1. **Working tree sanity.** Run `git status --short` and report what's modified/untracked. If there are unrelated untracked files (e.g. `.env`, `*.zip`, `*.log`), call them out — don't push secrets to S3.

2. **Source-code sanity.** Grep `src/` for accidental debug leftovers:
   ```bash
   grep -rn "console.log\|debugger\|TODO: REMOVE\|XXX\|FIXME-RELEASE" src/ 2>/dev/null
   ```
   If matches found, show them and ask Aaron whether to ship as-is or abort. (Some `console.error` is fine; raw `console.log` in shipped code usually isn't.)

3. **Lint check (best effort).** Run `npm run lint` if available. If it fails on errors (not warnings), abort and show output. If it passes or only has warnings, proceed.

4. **Build clean.** Run `npm run build`. This also regenerates sitemap, OG images, and guides. If the build fails, abort and show the error — never push a half-built `dist/`.

5. **Confirm the diff scope.** Tell Aaron in one line what's about to ship. e.g. "Deploying: founding-pricing landing copy + DownloadPage rewrite + 3 strats.js entries. ~12 files changed."

## Deploy step

Run `.\deploy.ps1` from the project root. This script:
- Runs the build pipeline (npm run build)
- Syncs `dist/` → `s3://r6coaching.com-site` with `--delete`
- Fixes the SVG content-type on OG images so social previews render
- Invalidates CloudFront `E2WUR8DDHCOYC9` with `/*`

Stream the output. If any step fails (S3 sync error, CloudFront permission issue), surface it immediately and tell Aaron what to check (usually AWS credentials or rate limits).

## Post-deploy verification

1. Wait ~30 seconds, then `curl -I https://r6coaching.com` — expect HTTP 200 + `cloudfront` in the response headers.
2. Optional smoke check on a critical page: `curl -s https://r6coaching.com/#/ | grep -o 'Founding Member'` — quick proof the new copy made it live.
3. Tell Aaron the CloudFront invalidation typically finishes in 1–2 min, so any browser hitting the site within that window may see cached old HTML.

## Output format

Use a simple status feed Aaron can scan:
```
✓ git status — clean / 3 expected changes
✓ no debug leftovers
✓ lint passed
✓ build succeeded (1.4 MB)
→ deploying...
✓ S3 sync complete (47 files, 8 deleted)
✓ CloudFront invalidation queued: I3ABC123XYZ
✓ verification: HTTP 200 from r6coaching.com
DONE — live in 1–2 minutes.
```

If you abort at any preflight step, write a single clear line: `ABORT: <reason>` and tell Aaron how to fix it. No drama.

## Reminders to surface only when relevant

- If Aaron just edited `lambda/`, remind him this script does NOT deploy Lambda code (separate flow with `aws lambda update-function-code`).
- If Aaron just edited `aws/template.yaml`, remind him to also `cd aws && sam build && sam deploy`.
- If Aaron just edited the desktop app at `C:\IronFront_Master\igl-coach-ps5\`, remind him this is a separate repo with its own deploy.
