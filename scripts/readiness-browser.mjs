// Explicit opt-in browser acceptance, using an existing Chrome installation.
// No browser download, personal profile, security override or provider access.
import './test-netguard.mjs'
import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'

const root = resolve(import.meta.dirname, '..')
const evidence = resolve(process.env.RECON_READINESS_EVIDENCE || join(root, '..', 'review', 'recon29-browser-acceptance'))
await mkdir(evidence, { recursive: true })
const profile = join(evidence, 'profile-' + Date.now())
const report = { checkedAtUtc: new Date().toISOString(), fixturesOnly: true, normalSandbox: true, paidCalls: 0, captureOrMicrophone: false, checks: [], unknownAppRequests: [], browserErrors: [], providerRequestsIntercepted: 0, proxyDenied: 0 }
const proxy = http.createServer((_req, res) => { report.proxyDenied++; res.writeHead(403); res.end() })
proxy.on('connect', (_req, socket) => { socket.on('error', () => {}); report.proxyDenied++; socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n') })
proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening')
const vite = await createServer({ root, cacheDir: join(evidence, 'vite-cache'), server: { host: '127.0.0.1', port: 0, hmr: false }, clearScreen: false, logLevel: 'error' })
await vite.listen()
const origin = 'http://127.0.0.1:' + vite.httpServer.address().port
// Middleware maps fixture navigation to its own entry, never production HTML
// with analytics scripts. Source modules remain the actual production modules.
vite.middlewares.stack.unshift({ route: '', handle: (req, _res, next) => {
  if (req.url.startsWith('/auth') || req.url.startsWith('/vod')) req.url = '/scripts/readiness-fixture/index.html'
  next()
} })
const chrome = spawn(process.env.RECON_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-component-update', '--disable-sync',
  '--proxy-server=http://127.0.0.1:' + proxy.address().port,
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1', 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let ws, session, sequence = 0
const pending = new Map(), tasks = new Set(), stderr = []
function send(method, params = {}, sessionId = session) {
  return new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)) }, 15000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const state = { sync: 'unprocessed', model: 'ok', models: 0, writes: [], events: new Map(), heldModels: [], heldWrites: [], membership: 'ok', heldMembership: [], plan: 'pro' }
function fixtureToken(subject, tokenUse = 'id') {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return encode({ alg: 'RS256', kid: 'local-decoding-only' }) + '.' + encode({ sub: subject, email: subject + '@example.test', email_verified: true, token_use: tokenUse, aud: 'fixture', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }) + '.local-fixture-not-a-provider-token'
}
function subjectOf(headers) {
  const auth = Object.entries(headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1] || ''
  try { return JSON.parse(Buffer.from(auth.split('.')[1], 'base64url')).sub } catch { return null }
}
async function fulfill(id, body, status = 200) {
  return send('Fetch.fulfillRequest', { requestId: id, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }], body: Buffer.from(JSON.stringify(body)).toString('base64') })
}
function result(subject) {
  return { session: { headline: 'Synthetic doorway observation for ' + subject, image_count: 1 }, per_image: [], patterns: {}, practice_plan: { this_week: ['Check the doorway in a private custom game.'] }, usage: { used: 1, limit: 20, remaining: 19, period_end: '2099-01-01T00:00:00Z' } }
}
async function intercept({ requestId, request }) {
  const url = new URL(request.url)
  if (url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:') return send('Fetch.continueRequest', { requestId })
  if (request.method === 'OPTIONS') return fulfill(requestId, {})
  report.providerRequestsIntercepted++
  if (url.hostname === 'cognito-idp.us-east-1.amazonaws.com') {
    const operation = Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'x-amz-target')?.[1]?.split('.').pop()
    const data = JSON.parse(request.postData || '{}')
    if (operation === 'InitiateAuth') {
      return fulfill(requestId, { ChallengeName: 'PASSWORD_VERIFIER', Session: 'local-challenge', ChallengeParameters: { USER_ID_FOR_SRP: data.AuthParameters.USERNAME, SRP_B: '2', SALT: '01', SECRET_BLOCK: Buffer.from('local-only').toString('base64') } })
    }
    if (operation === 'RespondToAuthChallenge') {
      const subject = data.ChallengeResponses.USERNAME.split('@')[0]
      return fulfill(requestId, { AuthenticationResult: { IdToken: fixtureToken(subject), AccessToken: fixtureToken(subject, 'access'), RefreshToken: 'local-refresh-fixture', ExpiresIn: 3600, TokenType: 'Bearer' } })
    }
    if (operation === 'SignUp') return fulfill(requestId, { UserConfirmed: false, UserSub: 'local-signup', CodeDeliveryDetails: { Destination: 'f***@example.test', DeliveryMedium: 'EMAIL', AttributeName: 'email' } })
    if (operation === 'ConfirmSignUp') return fulfill(requestId, {})
    if (operation === 'ForgotPassword') return fulfill(requestId, { CodeDeliveryDetails: { Destination: 'f***@example.test', DeliveryMedium: 'EMAIL', AttributeName: 'email' } })
    if (operation === 'ConfirmForgotPassword') return fulfill(requestId, {})
  }
  if (url.hostname === 'u0k402df6j.execute-api.us-east-1.amazonaws.com') {
    const subject = subjectOf(request.headers)
    assert.ok(subject, 'every API fixture request requires an identity')
    if (url.pathname.endsWith('/me')) {
      if (request.method === 'PUT') return fulfill(requestId, { ok: true })
      const data = { plan: state.plan, sub_status: 'active', profile_complete: true, profile: { display_name: subject }, tier_scope: 'all_access', vod_usage: { used: 0, limit: 20, remaining: 20 } }
      if (state.membership === 'hold') { state.heldMembership.push({ requestId, data }); return }
      return fulfill(requestId, data)
    }
    if (url.pathname.endsWith('/vod/analyze')) {
      state.models++
      if (state.model === 'hold') { state.heldModels.push({ requestId, subject }); return }
      if (state.model === 'failure') return fulfill(requestId, { error: 'analysis_timeout', message: 'Synthetic processing timeout; attempt consumed.', allowance_consumed: true, usage: { used: 1, limit: 20, remaining: 19 } }, 504)
      if (state.model === 'limit') return fulfill(requestId, { error: 'usage_limit_exceeded', used: 20, limit: 20, is_trial: false, period_end: '2099-01-01T00:00:00Z', usage: { used: 20, limit: 20, remaining: 0 } }, 429)
      return fulfill(requestId, result(subject))
    }
    if (url.pathname.endsWith('/me/coaching-events')) {
      const event = JSON.parse(request.postData).events[0]
      state.writes.push({ subject, event })
      if (state.sync === 'hang' || state.sync === 'hold') { state.heldWrites.push({ requestId, subject, event }); return }
      if (state.sync === 'unprocessed') return fulfill(requestId, { written: 0, received: 1 })
      state.events.set(subject + '#' + event.sessionId + '#' + event.ts, event)
      return fulfill(requestId, { written: 1, received: 1 })
    }
  }
  report.unknownAppRequests.push(url.origin + url.pathname)
  return send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' })
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw Error(response.exceptionDetails.text + ': ' + JSON.stringify(response.exceptionDetails.exception))
  return response.result.value
}
async function until(expression, label, timeout = 12000) {
  const end = Date.now() + timeout
  while (Date.now() < end) { if (await evaluate(expression)) return; await pause(100) }
  throw Error('UI timeout: ' + label + '\n' + await evaluate('document.body.innerText'))
}
async function click(text) {
  await until(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`, text)
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled).click()`)
}
async function screenshot(name) {
  await evaluate("document.querySelector('.vod-roadmap-sync')?.scrollIntoView({block:'start'})")
  const image = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(evidence, name + '.png'), Buffer.from(image.data, 'base64'))
}
async function fill(selector, value) {
  await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`)
}
async function untilFixture(predicate, label) {
  const end = Date.now() + 10000
  while (Date.now() < end) { if (predicate()) return; await pause(50) }
  throw Error('Fixture timeout: ' + label)
}
async function signIn(subject, waitForHydration = true) {
  await evaluate("document.querySelector('#fixture-login').click()")
  await until("!!document.querySelector('input[type=email]')", 'sign-in form')
  await evaluate(`for(const [selector,value] of [['input[type=email]',${JSON.stringify(subject + '@example.test')}],['input[type=password]','LocalFixture123!']]){const input=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}`)
  await evaluate("document.querySelector('form').requestSubmit()")
  if (!waitForHydration) return
  await until(`JSON.parse(document.querySelector('#fixture-identity').textContent).subject===${JSON.stringify(subject)}&&!JSON.parse(document.querySelector('#fixture-identity').textContent).loading`, 'signed in ' + subject)
  await until("!!document.querySelector('input[type=file]')", 'paid upload')
}
async function upload() {
  await until("!!document.querySelector('input[type=file]')", 'upload input')
  await evaluate("(()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));const files=new DataTransfer();files.items.add(new File([bytes],'synthetic.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()")
  await click('Review this round')
}
async function signedOut() { await evaluate("document.querySelector('#fixture-logout').click()"); await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject===null", 'signed out') }
const check = name => { report.checks.push(name); console.log('PASS ' + name) }
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('isolated Chrome startup timeout')), 15000)
    chrome.once('error', reject); chrome.once('exit', code => { clearTimeout(timer); reject(Error('Chrome startup exit ' + code)) })
    chrome.stderr.on('data', bytes => { stderr.push(bytes.toString()); const match = stderr.join('').match(/DevTools listening on (ws:\/\/127\.0\.0\.1:[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]) } })
  })
  ws = new WebSocket(endpoint); await once(ws, 'open')
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) { const entry = pending.get(message.id); if (!entry) return; pending.delete(message.id); clearTimeout(entry.timer); if (message.error) entry.reject(Error(JSON.stringify(message.error))); else entry.resolve(message.result); return }
    if (message.method === 'Fetch.requestPaused') {
      const task = intercept(message.params).catch(error => { report.browserErrors.push(error.message) }).finally(() => tasks.delete(task)); tasks.add(task)
    }
    if (message.method === 'Runtime.exceptionThrown') report.browserErrors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''))
  })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null)
  session = (await send('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }) // before app imports
  await send('Runtime.enable'); await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: origin + '/auth?redirect=/vod' })
  await until("!!document.querySelector('input[type=email]')", 'actual auth page')
  state.plan = 'free'
  await click('Sign Up')
  await fill('input[placeholder="First and last name"]', 'Local Fixture')
  await fill('input[type=email]', 'fixture-new@example.test')
  await fill('input[type=password]', 'LocalFixture123!')
  await evaluate("document.querySelector('form').requestSubmit()")
  await until("!!document.querySelector('input[placeholder=\"6-digit code\"]')", 'signup confirmation')
  await fill('input[placeholder="6-digit code"]', '123456')
  await evaluate("document.querySelector('form').requestSubmit()")
  await until("document.body.innerText.includes('Upgrade to Pro to review your gameplay')", 'new free account gate')
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).subject"), 'fixture-new')
  assert.equal(await evaluate("!!document.querySelector('input[type=file]')"), false)
  check('actual signup + confirmation + auto sign-in keeps unpaid account gated')
  await signedOut(); await evaluate("document.querySelector('#fixture-login').click()")
  await click('Forgot password?'); await fill('input[type=email]', 'fixture-new@example.test')
  await evaluate("document.querySelector('form').requestSubmit()")
  await until("!!document.querySelector('input[placeholder=\"6-digit code\"]')", 'reset code')
  await fill('input[placeholder="6-digit code"]', '123456'); await fill('input[type=password]', 'ReplacementFixture123!')
  await evaluate("document.querySelector('form').requestSubmit()")
  await until("document.body.innerText.includes('Upgrade to Pro to review your gameplay')", 'reset sign-in')
  check('actual password-reset UI returns to signed-in free account without upgrading entitlement')
  await signedOut(); state.plan = 'pro'
  await signIn('subject-a'); check('actual AuthPage + Cognito SDK sign-in + paid entitlement')
  await send('Page.reload')
  await until("!!document.querySelector('input[type=file]')", 'cached session reload')
  check('cached sign-in survives reload without new external account')
  await upload(); await until("!!document.querySelector('.vod-roadmap-sync.is-pending')", 'zero-write pending')
  assert.equal(state.models, 1); await screenshot('pending-review')
  await click('Retry saving review'); await until("!!document.querySelector('.vod-roadmap-sync [role=alert]')", 'retry failure feedback')
  assert.equal(state.models, 1); state.sync = 'ok'
  await click('Retry saving review'); await until("!!document.querySelector('.vod-roadmap-sync.is-saved')", 'saved receipt')
  assert.equal(state.models, 1); assert.equal(state.events.size, 1)
  assert.deepEqual(state.writes[0].event, state.writes.at(-1).event)
  await screenshot('saved-review'); check('zero-write receipt stays pending; evidence-only retry saves stable event without another model request')
  await click('Analyze another session'); state.sync = 'hang'
  await upload(); await until("!!document.querySelector('.vod-roadmap-sync.is-pending')", 'five-second evidence deadline', 9000)
  assert.equal(state.models, 2); state.sync = 'ok'; await click('Retry saving review')
  await until("!!document.querySelector('.vod-roadmap-sync.is-saved')", 'hung-save retry')
  assert.equal(state.models, 2); check('hanging evidence request releases UI after deadline and retry does not re-analyze')
  await click('Analyze another session'); state.model = 'failure'
  await upload(); await until("document.body.innerText.includes('Synthetic processing timeout')", 'processing failure')
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).remaining"), 19)
  await click('Try Again'); state.model = 'limit'; await upload()
  await until("document.body.innerText.includes('Monthly VOD allowance reached')", 'quota feedback')
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).remaining"), 0)
  check('processing failure and quota rejection display current allowance and recoverable actions')
  await click('Dismiss'); state.model = 'hold'; const beforeLateWrites = state.writes.length
  await upload(); await untilFixture(() => state.heldModels.length, 'held model response')
  await signedOut(); await signIn('subject-b')
  for (const held of state.heldModels.splice(0)) await fulfill(held.requestId, result(held.subject))
  await pause(350)
  assert.equal(await evaluate("document.body.innerText.includes('Synthetic doorway observation for subject-a')"), false)
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).remaining"), 20)
  assert.equal(state.writes.length, beforeLateWrites, 'logout must not start a new evidence write for a late analysis')
  check('late account-A analysis cannot save, show feedback or change account-B allowance')
  state.model = 'ok'; state.sync = 'unprocessed'; await upload()
  await until("!!document.querySelector('.vod-roadmap-sync.is-pending')", 'account B pending')
  state.sync = 'hold'; await click('Retry saving review')
  await untilFixture(() => state.heldWrites.some(item => item.subject === 'subject-b'), 'held retry response')
  await signedOut(); await signIn('subject-c')
  for (const held of state.heldWrites.splice(0)) { try { await fulfill(held.requestId, { written: 1, received: 1 }) } catch { /* an aborted deadline request was already detached */ } }
  await pause(250)
  assert.equal(await evaluate("!!document.querySelector('.vod-roadmap-sync')"), false)
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).remaining"), 20)
  assert.ok(state.writes.every(({ subject, event }) => !event.userId || event.userId === subject))
  check('late retry completion after account switch cannot restore prior review or allowance')
  await signedOut(); state.membership = 'hold'
  await signIn('subject-a', false)
  await untilFixture(() => state.heldMembership.length, 'held account-A membership response')
  await signedOut(); state.membership = 'ok'; state.plan = 'free'
  await signIn('subject-d', false)
  await until("document.body.innerText.includes('Upgrade to Pro to review your gameplay')", 'account D free gate')
  for (const held of state.heldMembership.splice(0)) await fulfill(held.requestId, held.data)
  await pause(250)
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).subject"), 'subject-d')
  assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).plan"), 'free')
  assert.equal(await evaluate("!!document.querySelector('input[type=file]')"), false)
  check('late paid-membership response cannot upgrade the next signed-in free account')
  assert.deepEqual(report.unknownAppRequests, []); assert.deepEqual(report.browserErrors, [])
  assert.ok(process.env.NETGUARD_LOG, 'supply a fresh per-run NETGUARD_LOG with the preloaded guard')
  const guard = await readFile(process.env.NETGUARD_LOG, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error })
  const records = guard.split(/\r?\n/).filter(Boolean).map(line => line.split('\t'))
  // Vite probes wildcard bind addresses locally; those are not remote DNS.
  // Never allow a blocked TCP attempt or a lookup for an external hostname.
  const wildcard = new Set(['0.0.0.0', '::', '0000:0000:0000:0000:0000:0000:0000:0000'])
  const unexpected = records.filter(([, kind, host]) => kind !== 'dns' || !wildcard.has(host))
  report.nodeNetworkGuard = { blockedTcpAttempts: records.filter(([, kind]) => kind === 'blocked').length, localWildcardAddressProbes: records.length - unexpected.length, unexpectedRecords: unexpected.length }
  assert.deepEqual(unexpected, [], 'Node provider/SDK calls must stay offline')
  report.status = 'passed'; report.syntheticModelRequests = state.models; report.syntheticEvidenceWrites = state.writes.length
} catch (error) {
  report.status = 'failed'; report.failure = error.stack
  if (ws && session) { try { report.visibleText = await evaluate('document.body.innerText'); await screenshot('failure') } catch { /* retain primary error */ } }
  console.error(error); process.exitCode = 1
} finally {
  report.finishedAtUtc = new Date().toISOString()
  await writeFile(join(evidence, 'report.json'), JSON.stringify(report, null, 2))
  if (ws) { try { await send('Browser.close', {}, null) } catch { /* owned process fallback below */ } ws.close() }
  if (chrome.exitCode === null) { await Promise.race([once(chrome, 'exit'), pause(2000)]); if (chrome.exitCode === null) chrome.kill() }
  await Promise.allSettled([...tasks]); await vite.close(); proxy.close()
}
