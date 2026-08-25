import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cognitoConfig = readFileSync(new URL('./cognito.js', import.meta.url), 'utf8')

test('clean production builds retain the public Cognito and API configuration', () => {
  assert.match(cognitoConfig, /DEFAULT_USER_POOL_ID = 'us-east-1_rvLy8WLQB'/)
  assert.match(cognitoConfig, /DEFAULT_CLIENT_ID = '5bpa1cteenctoue24v4e245re8'/)
  assert.match(cognitoConfig, /DEFAULT_API_URL = 'https:\/\/u0k402df6j\.execute-api\.us-east-1\.amazonaws\.com\/prod'/)
  assert.match(cognitoConfig, /env\.VITE_COGNITO_USER_POOL_ID \|\| DEFAULT_USER_POOL_ID/)
  assert.match(cognitoConfig, /env\.VITE_COGNITO_CLIENT_ID \|\| DEFAULT_CLIENT_ID/)
})
