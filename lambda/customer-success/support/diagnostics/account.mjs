// Account provider: Cognito login + profile row (PR #24 facts).

import { dateOnly, fact, inference, panel, sourceData, sourceStatus } from './shared.mjs'

const PLAYER_TEXT = {
  ok: 'Signed in and confirmed',
  no_account: 'No Recon login found for this email',
  disabled: 'Login is disabled',
  unconfirmed: 'Email not confirmed yet',
  force_change_password: 'First sign-in not finished',
  reset_required: 'Password reset required',
  unknown: 'Could not check',
}

export async function accountProvider({ one, facts, identity }) {
  const accountStatus = sourceStatus(one, 'account')
  const profileStatus = sourceStatus(one, 'profile')
  if (!facts || (accountStatus === 'unavailable' && profileStatus === 'unavailable')) {
    return panel('account', 'Account and login', 'unavailable', {
      facts: [fact('Account', 'could not be read right now', 'cognito / ghost-igl-profiles', null, 'player')],
      signals: { accountStatus: 'unknown' },
    })
  }
  const a = facts.account
  const profile = sourceData(one, 'profile')
  const cognito = one?.cognitoUser || null
  const out = [
    fact('Login', PLAYER_TEXT[a.status] || 'Could not check', accountStatus === 'ok' ? 'cognito' : 'session', null, 'player'),
  ]
  if (a.profileComplete !== null) out.push(fact('Player profile', a.profileComplete ? 'complete' : 'not finished', 'ghost-igl-profiles', null, 'player'))
  out.push(
    fact('Cognito status', accountStatus === 'ok' ? String(cognito?.status || a.status) : `${accountStatus} (${a.status})`, 'cognito', a.createdAt),
    fact('Account created', dateOnly(a.createdAt) || 'not recorded', 'cognito / ghost-igl-profiles', a.createdAt),
    fact('Last seen', dateOnly(a.lastSeenAt) || 'not recorded', 'ghost-igl-profiles last_seen_at', a.lastSeenAt),
    fact('Profile row', a.hasProfileRow === null ? 'could not be read' : a.hasProfileRow ? 'present' : 'missing', 'ghost-igl-profiles'),
    fact('Profile bound to login', profile ? (profile.cognito_sub ? 'yes (cognito_sub set)' : 'no cognito_sub on profile') : 'no profile row', 'ghost-igl-profiles'),
  )
  const infs = []
  const email = identity?.email || facts.identity.email
  if (cognito?.email && email && cognito.email !== email && cognito.email.toLowerCase() === email) {
    infs.push(inference('Legacy mixed-case login', 'likely', 'the Cognito user email differs from the lowercased contact email only by case; the pool is case-sensitive', 0.8))
  }
  const user = []
  const recon = []
  if (a.status === 'unconfirmed') user.push('Enter the confirmation code from your sign-up email, or request a new one from the sign-in page.')
  if (a.status === 'force_change_password' || a.status === 'reset_required') user.push('Use "Forgot password" on the sign-in page to set a new password.')
  if (a.status === 'no_account') recon.push('Confirm which email paid; any account change is an account_recovery action request.')
  if (a.status === 'disabled') recon.push('Login disabled: record an account_recovery action request for a lead to review.')
  if (a.profileComplete === false) user.push('Finish your player profile (name, gamertag and platform).')

  let status = 'ok'
  if (accountStatus === 'unavailable' || profileStatus === 'unavailable') status = 'degraded'
  else if (accountStatus === 'not_connected' && profileStatus === 'ok' && !profile && !identity?.signedIn) status = 'not_recorded'
  return panel('account', 'Account and login', status, {
    facts: out,
    inferences: infs,
    user,
    recon,
    signals: { accountStatus: a.status, signedIn: identity?.signedIn === true || accountStatus === 'ok', profileComplete: a.profileComplete },
  })
}
