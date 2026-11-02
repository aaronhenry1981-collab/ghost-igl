import { ApiError } from './service.mjs'
// This adapter is valid only behind the declared HTTP API JWT authorizer and
// exact API Gateway invoke policy. It does not verify arbitrary client JWTs.
export function createGatewayAuthenticator({ apiId, issuer, audience, now = Date.now }) {
  if (!apiId || !issuer?.startsWith('https://cognito-idp.us-east-1.amazonaws.com/') || !audience) throw new Error('The exact gateway and Cognito contract are required')
  return async event => {
    const context = event?.requestContext, claims = context?.authorizer?.jwt?.claims
    if (context?.apiId !== apiId || !claims || claims.iss !== issuer || claims.aud !== audience || claims.token_use !== 'id' || typeof claims.sub !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(claims.sub) || !Number.isFinite(Number(claims.exp)) || Number(claims.exp) * 1000 <= now()) throw new ApiError(401, 'SIGN_IN', 'Sign in to Recon again.')
    return { subject: claims.sub, tokenExpiresAt: Number(claims.exp) * 1000 }
  }
}
