# Iron Front Digital — Nationwide Prospect Research
**Run date:** 2026-09-18
**Window prioritized:** 2026-09-11 → 2026-09-18 (last 7 days)
**Scope:** US-wide. Buyer-intent requests for website creation, redesign, landing pages, marketing help.
**Status:** RESEARCH ATTEMPTED — **0 verified prospects returned.** Blocked by session network policy. Details below.

---

## 1. Headline result

**Qualified candidates found: 0 verified, 4 unverified pointers.**

This is the real number, not a placeholder. It is not a statement that no such
prospects exist — it is a statement that **this session could not reach any source
where they live.** Every social platform and freelance marketplace required for this
task is blocked by the network egress policy on this container.

No prospect below is presented as verified. Nothing in this report was inferred,
reconstructed from memory, or filled in to reach a target count.

---

## 2. Why: environment and access limitations

### 2.1 Wrong machine
The task specifies working in `C:\Users\aaron\OneDrive\Desktop\Iron Front Digital`.
This session is a **remote Linux container**, not your Windows desktop. That path does
not exist here, and no OneDrive volume is mounted.

```
Primary working directory: /home/user/ghost-igl   (the Ghost IGL / r6coaching.com repo)
Mounts checked: /mnt/attach (empty), /mnt/user-data/working (empty), /media (empty)
Search for *OneDrive* / *Iron*Front* across filesystem: no results
```

### 2.2 Prior research not available — dedupe could not be performed
`artifacts/revenue-social-2026-09-11/` **did not exist** in this environment. I checked
the working tree, the full git history across all branches, and the filesystem:

```
find / -type d -name "revenue-social-2026-09-11"     -> no results
git log --all --name-only | grep -i artifact          -> no results
grep -rn "revenue-social" .                           -> no results
```

The only outreach log present is `.claude/customer-outreach-log.md`, which belongs to
**Ghost IGL**, not Iron Front Digital. It contains three lines of subscription-metric
entries (2026-05-21, 2026-05-28, 2026-07-03) and one Ghost IGL free-signup email. It
has no IFD prospect or outreach history.

**Consequence:** I could not exclude previous contacts, declined businesses, or
duplicate aliases from any prior run. The only exclusions I can apply are the three
you named in this request:

| Business | Rule |
|---|---|
| Mountain Aire | **Never contact proactively** |
| Cleaning Cranberry | Declined — do not re-approach |
| The Two Fraus Bakery | Declined — do not re-approach |

Any future run must re-read the real prior artifacts before contacting anyone.

### 2.3 Network egress — every required source is blocked
Two independent outbound paths were tested. Both are policy-restricted.

**Path A — direct `curl` via the agent proxy:** rejected at CONNECT with 403
(`connect_rejected`, organization policy). Per the proxy README, policy denials must be
reported, not routed around. I did not attempt to bypass.

**Path B — WebFetch:** returns `EGRESS_BLOCKED` for every host tried, including
neutral ones. Access map established by direct probe:

| Host | Needed for | Result |
|---|---|---|
| facebook.com | FB groups, posts, comments | EGRESS_BLOCKED |
| linkedin.com | LI posts, job/help requests | EGRESS_BLOCKED |
| tiktok.com | captions + comments | EGRESS_BLOCKED |
| x.com | live search | EGRESS_BLOCKED |
| reddit.com / old.reddit.com | r/smallbusiness, r/forhire, r/Entrepreneur | BLOCKED (both paths) |
| nextdoor.com | local requests | EGRESS_BLOCKED |
| upwork.com | posted buyer jobs | EGRESS_BLOCKED |
| craigslist.org | services-wanted / gigs | EGRESS_BLOCKED |
| thumbtack.com | inbound service requests | EGRESS_BLOCKED |
| alignable.com | SMB networking asks | EGRESS_BLOCKED |
| news.ycombinator.com | "Who wants to be hired" threads | EGRESS_BLOCKED |
| duckduckgo.com | independent search | EGRESS_BLOCKED |
| en.wikipedia.org | *(neutral control)* | EGRESS_BLOCKED |

The Wikipedia control confirms this is a **blanket allowlist policy**, not
anti-bot defense on the social platforms.

### 2.4 Login was never reached as the blocker
You asked me to name which site needs login. **Login is not the current obstacle.**
I could not reach the *public, logged-out* surface of any of these platforms. Signing
in would not help from this container — the hosts are unreachable at the network layer.
Your signed-in sessions live in your local browser, which this container cannot use.

### 2.5 What still worked — and why it was not sufficient
`WebSearch` functions. It is a **search-index summarizer**: it returns titles and URLs,
and it cannot open a page. That fails your explicit requirements in three ways:

1. **Posting dates unverifiable.** You said crawl dates are not posting dates. Correct —
   and I have neither. I cannot open a post to read its timestamp.
2. **Content unverifiable.** I cannot read a caption, a comment thread, or whether a
   requester later wrote "found someone, thanks."
3. **Identity unverifiable.** I cannot confirm a public name, business, or US location.

Search returned almost entirely **vendor-side SEO content** — agency directories
(DesignRush, NinjaPromo), "how to hire a web designer" blog posts, and website-builder
listicles. Those are competitors and content marketers, exactly the vendor category you
told me to exclude. That is the expected shape of these queries against a search index:
the buyers are inside login-walled feeds; the sellers own the indexed web.

---

## 3. Verified recent buyer requests (last 7 days)

**None. Count: 0.**

No item below the line met the verification bar. I am not promoting anything into this
section to fill it.

---

## 4. Candidates needing qualification (UNVERIFIED — do not contact as-is)

These four URLs surfaced in search result titles. **I could not open any of them.** For
every one, the poster's name, business, location, posting date, stated budget, deadline,
and whether the request is still open are all **unknown**. Two are very likely stale.

They are listed only so your local run has a starting thread to pull — **not** as
prospects, and not as anything to message today.

---

### U-1 — Facebook group post: "Looking for someone who can build a website! Thanks!"
- **Platform / link:** Facebook group post — `https://www.facebook.com/groups/761471874488562/posts/2063722824263454/`
- **Posting date:** **UNKNOWN — unverified.** Could not open the post. No date in the search result.
- **Request:** Search-result title reads *"Looking for someone who can build a website! Thanks!"* Full text, comments, and any "found someone" follow-up were not readable.
- **Budget / deadline:** Not stated in anything I could see.
- **Why IFD could fit:** If genuine and open, a from-scratch small-business build maps directly to the Website Sprint ($797 one page / $1,497 five pages).
- **Open or fulfilled:** **UNKNOWN.** Group posts asking this usually collect vendor replies within hours; assume likely fulfilled until proven otherwise.
- **Invited contact method:** Unknown — not readable. Do not DM cold; the post may specify comment-only, and group rules may forbid pitching.
- **Missing:** Everything material — name, business, state, date, scope, budget, status, group's self-promo rules.
- **Qualify first:** Open the permalink while signed in. Check post date, read the comment thread for a resolution, and **read the group's pinned rules before replying.**

### U-2 — Facebook group post: "Affordable freelance web designer to update business ..."
- **Platform / link:** Facebook group post — `https://www.facebook.com/groups/337911350786238/posts/1801439037766788/`
- **Posting date:** **UNKNOWN — unverified.**
- **Request:** Title truncated in the index at *"Affordable freelance web designer to update business ..."* — reads as a **redesign/update** request with price sensitivity. Body not readable.
- **Budget / deadline:** Not visible. "Affordable" implies budget sensitivity — the $797 one-page tier is the relevant anchor, not the $1,497 tier.
- **Why IFD could fit:** Redesign of an existing small-business site is core Website Sprint work.
- **Open or fulfilled:** **UNKNOWN.**
- **Invited contact method:** Unknown.
- **Missing:** Name, business, state, date, current site URL, page count, status, group rules.
- **Qualify first:** Same as U-1. Note a different group ID than U-1 — check each group's rules separately.

### U-3 — JustAnswer thread: outdated company website, can't find a designer
- **Platform / link:** JustAnswer — `https://www.justanswer.com/software/d18mi-looking-advice-website-design-company.html`
- **Posting date:** **UNKNOWN — unverified.** JustAnswer pages are commonly years old and re-indexed.
- **Request:** Summarized by search as an owner saying their company website is badly outdated and they cannot find someone to do the work.
- **Why IFD could fit:** Textbook redesign profile — *if* it were recent.
- **Open or fulfilled:** **Likely stale.** Treat as low priority.
- **Invited contact method:** None. JustAnswer askers are typically anonymized with no public contact path.
- **Missing:** Identity, date, location, contact route. **Recommend dropping unless the page shows a date inside the last 7 days.**

### U-4 — AnandTech forum threads (two)
- **Platform / links:** `https://forums.anandtech.com/threads/looking-for-a-website-designer.1997673` and `https://forums.anandtech.com/threads/affordable-web-design.740076`
- **Posting date:** **UNKNOWN — unverified**, but AnandTech's sequential thread IDs place both in the **2000s–early 2010s**.
- **Status:** **Assume dead. Recommend dropping entirely.** Listed only for completeness of what search surfaced.

---

## 5. Excluded during this run

| Category | Detail |
|---|---|
| Named do-not-contact | Mountain Aire (never proactively), Cleaning Cranberry (declined), The Two Fraus Bakery (declined) |
| Vendors selling their own services | The large majority of search output: DesignRush, NinjaPromo, Dribbble, DesignCrowd, Bitcot, Webnode, Shopify, Unbounce, Zapier, Wix/Squarespace listicles, individual agency blogs |
| Non-US / wrong intent | `findajob.dwp.gov.uk` employment listing (UK government job board — an employer hiring staff, not a client buying a site) |
| Prior contacts | **Could not be excluded — prior artifacts unavailable.** See §2.2 |

---

## 6. Offer reference (verified, for outreach use)

**Website Sprint — verified pricing:**
- **$797** — one page, one-time
- **$1,497** — five pages, one-time
- Domain and any ongoing services are **separate** line items

**Other marketing requests (SEO, ads, social, email, automation):** identify the
opportunity, then **flag scope and pricing for verification before quoting.** Do not
quote these from the Sprint numbers.

**Hard claim limits — do not state, imply, or hint at any of these:**
- No operational AI phone service
- No guaranteed revenue, lead volume, or ranking outcomes
- No invented customer results, case studies, names, or testimonials

---

## 7. Outreach message templates

No real prospects were verified, so there is nothing to personalize against. Writing
"personalized" messages to unverified people would mean inventing their situation —
which is exactly the failure mode to avoid.

These are **request-shaped templates**. Fill every `[bracket]` from the actual post
before sending. If a bracket cannot be filled from what the person actually wrote,
the prospect is not qualified yet.

**A — New site, from scratch**
> Hi [Name] — saw your post in [group/sub] about needing a site built for [business]. I do a fixed-price Website Sprint: $797 for a one-page site, $1,497 for five pages, one-time, domain separate. No retainer, no upsell. If [specific thing they mentioned] is the priority, one page usually covers it. Want me to send two examples of similar builds?

**B — Redesign of an existing site**
> Hi [Name] — you mentioned [their site / "outdated site"] needs updating. I rebuild small-business sites on a flat fee: $797 for one page, $1,497 for five, one-time, domain separate. If you tell me which pages actually earn their keep, I'll tell you straight whether you need five or just one.

**C — Landing page for a specific campaign/deadline**
> Hi [Name] — you're after a landing page for [campaign] by [their stated deadline]. That's a $797 one-page Sprint, one-time, domain separate. Send me the offer and where the traffic's coming from and I'll tell you if the date is realistic before you commit anything.

**D — Unhappy with a current provider**
> Hi [Name] — saw you're stuck with [stated problem: no replies / unfinished build / can't get edits done]. I work fixed-price and hand over full ownership: $797 one page, $1,497 five pages, one-time, domain separate. Happy to look at what you've already got and tell you whether it's salvageable or faster to rebuild.

**E — Marketing ask outside the Sprint** *(scope unverified — do not quote a price)*
> Hi [Name] — read your post about [specific marketing need]. That's outside my fixed-price website work, so I won't throw a number at you blind. Tell me [the one qualifying detail] and I'll come back with either a real scope or an honest "not my lane."

---

## 8. Runbook to actually execute this — on your machine

This is the fastest path to a real list. Run it locally where your logins work.

**Prioritize:** posts dated **2026-09-11 or later**. Open each post and read the actual
timestamp — hover the relative time ("2d") to get the absolute date. **Never trust a
search snippet's date.**

**Highest-yield sources, in order:**
1. **Facebook groups** — local "[City] Small Business Owners", "[City] Entrepreneurs", industry groups (contractors, salons, restaurants, real estate). Search inside each group for: `need a website`, `web designer`, `website help`, `landing page`, `recommendations for a website`. **Read each group's pinned rules first** — many ban vendor replies outright and will remove you for pitching.
2. **Reddit** — r/smallbusiness, r/Entrepreneur, r/forhire (`[Hiring]` flair), r/webdev, r/marketing, r/AskMarketing. Sort **New**, filter **past week**. Reddit shows exact post times on hover.
3. **LinkedIn** — content search for `need a website` / `looking for a web designer`, filtered to **Past week**, plus your own feed's comment threads.
4. **Nextdoor** — Business/Recommendations, very strong for local service businesses.
5. **X/Twitter** — live search on the same phrases, `Latest` tab.
6. **TikTok** — weaker signal, and check **comments** as much as captions; requests hide there.

**Qualify before logging anyone.** A prospect counts only when you have: a real request in their own words, a verified post date inside the window, a US location, and a contact route they invited. Followers, likes, or a bad-looking website are **not** buying intent.

**Disqualify on sight:** agencies/freelancers advertising themselves, posts already
answered with "found someone / thank you all", non-US, and anyone on the exclusion list.

**Then:** drop the results into the real `artifacts/revenue-social-2026-09-11/` folder on
your desktop so the next run can dedupe against them properly.

---

## 9. Optional lead source available but not used

The **Apollo.io** connector is attached to this session. I deliberately did not use it:

1. Its searches are **credit-consuming** — you instructed me not to spend money.
2. It is a **firmographic** database. It tells you a company exists and who works there. It does **not** surface "this person publicly asked for a website this week," which is the entire basis of this request.

It could later help **enrich a prospect you have already verified** — e.g. confirming a
business's location or finding an owner's role. Say the word and I'll surface the
estimated credit cost before any spend.

---

## 10. Compliance

Actions taken: read-only local filesystem inspection, git history inspection, web
searches, and web-fetch attempts. Report written to disk.

Not done, per instruction: no messages sent, no comments posted, no money spent, no
account changes, no permission expansion, no application code modified. No egress
policy was bypassed. No identities, contact details, dates, or quotes were guessed or
invented anywhere in this document.
