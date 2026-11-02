export function createExistingAccountClient({ load = () => import('../../lib/cognito') } = {}) {
  let binding = null
  async function connect() {
    const sdk = await load(), user = sdk.getCurrentUser()
    if (!user) throw new Error('Sign in to your existing Recon account, then return here.')
    const username = user.getUsername(), session = await sdk.getSession(user), subject = session?.getIdToken()?.payload?.sub
    if (sdk.getCurrentUser()?.getUsername() !== username || typeof subject !== 'string' || !subject) throw new Error('The account changed. Connect again.')
    binding = { sdk, subject, username }; return { subject }
  }
  function currentSubject() { return binding && binding.sdk.getCurrentUser()?.getUsername() === binding.username ? binding.subject : null }
  return {
    connect, currentSubject,
    async identity() {
      const captured = binding
      if (!captured || currentSubject() !== captured.subject) throw new Error('The existing account session changed.')
      const user = captured.sdk.getCurrentUser(), session = await captured.sdk.getSession(user)
      if (binding !== captured || currentSubject() !== captured.subject || session?.getIdToken()?.payload?.sub !== captured.subject) throw new Error('The account changed. Connect again.')
      const token = captured.sdk.getIdToken(session)
      if (!token) throw new Error('Sign in to Recon again.')
      return { subject: captured.subject, token }
    },
    disconnect() { binding = null },
    subscribe(onChanged, target = globalThis) {
      const changed = event => { if (event.key?.startsWith('CognitoIdentityServiceProvider.')) { binding = null; onChanged() } }
      target.addEventListener?.('storage', changed)
      return () => target.removeEventListener?.('storage', changed)
    },
  }
}
