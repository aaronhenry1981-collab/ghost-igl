# Evidence: keyboard focus fixes (WCAG 2.4.3, 2.4.7)

Screenshots and tab-order logs for the navbar / button focus pull request.
This branch only holds evidence; it is not meant to be merged.

- **before** = unmodified `content/strat-beta-disclaimer` @ 8054871.
- **after** = the fix branch `claude/a11y-focus-order-visible`.
- Real keyboard input: trusted Tab, Shift+Tab, Enter and Escape key events
  sent over the DevTools protocol to Microsoft Edge (headless), desktop
  1366x900 and phone 390x844 (device emulation, 2x). Production API,
  analytics and Stripe hosts were mapped to 127.0.0.1.
- `before-report.json` / `after-report.json`: every focus stop with its
  text, whether it sits in the drawer, whether it is on screen, and the
  computed box-shadow.

| Check | Before | After |
|---|---|---|
| Desktop: Tab stops inside the hidden drawer (first 30 stops) | 13 | 0 |
| Phone: focus after opening the drawer | stays on the hamburger | drawer close button |
| Phone: Tab past the last drawer control | escapes to the page behind the backdrop | wraps to the first drawer control |
| Phone: Escape | nothing (drawer stays open) | closes; focus back on the hamburger |
| Focused .btn-primary / .btn-outline | no visible indicator (ring clipped) | inset white + dark ring |
| Focused .btn-ghost | outer cyan ring | same inset ring as other buttons |

Files: `*-desktop-focus-btn-{primary,ghost,outline}.png`,
`*-phone-drawer-focus-btn-{primary,ghost}.png`, `*-phone-focus-toggle.png`,
`*-phone-drawer-open.png`.
