# Claude Code Command — Wire the Strat-Blog Library into the Site (RECON6, 2026-07-14)

Aaron's Cowork Claude built a **strat-blog generator** that turns the whole strat library into 200 crawlable, SEO-optimized HTML pages — the Google half of the content engine (the TikTok strat videos are the other half; same source data, same slugs, cross-linked). Your job: get these pages live on r6coaching.com and indexing.

**This is additive and low-risk** (static files + one route rule + sitemap + a nav link). But it interacts with the SEO routing migration, so read the routing note below.

Repo: `ghost-igl` + S3 (`r6coaching.com-site`) + CloudFront (`E2WUR8DDHCOYC9`).

**Rules:** lint 0; `.\deploy.ps1` (build + S3 sync + CloudFront invalidate); **never `sam deploy`**; don't touch Cognito; verify an existing user can still log in; never paste secrets; one agent on `ghost-igl` at a time.

---

## SOURCE (already generated — do not rebuild unless content changed)
- Generator: `C:\IronFront_Master\strat-blogs\gen.py` (reads `strats.json`, pure stdlib, no deps).
- Output: `C:\IronFront_Master\strat-blogs\out\` — 200 × `how-to-{attack|defend}-{map}-{site}.html` + `index.html` + `sitemap-blog.xml`.
- Regenerate anytime after editing `src/data/strats.js`: re-export `strats.json`, then `python gen.py --all`. (Keep `strats.json` in sync — it's the extract the video generator uses too.)

Each page: unique `<title>`/`<h1>`/meta/canonical targeting the exact search phrase ("bank basement defense"), operators table, key utility, callouts, full strategy prose, Article+HowTo+Breadcrumb JSON-LD, a Champion **premium teaser** (labels only — the paid `premiumTactics` content is deliberately NOT dumped), and a `$20` coaching CTA. Self-contained (inline CSS, no JS, no external assets).

## 1. Place the files
- Copy `C:\IronFront_Master\strat-blogs\out\*.html` → `ghost-igl/public/blog/`.
- Copy `out/sitemap-blog.xml` → `ghost-igl/public/`.
- These are STATIC pages. They must be served as-is — **not** rendered by the React SPA and **not** swallowed by the SPA `index.html` fallback.

## 2. Routing — extensionless canonical URLs must resolve  ⚠️ the one real decision
The pages' canonical URLs are extensionless: `/blog/how-to-defend-bank-basement` (no `.html`). Make that resolve to the static object, ahead of the SPA fallback. Pick whichever fits the current CloudFront setup (you can see it; Cowork can't):
- **Option A (recommended): CloudFront Function** on viewer-request — if `uri` starts with `/blog/` and has no extension and isn't `/blog/`, append `.html`; map `/blog/` and `/blog` → `/blog/index.html`. Cleanest, keeps flat filenames.
- **Option B: directory style** — restructure each file to `public/blog/{slug}/index.html` at copy time and let the default root-object behavior serve it. No function needed, but 200 folders.

Whichever you choose: `/blog/` (the index) and every `/blog/{slug}` must return the real static HTML with a 200, and the SPA routes (`/`, `/coaching`, auth, Stripe return, billing portal) must all still work. **Do not let the blog route rule shadow any existing app route.**

## 3. Sitemap
- Add every `/blog/...` URL to the site's crawl surface. Either merge `sitemap-blog.xml` into the main `sitemap.xml`, or add it to a `sitemap-index.xml` that references both. Don't drop the existing app-page sitemap the SEO migration created.

## 4. Internal links (so Google finds it + it's usable)
- Add a **"Strats"** link to the site header nav and footer → `/blog/`. Orphaned pages don't rank; the hub needs a real in-site link from a high-traffic page.
- On `/coaching` and the strat/map pages, where it fits, link the matching `/blog/{slug}` (and vice-versa the blog CTA already points to `/coaching`). Internal linking both ways is the point.

## 5. Video cross-link (light touch, optional now)
- Each blog has a `<div class="video-slot" data-video="strat-{map}-{site}-{side}">` that currently links to the `@recon6coach` TikTok profile. When Aaron starts posting the per-site strat videos, you can later map `data-video` → the specific TikTok post URL. Not required for launch — the generic profile link is fine.

## 6. Deploy + verify
- `.\deploy.ps1` (build, S3 sync — make sure `public/blog/**` ships — CloudFront invalidate incl. `/blog/*`).
- Verify by DIRECT URL visit (not via SPA nav):
  - `https://r6coaching.com/blog/` renders the hub, grouped by map.
  - `https://r6coaching.com/blog/how-to-defend-bank-basement` renders, view-source shows the real `<title>`, `<h1>`, meta description, and JSON-LD (this is what Google sees — confirm it's in the HTML, not injected by JS).
  - A few more across different maps (`/blog/how-to-attack-clubhouse-church`, `/blog/how-to-defend-oregon-...`).
  - App routes unaffected: `/coaching` books, auth logs in, Stripe return + billing portal work, existing user logs in.
- After deploy: resubmit the sitemap in Search Console and URL-inspect 2–3 blog pages to confirm they're indexable.

## Definition of done
200 strat-blog pages live at real crawlable `/blog/...` URLs, hub linked from the site nav, sitemap resubmitted, JSON-LD present in the served HTML, no premium content leaked, no app route broken, existing login works, no `sam deploy`. Report what deployed and anything held for Aaron.
