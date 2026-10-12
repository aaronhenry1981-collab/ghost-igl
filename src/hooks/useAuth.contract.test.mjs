import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('normal sign-in waits for entitlement hydration before resolving', async () => {
  const source = await readFile(new URL('./useAuth.jsx', import.meta.url), 'utf8')
  const successBlock = source.slice(source.indexOf('if (result.ok)'), source.indexOf('async function completeNewPassword'))
  assert.match(successBlock, /await checkProStatus\(userData\.id, payload, session\)/)
})
