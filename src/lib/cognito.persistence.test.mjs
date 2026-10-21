import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  CognitoUserPool, CognitoUser, CognitoUserSession,
  CognitoIdToken, CognitoAccessToken, CognitoRefreshToken,
} from 'amazon-cognito-identity-js'
import { getSession, getIdToken } from './cognito.js'

// In-memory SDK persistence only: no production storage, sign-in or network.
function storage() {
  const items = new Map()
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value), removeItem: key => items.delete(key) }
}
function session(expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000)
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${encode({ alg: 'none' })}.${encode({ sub: 'synthetic-only', iat: now - 7200, exp: now + expiresIn })}.synthetic`
  return new CognitoUserSession({
    IdToken: new CognitoIdToken({ IdToken: token }),
    AccessToken: new CognitoAccessToken({ AccessToken: token }),
    RefreshToken: new CognitoRefreshToken({ RefreshToken: 'synthetic-not-a-credential' }),
    ClockDrift: 0,
  })
}
function cached(expiresIn) {
  const shared = storage()
  const pool = () => new CognitoUserPool({ UserPoolId: 'us-east-1_synthetic', ClientId: 'synthetic-client', Storage: shared })
  const signedIn = new CognitoUser({ Username: 'synthetic@example.test', Pool: pool(), Storage: shared })
  signedIn.setSignInUserSession(session(expiresIn))
  return { restored: pool().getCurrentUser(), pool }
}

test('a valid cached sign-in survives a new SDK pool instance without a network login', async () => {
  const { restored } = cached(3600)
  const refresh = mock.method(restored, 'refreshSession', () => { throw new Error('Unexpected refresh') })
  const result = await getSession(restored)
  assert.equal(result.isValid(), true)
  assert.equal(typeof getIdToken(result), 'string')
  assert.equal(refresh.mock.callCount(), 0)
})

test('expired ID/access tokens use the existing refresh path before rejecting the sign-in', async () => {
  const { restored } = cached(-10)
  const fresh = session(3600)
  const refresh = mock.method(restored, 'refreshSession', (refreshToken, callback) => {
    assert.equal(refreshToken.getToken(), 'synthetic-not-a-credential')
    callback(null, fresh)
  })
  assert.equal(await getSession(restored), fresh)
  assert.equal(refresh.mock.callCount(), 1)
})

test('refresh failure rejects instead of manufacturing a signed-in session', async () => {
  const { restored } = cached(-10)
  mock.method(restored, 'refreshSession', (_token, callback) => callback(new Error('Synthetic refresh refused')))
  await assert.rejects(getSession(restored), /Synthetic refresh refused/)
})

test('SDK sign-out removes the cached user from a new pool instance', () => {
  const { restored, pool } = cached(3600)
  restored.signOut()
  assert.equal(pool().getCurrentUser(), null)
})
