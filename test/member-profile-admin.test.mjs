import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('member identity fields drive dashboard and admin directory', () => {
  const subscription = read('lambda/subscription/index.mjs')
  const dashboard = read('src/pages/DashboardPage.jsx')
  const adminApi = read('lambda/admin/index.mjs')
  const adminUi = read('src/pages/AdminPage.jsx')
  assert.match(subscription, /'first_name'/)
  assert.match(subscription, /'last_name'/)
  assert.match(subscription, /p\.first_name && p\.last_name/)
  assert.match(dashboard, /profile\?\.first_name/)
  assert.match(adminApi, /r6_ubisoft_username/)
  assert.match(adminApi, /users\.sort/)
  assert.match(adminUi, /Search name, email, Discord/)
  assert.match(adminUi, /u\.first_name/)
  assert.match(adminUi, /r6_ubisoft_username/)
})
