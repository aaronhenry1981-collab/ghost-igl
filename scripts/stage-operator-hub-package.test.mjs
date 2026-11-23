import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { stageOperatorHubPackage } from './stage-operator-hub-package.mjs'
import { HUB_FIXTURE } from '../review-tests/operator-hub-fixture.mjs'
const digest = data => createHash('sha256').update(data).digest('hex')
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'operator-hub-package-fixture-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const target = join(root, 'SubscriptionFunction')
  mkdirSync(target, { mode: 0o700 })
  writeFileSync(join(target, 'package.json'), '{"name":"ghost-igl-subscription-api"}')
  writeFileSync(join(target, 'index.mjs'), "import './operator-hub.mjs'")
  writeFileSync(join(target, 'operator-hub.mjs'), 'function encodeOperatorHubCatalog(){}')
  const source = join(root, 'operator-hub-content.json')
  const data = Buffer.from(JSON.stringify(HUB_FIXTURE))
  writeFileSync(source, data, { mode: 0o600 })
  return { target, source, data, staged: join(target, 'operator-hub-content.json') }
}
test('stages only the exact synthetic digest once in the protected package', { skip: process.platform === 'win32' }, t => {
  const { target,source,data,staged } = fixture(t)
  assert.equal(stageOperatorHubPackage(source, digest(data), target), digest(data))
  assert.ok(readFileSync(staged).equals(data))
  assert.equal(statSync(staged).mode & 0o777, 0o600)
  assert.throws(() => stageOperatorHubPackage(source, digest(data), target), { code:'EEXIST' })
})
test('rejects altered hash, unsafe modes, and surplus fields before writing', { skip: process.platform === 'win32' }, t => {
  const { target,source,data,staged } = fixture(t)
  assert.throws(() => stageOperatorHubPackage(source, '0'.repeat(64), target), /approved release digest/)
  chmodSync(source, 0o644)
  assert.throws(() => stageOperatorHubPackage(source, digest(data), target), /owner-only/)
  chmodSync(source, 0o600)
  const extra = JSON.stringify({ ...HUB_FIXTURE, unexpected:'synthetic field' })
  writeFileSync(source, extra)
  assert.throws(() => stageOperatorHubPackage(source, digest(extra), target), /outside the approved response contract/)
  assert.equal(existsSync(staged), false)
})
