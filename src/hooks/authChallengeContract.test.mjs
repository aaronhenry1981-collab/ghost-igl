import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const authProvider = readFileSync(new URL('./useAuth.jsx', import.meta.url), 'utf8')
const authPage = readFileSync(new URL('../pages/AuthPage.jsx', import.meta.url), 'utf8')

test('handles Cognito first-login password challenges end to end', () => {
  assert.match(authProvider, /newPasswordRequired:\s*\(/)
  assert.match(authProvider, /completeNewPasswordChallenge\(/)
  assert.match(authProvider, /delete attributes\.email_verified/)
  assert.match(authPage, /mode === 'new-password'/)
  assert.match(authPage, /completeNewPassword\(password\)/)
})

test('does not treat the first-login challenge as a successful sign-in', () => {
  assert.match(authProvider, /data:\s*\{ challenge: 'NEW_PASSWORD_REQUIRED' \}/)
  assert.match(authPage, /data\?\.challenge === 'NEW_PASSWORD_REQUIRED'/)
})
