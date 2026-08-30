const SITE_URL = process.env.SITE_URL || 'https://r6coaching.com'
const API_URL = process.env.API_URL
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID

function regionFromPool(userPoolId) {
  const [region] = (userPoolId || '').split('_')
  if (!region) throw new Error('COGNITO_USER_POOL_ID is missing')
  return region
}

async function probe(name, url, options, validate) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), ...options })
  const body = await response.text()
  const problem = validate(response, body)
  if (problem) throw new Error(`${name}: ${problem}`)
  return { name, status: response.status }
}

export async function handler() {
  if (!API_URL || !USER_POOL_ID || !CLIENT_ID) throw new Error('Auth health configuration is incomplete')

  const region = regionFromPool(USER_POOL_ID)
  const cognitoUrl = `https://cognito-idp.${region}.amazonaws.com/`
  const results = await Promise.all([
    probe('sign-in page', `${SITE_URL}/auth?health-check=1`, {}, (response, body) => {
      if (response.status !== 200) return `HTTP ${response.status}`
      return body.includes('id="root"') ? null : 'application shell missing'
    }),
    probe('user pool keys', `${cognitoUrl}${USER_POOL_ID}/.well-known/jwks.json`, {}, (response, body) => {
      if (response.status !== 200) return `HTTP ${response.status}`
      try {
        const data = JSON.parse(body)
        return Array.isArray(data.keys) && data.keys.length ? null : 'signing keys missing'
      } catch { return 'invalid signing-key response' }
    }),
    probe('app client', cognitoUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: '__recon6_health_check_do_not_create__@invalid.example',
          PASSWORD: 'HealthCheckOnly-NotARealPassword-9',
        },
      }),
    }, (response, body) => {
      if (response.status !== 400) return `HTTP ${response.status}`
      let type = ''
      try { type = JSON.parse(body).__type || '' } catch { return 'invalid Cognito response' }
      return /UserNotFoundException|NotAuthorizedException/.test(type) ? null : `unexpected ${type || 'response'}`
    }),
    probe('account API gate', `${API_URL}/me`, {
      headers: { authorization: 'Bearer recon6-health-check' },
    }, (response) => response.status === 401 ? null : `expected 401, got ${response.status}`),
  ])

  console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), results }))
  return { ok: true, results }
}
