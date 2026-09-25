// Cognito ID-token authentication, matching the other Recon Lambdas
// (aws-jwt-verify, tokenUse 'id', admins = Cognito group "admins").
//
// Identity is ALWAYS taken from the verified token. No header, query string
// or body field can change whose data a request reads or writes; admin
// "view as player" is a separate read-only admin route.
//
// Records are keyed by email, so the email claim must be verified: a user can
// change their own email attribute, and until they confirm it the new address
// appears in fresh tokens with email_verified=false. Such tokens are refused
// (production's /me routes apply the same rule).

import { CognitoJwtVerifier } from 'aws-jwt-verify'

export function createCognitoAuthenticator({ userPoolId, clientId, verifier = null, adminGroup = 'admins', log = console }) {
  const jwt = verifier || CognitoJwtVerifier.create({ userPoolId, tokenUse: 'id', clientId })
  return async function authenticate(req) {
    const header = String(req.headers?.authorization || '')
    const token = header.replace(/^Bearer\s+/i, '')
    if (!token || token === header) return null
    try {
      const payload = await jwt.verify(token)
      const email = String(payload.email || '').trim().toLowerCase()
      if (!email || !payload.sub) return null
      if (payload.email_verified !== true && payload.email_verified !== 'true') {
        log.warn?.('cs_email_unverified')
        return null
      }
      const groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'] : []
      return { email, sub: payload.sub, groups, isAdmin: groups.includes(adminGroup), name: payload.name || null }
    } catch (err) {
      log.warn?.('cs_jwt_rejected', { error: err?.name || 'Error' })
      return null
    }
  }
}
