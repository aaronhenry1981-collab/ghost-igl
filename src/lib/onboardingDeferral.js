// A player who clicks a /start CTA was promised a round plan. After signup
// they land on that plan, so the welcome and profile modals stay out of the
// way on the strategy pages (and /auth) and appear once the player moves on.
// First value before profile setup: docs/GROWTH-UX-OPERATING-STANDARD.md, §7.
// Per browser tab (sessionStorage); every other visitor is unaffected.
const KEY = 'recon:plan-first'
const PLAN_PATHS = ['/strats', '/auth']

export function deferOnboardingUntilAfterPlan(storage = globalThis.sessionStorage) {
  try { storage?.setItem(KEY, '1') } catch { /* storage blocked: onboarding shows as usual */ }
}

export function onboardingDeferredHere(pathname = '', storage = globalThis.sessionStorage) {
  try {
    return storage?.getItem(KEY) === '1' && PLAN_PATHS.some((path) => pathname.startsWith(path))
  } catch {
    return false
  }
}
