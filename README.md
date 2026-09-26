# Evidence: /start social sales page

Screenshots and the interaction report for the pull request on `claude/recon6-social-sales-landing`. This branch only holds evidence; it is not meant to be merged.

## How it was captured
- **Browser:** headless Microsoft Edge driven over the DevTools protocol, pointed at the branch's Vite dev server.
- **Widths:**
  - `phone-390`: 390×844 at 2×, touch — the primary layout.
  - `phone-430`: 430×932 at 2×, touch.
  - `desktop`: 1440×900.
- **Entry URL:** `/start?utm_source=tiktok&utm_medium=social&utm_campaign=site_files&utm_content=ep001_oregon`.
- **Network:**
  - The page received the **real public testimonials** (saved from `GET /testimonials` on the live API), so the proof section renders as it would in production.
  - Every other production API call, plus Plausible and Stripe, was blocked. Nothing was sent anywhere.

## Files
| File | What it shows |
|---|---|
| `*-01-initial-viewport.png` | The first screen at each width |
| `*-00-full-page.png` | The whole page |
| `*-section-demo.png` | Product proof: the real free round plan with footage-verified callouts |
| `*-section-free-vs-pro.png` | Free vs Pro |
| `*-section-proof.png` | Proof: verified-footage counts and the two live testimonials |
| `*-section-pricing.png` | Pricing, with billing, cancellation and refund terms |
| `*-section-final-cta.png` | The final CTA |
| `phone-390-demo-after-switch-coastline-kitchen-defense.png` | The demo after switching to Coastline · Kitchen · Defense |
| `phone-390-sticky-cta-mid-page.png` | The sticky phone CTA, shown only between the demo and pricing |
| `phone-390-signup-destination.png` | Where "Open my free round plan" lands: `/auth`, with the 12-character password rule |
| `phone-390-signup-from-pro-cta.png` | Where "Start Pro" lands when signed out: signup, then back to `/start?checkout=pro` |
| `report.json` | Measured layout, CTA destinations, interaction checks and stored attribution |

## Interaction checks (from `report.json`)
**Layout:**
- No horizontal overflow at any width.
- No tap target under 44 px.
- The hero CTA is at y 276–334 on a 390 px phone, and the demo card starts at y 426.

**CTAs and demo:**
- The primary CTA leads to `/auth?mode=signup&redirect=/strats/bank/ceo/attack`.
- After switching the demo to Coastline · Kitchen · Defense, it leads to `…redirect=/strats/coastline/kitchen-service/defense`.
- The signed-out "Start Pro" button leads to `/auth?mode=signup&redirect=/start?checkout=pro`. The pending checkout is recorded for the return event.

**Page behavior:**
- Sticky CTA: hidden at the top, visible mid-page, hidden at pricing.
- The first objection opens with the native disclosure control.

**Attribution:** the first-touch attribution stored after the visit was `{"source":"tiktok","medium":"social","campaign":"site_files","content":"ep001_oregon"}`.
