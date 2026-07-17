# Claude Code Command — Booking Calendar & Admin Appointments (top-of-the-line)

Build a real scheduling system: Aaron paints his availability on a calendar, customers self-book open slots in their own timezone, and every booking shows up on a proper admin calendar AND auto-syncs to Aaron's phone calendar. Repo: `ghost-igl` + AWS (`us-east-1`).

**This is the companion to `CLAUDE-CODE-COMMAND-paid-coaching.md`. Same data, one system. Build order: (0) verify the pipeline actually persists → (1) this calendar + admin → then wire payment from the coaching command onto the booking flow. Don't build them as two disconnected things.**

**Rules:** lint 0; `.\deploy.ps1` for the site; **never `sam deploy`** (per-function zips + `update-function-configuration`; template drift wipes the live webhook secret); don't touch the Cognito pool; verify an existing user can still log in; all AWS; never paste secrets. Quality bar: this should feel like Calendly/Cal.com, not a form. No placeholder UI, no dead buttons.

---

## STEP 0 — Audit the pipeline first (there may already be a silent hole)

Before building UI, prove the existing booking path works end to end, because a customer emailed about "my session" and it's unclear the booking was ever recorded:
- Confirm the `recon6-booking` Lambda is deployed and its routes are wired: `POST /booking`, `GET /booking/slots`, `GET/PUT /admin/availability`, `GET /admin/bookings`.
- Do a test `POST /booking` → confirm a row lands in the `recon6-bookings` DynamoDB table → confirm `GET /admin/bookings` returns it.
- Report what you find. If bookings are NOT persisting, fixing that is job #1 — a beautiful calendar over an empty table is worthless.

---

## STEP 1 — Data model (extend what exists, additively)

- **`recon6-availability`** — keep: weekly recurring windows, session length (default **60 min**), buffer between sessions (default 15 min), blackout dates. ADD: **one-off availability** (specific date+time ranges Aaron opens outside his weekly pattern) and **one-off time-off** (specific ranges he blocks). So availability = recurring windows + one-offs − blackouts − time-off − booked.
- **`recon6-bookings`** — keep PK `slotId`, status (`held`/`confirmed`/`comped`/`cancelled`/`completed`), customer {name,email,rank,goal,tz}, sessionType (`intro`/`single`/`package`), payment {status, amount, stripe id}, createdAt. ADD: `notes` (Aaron's private notes per booking), `remindersSent` (flags).
- All times stored **UTC**; convert for display. This is the #1 source of scheduling bugs — store UTC, render local, always label the timezone.

## STEP 2 — Admin: a real "Appointments" calendar (its own top-level tab)

Add a top-level **Appointments** tab to `AdminPage` (not buried under "Growth" — move the existing availability UI here too). Build it with **FullCalendar** (`@fullcalendar/react` + daygrid/timegrid/interaction plugins — `npm i`).

- **Month / Week / Day views**, toggleable. Default to Week.
- **Bookings render as events**, color-coded by status (confirmed = solid, held = amber/pending, comped = blue, cancelled = struck/grey, completed = green) and labeled with customer name + session type.
- **Availability renders as background shading** so Aaron sees, at a glance, his open bookable hours vs. what's booked vs. blocked.
- **Paint availability directly on the calendar:** click-drag on an empty time range to open a bookable window; click a window to edit/remove it. Plus a clean side editor for the recurring weekly pattern, session length, buffer, and blackout dates — no code edits to change hours, ever.
- **Click a booking → detail drawer:** customer name/email/rank/goal, session type, payment status + Stripe link, private notes field, and actions: **Reschedule**, **Cancel**, **Mark complete**, **Comp** (creates a $0 confirmed booking — the pass mechanism from the coaching command). Cancel/reschedule notify the customer and free the slot.
- **"Today" and upcoming strip** at the top: the next 3 sessions with time-until, so the day is obvious the second Aaron opens it.
- Mobile-usable — Aaron will check this on his phone.

## STEP 3 — Customer side: self-book open slots

- Public booking widget on `/coaching` (pairs with the paid flow): pick a date → see open slots **in the visitor's detected timezone** (show the tz label) → pick → short form (name, email, rank, goal) → for paid types, Stripe checkout (per the coaching command) → confirm.
- Open slots = availability windows − booked − blackouts − buffers, computed server-side. Never show a slot that can't actually be booked.
- **Soft-hold** the slot (`held` + short TTL) during checkout/form so two people can't grab it; conditional write on `slotId` makes double-booking impossible.

### Attribution — capture the source of every booking (REQUIRED)
Memberships already record `referral_source` via `src/lib/refSource.js` (captures `?ref=<source>` first-touch, e.g. `r6coaching.com/?ref=tiktok`). Coaching bookings currently capture **nothing** — close that gap:
- On `POST /booking`, read the stored ref source (`getRefSource()` from `src/lib/refSource.js`) and write it to the booking record as `referral_source`. If none, store `direct`.
- Surface it in the Appointments admin: show the source on the booking detail drawer (Step 2) and as a column/badge, so Aaron can see "this session came from tiktok / discord / direct."
- This is the only way to know which channel actually produces paying coaching customers. Without it, coaching attribution stays blind even though membership attribution works.

## STEP 4 — Notifications (the "easier for all" part)

- **On new booking:** email the customer (confirmation + prep + reschedule/cancel links + **`.ics` attachment**) AND email Aaron (new-booking alert) via SES. So Aaron is told without opening the admin.
- **Webcal subscription feed (the top-of-the-line touch):** expose a signed, private `GET /admin/calendar.ics` endpoint that returns all upcoming confirmed bookings as a live iCalendar feed. Aaron subscribes to it once (webcal://) in Google/Apple Calendar, and every booking — now and future — appears on his phone automatically, with reminders his phone already gives him. This is the single best "notification for all" and it's standard iCal, no third party.
- **Reminders:** an EventBridge-scheduled Lambda sends 24-hour and 1-hour reminders to both parties (set `remindersSent` flags so they fire once). The no-show killer.
- **On cancel/reschedule:** notify both, free/rebook the slot, update the .ics feed.

## STEP 5 — Reschedule / cancel (self-serve, no login)

Signed token-in-link (like the desktop activation tokens) so a customer can reschedule or cancel from their confirmation email without an account. Reschedule reopens the old slot and holds the new one atomically.

---

## Verify (definition of done — test it, don't assume)
- Step 0 pipeline audit reported; if bookings weren't persisting, they now do (prove with a test booking round-trip).
- Set availability by dragging on the admin calendar → the public widget immediately shows exactly those open slots in the visitor's timezone.
- Two simultaneous bookings of one slot → one wins, one gets a clean "just taken" message. No double-book.
- New booking → customer + Aaron both emailed; `.ics` opens correctly in Google and Apple Calendar; the booking appears on the admin calendar in the right slot.
- Subscribe to the webcal feed in a phone calendar → the booking shows up; a second test booking appears on refresh.
- 24h/1h reminders fire once each (test with a near-future slot).
- Cancel from the email link → slot frees, both notified, admin calendar updates, .ics feed drops it.
- Comp action creates a $0 confirmed booking with no checkout.
- **Attribution works:** book via `r6coaching.com/?ref=tiktok` → the booking record and the Appointments admin both show `tiktok` as the source; an untagged booking shows `direct`.
- Timezone correct end to end (book as a non-Pacific tz, confirm the admin shows Aaron's local time and the customer saw theirs).
- Lint 0, builds, `.\deploy.ps1`, no `sam deploy`, Lambdas per-function, Cognito untouched, existing login works.

**The test for "not junk":** Aaron opens the Appointments tab on his phone, sees his week, drags Friday 6–10pm open, and a stranger books Friday 7pm from a different timezone, pays, and it lands on Aaron's phone calendar with a reminder — all without Aaron touching code or checking email. When that whole loop works, it's top of the line.
```
