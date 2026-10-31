import assert from 'node:assert/strict'
import config from '../vite.config.js'
const key = 'VITE_LIVE_COACH_API_BASE_URL'
const previous = process.env[key]
try {
  for (const value of ['', 'https://unapproved.example/prod']) {
    process.env[key] = value
    assert.throws(() => config({ command: 'build', mode: 'production' }), /not connected/)
  }
  process.env[key] = 'https://gc3tzbeeoi.execute-api.us-east-1.amazonaws.com/prod'
  assert.ok(config({ command: 'build', mode: 'production' }).plugins.length)
  console.log('PASS: missing/wrong production endpoint rejected; approved endpoint accepted')
} finally { if (previous === undefined) delete process.env[key]; else process.env[key] = previous }
