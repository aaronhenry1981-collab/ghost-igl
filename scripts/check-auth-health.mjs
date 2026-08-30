#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const configSource = readFileSync(new URL('../src/lib/cognito.js', import.meta.url), 'utf8')

function readDefault(name) {
  const match = configSource.match(new RegExp(`const ${name} = '([^']+)'`))
  if (!match?.[1]) throw new Error(`Missing ${name} in src/lib/cognito.js`)
  return match[1]
}

export const authConfig = {
  userPoolId: readDefault('DEFAULT_USER_POOL_ID'),
  clientId: readDefault('DEFAULT_CLIENT_ID'),
  apiUrl: readDefault('DEFAULT_API_URL'),
  siteUrl: 'https://r6coaching.com',
}

function regionFromPool(userPoolId) {
  const [region] = userPoolId.split('_')
  if (!region || !/^[-a-z0-9]+$/.test(region)) throw new Error('Invalid Cognito user pool region')
  return region
}

async function requireResponse(name, url, options, validate) {
  const response = await fetch(url, { cache: 'no-store', ...options })
  const body = await response.text()
  const error = validate(response, body)
  if (error) throw new Error(`${name}: ${error}`)
  return name
}

export async function checkAuthHealth(config = authConfig) {
  const region = regionFromPool(config.userPoolId)
  const cognitoUrl = `https://cognito-idp.${region}.amazonaws.com/`
  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${config.userPoolId}/.well-known/jwks.json`

  return Promise.all([
    requireResponse('Sign-in page', `${config.siteUrl}/auth?health-check=1`, {}, (response, body) => {
      if (response.status !== 200) return `expected HTTP 200, got ${response.status}`
      return body.includes('id="root"') ? null : 'application shell is missing'
    }),
    requireResponse('Cognito user pool', jwksUrl, {}, (response, body) => {
      if (response.status !== 200) return `expected HTTP 200, got ${response.status}`
      try {
        const data = JSON.parse(body)
        return Array.isArray(data.keys) && data.keys.length ? null : 'signing keys are missing'
      } catch { return 'invalid signing-key response' }
    }),
    requireResponse('Cognito app client', cognitoUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.clientId,
        AuthParameters: {
          USERNAME: '__recon6_health_check_do_not_create__@invalid.example',
          PASSWORD: 'HealthCheckOnly-NotARealPassword-9',
        },
      }),
    }, (response, body) => {
      if (response.status !== 400) return `unexpected HTTP ${response.status}`
      let type = ''
      try { type = JSON.parse(body).__type || '' } catch { return 'invalid Cognito response' }
      return /UserNotFoundException|NotAuthorizedException/.test(type) ? null : `unexpected Cognito response ${type || 'unknown'}`
    }),
    requireResponse('Protected account API', `${config.apiUrl}/me`, {
      headers: { authorization: 'Bearer recon6-health-check' },
    }, (response) => response.status === 401 ? null : `expected HTTP 401, got ${response.status}`),
  ])
}

if (import.meta.url === `file:///${process.argv[1]?.replaceAll('\\', '/')}`) {
  try {
    const checks = await checkAuthHealth()
    console.log(`Login health passed: ${checks.join(', ')}`)
  } catch (error) {
    console.error(`Login health failed: ${error.message}`)
    process.exitCode = 1
  }
}
