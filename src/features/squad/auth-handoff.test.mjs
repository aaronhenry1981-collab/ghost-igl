import test from 'node:test'
import assert from 'node:assert/strict'
import { isSquadStandalonePath } from './auth-handoff.mjs'
test('only the exact same-origin standalone preview uses a full-page auth handoff', () => {
  for (const path of ['/squad-preview/', '/squad-preview/index.html', '/squad-preview/?source=test', '/squad-preview/#invite=fixture']) assert.equal(isSquadStandalonePath(path), true)
  for (const path of ['https://attacker.invalid/squad-preview/', '//attacker.invalid/squad-preview/', '/squad-preview-evil/', '/squad-preview/../billing', '/squad-preview/\\attacker', '/squad-preview/\n', '/dashboard']) assert.equal(isSquadStandalonePath(path), false)
})
