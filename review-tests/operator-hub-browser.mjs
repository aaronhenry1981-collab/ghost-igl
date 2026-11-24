// Local Chromium smoke; uses the actual built shell and Cognito client with a
// synthetic cached identity. No real session, AWS, analytics, or outside
// request is allowed. Requires Playwright and a local Chromium installation.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HUB_FIXTURE as corpus } from './operator-hub-fixture.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = /^\/operator-hub(?:\/[a-z0-9-]+)?$/.test(url.pathname) ? '_shell/operator-hub.html'
    : url.pathname === '/' ? 'index.html'
    : ['/auth', '/dashboard', '/operators'].includes(url.pathname) ? `_shell${url.pathname}.html`
    : url.pathname.replace(/^\/+/, '')
  const file = resolve(root, 'dist', path)
  if (!file.startsWith(join(root, 'dist') + '/')) { res.writeHead(404).end(); return }
  try { res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(readFileSync(file)) }
  catch { res.writeHead(404).end('Not found') }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'],
})
const idPrefix = 'CognitoIdentityServiceProvider.5bpa1cteenctoue24v4e245re8'
const apiOrigin = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com'
const firstOnly = corpus.operators.find(op => op.slug === 'fictional-citrine').when

async function fixture({ member = false, mobile = false, hubStatus = 200 } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, isMobile: mobile, hasTouch: mobile,
  })
  let reads = 0, triedAnalytics = 0
  await context.route('**/*', async route => {
    const req = route.request()
    const u = new URL(req.url())
    if (u.origin === origin) return route.continue()
    if (/plausible\.io|heycatch\.ai/i.test(u.hostname)) triedAnalytics++
    if (u.origin === apiOrigin && ['/prod/content/operator-hub', '/prod/me'].includes(u.pathname)) {
      if (req.method() === 'GET') {
        assert.match(req.headers().authorization || '', /^Bearer ey/)
        if (u.pathname.endsWith('/content/operator-hub')) reads++
      }
      const isHub = u.pathname.endsWith('/content/operator-hub')
      return route.fulfill({ status: req.method() === 'OPTIONS' ? 204 : isHub ? hubStatus : 200, headers: {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization', 'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json',
      }, body: req.method() === 'OPTIONS' ? '' : JSON.stringify(isHub && hubStatus === 200 ? corpus : isHub ? {}
        : { plan: 'free', profile_complete: true, profile: { name: 'Local Test' } }),
      })
    }
    return route.abort()
  })
  if (member) await context.addInitScript((prefix) => {
    if (location.origin.startsWith('http://127.0.0.1:') && !localStorage.getItem('local-synthetic-seeded')) {
      const email = 'operator-hub-fixture@example.test'
      const payload = { sub: 'local-synthetic-subject', email, email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000) - 10 }
      function b64(value) { return btoa(JSON.stringify(value)).replaceAll('=', '') }
      const jwt = `${b64({ alg: 'RS256' })}.${b64(payload)}.syntheticonly`
      localStorage.setItem('local-synthetic-seeded', '1')
      localStorage.setItem(`${prefix}.LastAuthUser`, email)
      localStorage.setItem(`${prefix}.${email}.idToken`, jwt)
      localStorage.setItem(`${prefix}.${email}.accessToken`, jwt)
      localStorage.setItem(`${prefix}.${email}.clockDrift`, '0')
    }
  }, idPrefix)
  const page = await context.newPage()
  return { context, page, reads: () => reads, triedAnalytics: () => triedAnalytics }
}
try {
  const guest = await fixture()
  await guest.page.goto(`${origin}/operator-hub/fictional-citrine?unexpected=discard`)
  await guest.page.getByRole('heading', { name: 'Sign in to open the hub' }).waitFor()
  assert.equal(guest.reads(), 0)
  assert.equal(guest.triedAnalytics(), 0)
  assert.doesNotMatch(await guest.page.content(), new RegExp(firstOnly.split(' ').slice(0, 5).join(' ')))
  assert.equal(new URL(await guest.page.getByRole('link', { name: 'Sign in', exact: true }).last().getAttribute('href'), origin).searchParams.get('redirect'), '/operator-hub/fictional-citrine')
  assert.match(await guest.page.locator('meta[name=robots]').getAttribute('content'), /noindex/)
  await guest.context.close()

  const desk = await fixture({ member: true })
  await desk.page.goto(`${origin}/operator-hub`)
  const roster = desk.page.getByRole('heading', { name: 'Operator roster' })
  await roster.waitFor()
  assert.equal(await desk.page.locator('.oh-roster-card').count(), 2)
  assert.equal(await desk.page.getByRole('button', { name: 'Defense 1' }).getAttribute('aria-pressed'), 'false')
  await desk.page.getByRole('button', { name: 'Defense 1' }).click()
  assert.equal(await desk.page.locator('.oh-roster-card').count(), 1)
  await desk.page.getByRole('searchbox', { name: 'Search operators' }).fill('bjorn')
  assert.equal(await desk.page.locator('.oh-roster-card').count(), 1)
  const detail = desk.page.getByRole('link', { name: /Fixture Bjørn/ })
  await detail.focus()
  await desk.page.keyboard.press('Enter')
  await desk.page.getByRole('heading', { name: 'Fixture Bjørn' }).waitFor()
  assert.equal(await desk.page.evaluate(() => document.activeElement.textContent), 'Fixture Bjørn')
  assert.equal(desk.reads(), 1)
  assert.equal(desk.triedAnalytics(), 0)
  await desk.page.getByRole('link', { name: 'All operators' }).click()
  assert.equal(await desk.page.getByRole('searchbox').inputValue(), 'bjorn')
  await desk.page.getByRole('searchbox').fill('notanoperator')
  await desk.page.getByRole('heading', { name: 'No operators match' }).waitFor()
  await desk.page.getByRole('button', { name: 'Clear filters' }).click()
  assert.equal(await desk.page.locator('.oh-roster-card').count(), 2)
  await desk.page.goto(`${origin}/operator-hub/fictional-citrine`)
  await desk.page.getByRole('heading', { name: 'Fictional Citrine' }).waitFor()
  await desk.page.getByText('Fixture primary', { exact: true }).waitFor()
  await desk.page.getByRole('heading', { name: 'Recommended maps & sites' }).waitFor()
  await desk.page.getByRole('button', { name: 'Tools' }).click()
  assert.equal(await desk.page.getByRole('link', { name: /Operator Hub/ }).count(), 1)
  await desk.page.keyboard.press('Escape')
  const authSessionIsPresent = await desk.page.evaluate((prefix) => Boolean(localStorage.getItem(`${prefix}.LastAuthUser`)), idPrefix)
  assert.ok(authSessionIsPresent)
  // Simulate the shared Cognito key disappearing from another tab. It
  // bypasses any pre-existing nav or billing behavior.
  const other = await desk.context.newPage()
  await other.goto(`${origin}/operator-hub/fictional-citrine`)
  await other.getByRole('heading', { name: 'Fictional Citrine' }).waitFor()
  await other.evaluate((prefix) => { localStorage.removeItem(`${prefix}.LastAuthUser`) }, idPrefix)
  await desk.page.getByRole('heading', { name: 'Sign in to open the hub' }).waitFor()
  assert.equal(await desk.page.getByText(firstOnly, { exact: true }).count(), 0)
  assert.equal(await desk.page.evaluate(() => JSON.stringify(localStorage).includes('Recommended maps')), false)
  await desk.context.close()

  const mobile = await fixture({ member: true, mobile: true })
  await mobile.page.goto(`${origin}/operator-hub/fixture-bjorn`)
  await mobile.page.getByRole('heading', { name: 'Fixture Bjørn' }).waitFor()
  const sites = mobile.page.locator('.oh-sites')
  await sites.getByRole('heading', { name: 'Recommended maps & sites' }).waitFor()
  await sites.getByText(/Consider this fictional role/).waitFor()
  await mobile.page.getByText(/secondary utility that supports Fixture Bjørn’s fixture watcher role/).waitFor()
  assert.equal(await sites.locator('.oh-site-list a').count(), 0)
  assert.equal(await mobile.page.getByText(/not yet verified|doesn’t have a reviewed recommendation|not enough verified/i).count(), 0)
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth === innerWidth), true)
  await mobile.page.getByRole('link', { name: 'All operators' }).click()
  await mobile.page.getByRole('heading', { name: 'Operator roster' }).waitFor()
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth === innerWidth), true)
  assert.equal(mobile.triedAnalytics(), 0)
  await mobile.context.close()

  const down = await fixture({ member: true, hubStatus: 503 })
  await down.page.goto(`${origin}/operator-hub/fictional-citrine`)
  await down.page.getByRole('heading', { name: 'Couldn’t load the Operator Hub' }).waitFor()
  await down.page.getByRole('button', { name: 'Try again' }).click()
  await down.page.getByRole('heading', { name: 'Couldn’t load the Operator Hub' }).waitFor()
  assert.equal(down.reads(), 2)
  await down.context.close()

  console.log('Chromium smoke passed: guest, authenticated desktop/mobile, direct links, filters and keyboard, access loss across tabs, unavailable retry; all nonfixture external traffic blocked.')
} finally {
  await browser.close()
  server.close()
}
