// Where Heycatch analytics may run.
//
// The admin area shows customers' names, emails and account IDs in page
// titles, URLs (/admin/members/<account id>, ?q=<search>) and clickable text,
// and Heycatch (PostHog autocapture) records all three. So analytics never
// starts on an admin page, and every way into the admin is a full page load
// (adminHref / openAdmin below) so tracking started on a public page cannot
// carry over through client-side navigation.

const NO_ANALYTICS = /^\/(admin|__dev)(\/|$)/
let started = false

/** main.jsx calls this right after analytics.init(). */
export function markAnalyticsStarted() {
  started = true
}

/** True once analytics is running in this page load (it cannot be stopped). */
export function analyticsStarted() {
  return started
}

export function analyticsEnabledFor(pathname) {
  return !NO_ANALYTICS.test(String(pathname || ''))
}

export function isAdminPath(path) {
  return /^\/admin(\/|$|\?)/.test(String(path || ''))
}

/**
 * The sign-in return path for an admin page: the section only, never a
 * member's account ID or a search query, because the /auth page that carries
 * it in its URL is tracked.
 */
export function adminSigninReturn(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean)
  if (parts[0] !== 'admin') return '/admin'
  return `/${parts.slice(0, 2).join('/')}`
}
