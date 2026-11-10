// Public request categories only. Never include identity, tokens, response bodies,
// endpoint query strings or raw provider errors in support details.
export function hostingConnection(grant, failureCode) {
  if (!grant?.enabled) return failureCode === 'HOSTING_DENIED' ? 'Account connected; hosting is not enabled.' : 'Account connected; hosting access has not been verified.'
  return grant.kind === 'owner' ? 'Account connected; create or join a private squad' : 'Account connected; create or join an approved trial squad'
}
export function hostingFailure(problem) {
  const status = Number(problem?.status)
  if (status === 401 || problem?.name === 'StaleAccountError') return { signIn: true, code: 'HOSTING_SIGN_IN', message: 'Your sign-in could not be verified. Sign in to Recon again before using a private squad.' }
  if (status === 403) return { code: 'HOSTING_DENIED', message: 'Hosting is not enabled for this account. You may join a valid private invitation.' }
  if (problem?.name === 'AbortError' || problem?.name === 'TimeoutError') return { code: 'HOSTING_TIMEOUT', message: 'The hosting check timed out. Keep this view online and visible, then use Refresh hosting access.' }
  if (status >= 500 && status <= 599) return { code: `HOSTING_HTTP_${status}`, message: `The squad service could not complete the hosting check (HTTP ${status}). Use Refresh hosting access to retry this read.` }
  if (status >= 400 && status <= 499) return { code: `HOSTING_HTTP_${status}`, message: `The hosting check was rejected (HTTP ${status}). Use Refresh hosting access; if it repeats, share the support details below.` }
  if (problem instanceof TypeError || problem?.name === 'TypeError') return { code: 'HOSTING_CONNECTION', message: 'This device could not complete the connection to the squad service. Check its connection, then use Refresh hosting access.' }
  return { code: 'HOSTING_UNVERIFIED', message: 'Hosting access could not be verified. Use Refresh hosting access; if it repeats, share the support details below.' }
}
export function publicBuildLabel(doc = globalThis.document) {
  try {
    const src = doc?.querySelector('script[type="module"][src]')?.getAttribute('src')
    const match = typeof src === 'string' && src.match(/(?:^|\/)assets\/(squad-demo-[A-Za-z0-9_-]+)\.js(?:$|[?#])/)
    return match ? match[1] : 'development-or-unknown'
  } catch { return 'development-or-unknown' }
}
