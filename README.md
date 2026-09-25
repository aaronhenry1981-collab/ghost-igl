# Evidence: Recon 6 customer success (player home + CRM)

Screenshots for the customer-success pull request. This branch only holds
images; it is not meant to be merged.

- **All data is fictional.** Invented players on the reserved `.test` domain,
  served by the production Lambda code (`lambda/customer-success/app.mjs`)
  through `scripts/cs-dev-server.mjs` with in-memory tables.
- **No production system was contacted.** Production API and analytics
  hostnames were mapped to 127.0.0.1 during capture.
- Captured with Microsoft Edge (headless) over the DevTools protocol with
  real device emulation: desktop 1366px wide, phone 390px wide (downscaled
  to 1x). Every page was checked for horizontal overflow; none had any.
- Recaptured after the review fixes (commit f058ed5): billing KPIs now separate
  paying from trials and comps, and the queue escalates failed payments from
  the estimated failure date.
- The global footer shows `main`'s older tagline; production already uses a
  different footer.

| # | Scenario |
|---|---|
| 01 | New customer (signed up today) |
| 02 | Activated free player |
| 03 | Paying active player (Elite) |
| 04 | Paying player who cannot access the product (renewal not recorded) |
| 05 | Paying player whose payment failed yesterday (legacy $29 Elite; access paused, plan still named) |
| 06 | At-risk Champion |
| 10 | CRM overview |
| 11 | CRM action queue |
| 12 | CRM players |
| 13 | CRM player record (at-risk Champion) |
| 14 | CRM conversations (delivery disabled) |
| 15 | CRM outreach workflows |
| 16 | CRM feedback |
| 17 | CRM billing and customer health |
| 18 | CRM reviews and referrals |
| 19 | CRM onboarding |
| 20 | CRM product activity |
| 21 | CRM coaching and VOD |
