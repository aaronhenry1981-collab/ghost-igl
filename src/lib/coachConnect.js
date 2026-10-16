// Transfer only the refreshed current session, never every cached account.
export function coachSessionEntries(clientId, username, session) {
  if (!clientId || !username || !session?.isValid?.()) return null
  const idToken = session.getIdToken?.()?.getJwtToken?.()
  const accessToken = session.getAccessToken?.()?.getJwtToken?.()
  const refreshToken = session.getRefreshToken?.()?.getToken?.()
  if (!idToken || !accessToken || !refreshToken) return null
  const prefix = `CognitoIdentityServiceProvider.${clientId}`
  return {
    [`${prefix}.LastAuthUser`]: username,
    [`${prefix}.${username}.idToken`]: idToken,
    [`${prefix}.${username}.accessToken`]: accessToken,
    [`${prefix}.${username}.refreshToken`]: refreshToken,
    [`${prefix}.${username}.clockDrift`]: String(session.getClockDrift?.() || 0),
  }
}
