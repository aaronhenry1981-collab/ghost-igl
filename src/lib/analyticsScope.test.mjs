// Heycatch must never run on admin pages, and nothing in the public app may
// enter the admin through client-side navigation (which would keep a tracker
// started on a public page running inside the admin).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminSigninReturn, analyticsEnabledFor, isAdminPath } from './analyticsScope.mjs'

const SRC = fileURLToPath(new URL('..', import.meta.url))

test('analytics runs on public pages, never on admin or dev previews', () => {
  for (const p of ['/', '/strats/bank/ceo/attack', '/account', '/auth', '/administrator-guide', '/r/abc']) assert.equal(analyticsEnabledFor(p), true, p)
  for (const p of ['/admin', '/admin/', '/admin/members/fx-0001', '/admin/crm/support/cases/1', '/__dev/admin']) assert.equal(analyticsEnabledFor(p), false, p)
})

test('admin sign-in return path keeps the section and drops account ids and searches', () => {
  assert.equal(adminSigninReturn('/admin/members/e4880428-f091-70b4-43f9'), '/admin/members')
  assert.equal(adminSigninReturn('/admin/crm/players/some-key'), '/admin/crm')
  assert.equal(adminSigninReturn('/admin'), '/admin')
  assert.equal(adminSigninReturn('/elsewhere'), '/admin')
  assert.equal(isAdminPath('/admin/members'), true)
  assert.equal(isAdminPath('/administrator'), false)
})

test('main.jsx starts Heycatch only where analyticsEnabledFor allows', () => {
  const main = readFileSync(join(SRC, 'main.jsx'), 'utf8')
  const init = main.indexOf('analytics.init(')
  assert.ok(init > 0, 'analytics.init is called')
  assert.match(main.slice(Math.max(0, init - 120), init), /if \(analyticsEnabledFor\(window\.location\.pathname\)\)/)
})

test('no client-side link into the admin from outside it', () => {
  const offenders = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const rel = relative(SRC, p).split('\\').join('/')
      if (statSync(p).isDirectory()) { if (!/^features\/(admin|dev)$/.test(rel)) walk(p); continue }
      if (!/\.(jsx|js)$/.test(name)) continue
      const text = readFileSync(p, 'utf8')
      for (const m of text.matchAll(/<(?:Link|NavLink)[^>]*\bto=\{?['"`]\/admin/g)) offenders.push(`${rel}: ${m[0].slice(0, 60)}`)
      for (const m of text.matchAll(/navigate\(\s*['"`]\/admin/g)) offenders.push(`${rel}: ${m[0]}`)
    }
  }
  walk(SRC)
  assert.deepEqual(offenders, [], 'use a plain <a href="/admin"> (full page load) instead')
})
