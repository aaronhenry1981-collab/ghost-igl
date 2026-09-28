// Player-facing entry points (account menu, mobile drawer, footer) stay hidden
// until support is switched on with VITE_SUPPORT_UI=true, matching the
// backend `features.support` flag (default off). Dev builds show them for
// review. The routes themselves are always registered so a direct link never
// silently redirects home; with the API off they show an honest fallback.
export const SUPPORT_UI_ENABLED = import.meta.env.VITE_SUPPORT_UI === 'true' || Boolean(import.meta.env.DEV)
