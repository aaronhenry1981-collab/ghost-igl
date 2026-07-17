# Claude Code Command — SEO Routing Fix (HashRouter → real URLs)  ⚠️ HIGH IMPACT, BUILD CAREFULLY

**The single biggest SEO blocker.** The site uses `createHashRouter`, so every page is a `#/` fragment URL. Google ignores everything after `#`, so `r6coaching.com/#/strats`, `/#/coaching`, every blog post and strat guide are all seen as *one page* (the homepage). Search Console confirms it: **101 pages not indexed vs 16 indexed.** All the SEO content that's been written cannot rank until this is fixed.

Repo: `ghost-igl` + CloudFront (`E2WUR8DDHCOYC9`) + S3 (`r6coaching.com-site`) + Route 53.

**This is a real migration with real blast radius — do it as a careful, tested pass, not a rush.** Every internal link, the auth redirects, old bookmarks, and the CloudFront config are all in scope.

**Rules:** lint 0; `.\deploy.ps1` (build + S3 sync + CloudFront invalidate); **never `sam deploy`**; don't touch the Cognito pool; verify an existing user can still log in; all AWS.

---

## What "fixed" means
Real crawlable URLs (`r6coaching.com/strats`, `/coaching`, `/climb`, `/blog/<slug>`), each serving real HTML with unique title/meta, listed in a real sitemap — so Google indexes each page as its own rankable URL.

## Build

### 1. Router: HashRouter → BrowserRouter
- `src/main.jsx`: `createHashRouter` → `createBrowserRouter`. Routes stay the same; URLs lose the `#`.
- Audit **every** internal link/navigation for hardcoded `#/` (`<a href="#/...">`, `navigate('#/...')`, any string with `/#/`). All must become clean paths. Grep the whole `src/` tree — miss one and it 404s.
- Auth redirects, the desktop-activation return URLs, Stripe `success_url`/`return_url`, and email links that point at `#/` must all be updated to real paths. **Check the subscription Lambda's `PORTAL_RETURN_URL` and any SES email links too.**

### 2. CloudFront: SPA fallback (so real paths don't 404)
With BrowserRouter, hitting `/strats` directly asks S3 for a `/strats` object that doesn't exist. Configure so any unmatched path serves `index.html` with a **200**:
- Add a **CloudFront Function** (viewer-request) that rewrites non-file requests to `/index.html`, **or** set custom error responses mapping 403/404 → `/index.html` with response code 200.
- Prefer the CloudFront Function — custom-error-response remapping can mask real 404s and hurt SEO. Keep real 404s returning 404.

### 3. Prerender content pages (so Google gets HTML, not an empty shell)
A client-rendered SPA still indexes poorly even with clean URLs, because the initial HTML is empty. Prerender the public, content-heavy routes to static HTML at build time:
- Add a prerender step (react-snap, `vite-plugin-prerender`, or a small Puppeteer script post-`vite build`) that generates static HTML for: `/`, `/coaching`, `/climb`, `/strats` + each map/site strat page, `/operators`, `/meta`, `/loadouts`, and every `/blog/<slug>`.
- Each prerendered page must have a unique `<title>`, meta description, canonical, and OG tags (use react-helmet or equivalent). Right now they likely share the homepage's.
- Gated/auth/admin routes do NOT need prerendering — only public content.

### 4. Sitemap: real URLs
- Rewrite `public/sitemap.xml` (and the generator if there is one) to list real paths — `https://r6coaching.com/strats`, `/coaching`, `/climb`, every `/blog/<slug>` — **no `#/`**. Include `<lastmod>`.
- Keep it in sync with the prerendered routes. Resubmit in Search Console after deploy.

### 5. Redirect old hash URLs (don't orphan existing links/bookmarks)
- Add a tiny script in `index.html` that, on load, rewrites a legacy `/#/x` to `/x` (`if (location.hash.startsWith('#/')) location.replace(location.pathname + location.hash.slice(1))`). So old shared links and Discord/bio links still land right.

---

## Verify (definition of done — test hard, this touches everything)
- Every public route loads at its real URL by **direct visit** (type `r6coaching.com/strats` in a fresh tab → loads, no 404, no blank).
- **View source** on a prerendered page (not devtools DOM) shows real content + a unique `<title>`/meta — that's what Google sees.
- Deep links, auth flow, Stripe checkout return, and the billing portal return all land on the correct real path.
- An old `/#/strats` link redirects cleanly to `/strats`.
- `sitemap.xml` contains only real URLs; no `#/` anywhere in it.
- Existing user can still log in; existing subscriber unaffected.
- Lint 0, `.\deploy.ps1`, CloudFront invalidated, **no `sam deploy`**, Cognito untouched.
- After deploy: resubmit the sitemap in Search Console and spot-check a few URLs with the URL Inspection tool → "URL is available to Google."

---

## Why this is the top SEO priority
Every strat guide, blog post, and landing page already written is currently invisible to Google as a distinct page. This one fix makes all of that existing content indexable and rankable — a bigger organic-traffic unlock than any amount of new content or hashtags. Do it once, carefully, and the content engine finally has a bottom in the bucket.
