// Player-facing entry points (account menu, mobile drawer, footer) stay hidden
// until support is switched on with VITE_SUPPORT_UI=true, matching the
// backend `features.support` flag (default off). Dev builds show them for
// review. The routes themselves are always registered so a direct link never
// silently redirects home; with the API off they show an honest fallback.
export const SUPPORT_UI_ENABLED = import.meta.env.VITE_SUPPORT_UI === 'true' || Boolean(import.meta.env.DEV)

// Help Center links are separate: the API serves reviewed articles only, so
// until articles are reviewed and published the links stay hidden rather
// than pointing players at an empty page. /help itself stays routable.
export const HELP_CENTER_UI_ENABLED = import.meta.env.VITE_HELP_CENTER_UI === 'true' || Boolean(import.meta.env.DEV)
