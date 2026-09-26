# Admin: jobs Aaron does, and an information architecture built around them

Part of the September 25, 2026 growth and UX audit (`2026-09-25-growth-ux-audit.md`). This is a proposal for review. Nothing here is implemented.

## How the admin is organized today

One page, `/admin`, with a block of **4 stat cards, a 9-metric strip, a billing banner and 4 "needs attention" cards** above five tabs: Members, Coaching, Growth, Site content and System.

That is about 17 numbers before the first customer row, on every tab. Details are in the audit: P0-4, P1-8, P1-9, P1-10, P2-6 and P3-3.

## The jobs, by frequency

| Frequency | Job | Question behind it | Today |
|---|---|---|---|
| **Daily** | Check what needs attention | "Is anything wrong with money, customers or the site?" | Partly: the billing anomaly cards work; there is no system, email or CRM health view |
| Daily | Handle payment problems | "Who failed to pay, disputed or is about to churn?" | Payment-issue cards exist, but they are duplicated, and "cancel at period end" shows as Paid |
| Daily | Reply to customers | "Who wrote in and hasn't had an answer?" | Not possible: support mail forwards to Gmail; there is no queue |
| Daily | Run coaching sessions | "What sessions are today and tomorrow, and who needs a check-in?" | Works: the upcoming list and calendar feed |
| **Weekly** | Review revenue | "Who started, upgraded, cancelled or churned this week? What is MRR doing?" | Not possible: no date columns or sort; cancellation dates aren't stored |
| Weekly | Review growth | "Which videos and campaigns produced signups, activations and customers?" | Not possible: campaign data never reaches the server; the Source column shows source only |
| Weekly | Publish content and proof | "Post the announcement, testimonial or demo video" | Possible, but live immediately with no preview and hard deletes |
| Weekly | Plan coaching availability | "Open or close slots, mark time off" | Two editors that overwrite each other; no time-off control |
| **Rare** | Grant or revoke a complimentary membership | "Give a creator or a customer free access" | Works with a confirm dialog; no check whether the email already pays |
| Rare | Reconcile subscriptions with Stripe | "Repair drift between Stripe and the database" | Dangerous: no confirmation, and it can overwrite access and usage |
| Rare | Delete an account | "Remove a user on request" | Guarded by typing the email; the server check is weaker than the UI check |
| **Dangerous** | Refunds, cancellations, plan changes | "Undo a charge or end a subscription" | Not in the admin; done in the Stripe dashboard |

## Proposed structure

**Home: "Needs you now"** (the default view)
1. Money problems: failed payments, disputes, pending cancellations with their end dates.
2. Customers waiting: support threads older than 24 hours without a reply (needs a support inbox; see P2-6).
3. Today's coaching: sessions in the next 24 hours, check-ins due.
4. Growth anomalies: signups with no activation, checkout starts with no payment, week over week.
5. System: failing health checks, bounced emails, a Lambda deployed from an uncommitted tree.

Each item links to the exact record or view that resolves it. When nothing needs attention, the home says so in one line.

**Sections**, in order of frequency:
- **Customers:** search by email, name, gamertag or Stripe id. One consolidated record per person: plan and billing timeline, usage (VOD, coaching credits), appointments, feedback, attribution and notes.
- **Revenue:** a dated billing timeline (new, upgrade, downgrade, cancel scheduled, churned, refunded) with week and month filters, MRR, and collected versus refunded.
- **Coaching:** sessions (today, upcoming, past), one availability editor with time off, and session credits.
- **Growth:** the funnel by campaign and video (landing → interaction → signup → activation → checkout → paid) and a comp list for creators.
- **Content:** announcements, testimonials and the demo video. Each has a preview, an unpublish option, and delete only after unpublish.
- **Maintenance** (collapsed, last): Stripe reconciliation with a dry-run diff, account deletion and the audit log.

**Rules** (standard section 11):
- Destructive actions name the object and the consequence.
- Reconciliation shows a dry run before writing.
- Every money-affecting or customer-visible action is written to the audit log.
- Filters and saved views replace long tables.
- The mobile layout shows the attention list first and the tables last.

## Suggested order of work

These map to the audit's P-numbers.
1. **Guard reconciliation.** Add confirmation and a dry-run diff, never overwrite usage or `cognito_sub`, and audit it. (P0-4)
2. **Stop the dead KPIs.** Render only fields the deployed admin Lambda returns, and hide or implement "Trials expected to convert". (P1-8)
3. **Consolidated customer record** with search by name and gamertag. (P1-9)
4. **Dated revenue timeline**, storing cancellation and "cancel at period end" dates in the webhook. (P1-8)
5. **Attention-first home.** (P2-6)
6. **Coaching:** one availability editor, time off, and comped slots counted as taken. (P1-10)
7. **Support queue.** (P2-6)
