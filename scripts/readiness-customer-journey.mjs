// Optional second phase of the guarded browser runner. Every processor/API
// response is an in-memory fixture. Nothing here purchases, cancels or sends.
import assert from 'node:assert/strict'

export async function runCustomerJourney(ctx) {
  const { state, origin, send, fulfill, evaluate, until, untilFixture, click, fill, screenshot, signedOut, pause, check, createFixtureTransport } = ctx
  const accounts = new Map(), support = new Map(), progress = new Map()
  const closedSupport = createFixtureTransport({ latency: 0 })
  const calls = { checkouts: [], portals: [], profileWrites: [], progressWrites: [], supportCreates: [] }
  const modes = { portal: 'ok', profile: 'ok', progress: 'ok', progressRead: 'ok', support: 'ok', evidence: 'ok', holdMember: null }
  const held = []
  const failures = []
  function member(subject) {
    if (!accounts.has(subject)) accounts.set(subject, {
      plan: subject === 'subject-a' ? 'pro' : 'free', sub_status: subject === 'subject-a' ? 'active' : 'none',
      stripe_customer_id: subject === 'subject-a' ? 'cus_LocalSubjectA' : null,
      current_period_end: '2099-01-01T00:00:00Z', profile_complete: true,
      profile: { first_name: subject === 'subject-a' ? 'Private A profile' : 'Private B profile', gamer_id: subject === 'subject-a' ? 'Local-A-Only' : 'Local-B-Only', platform: 'PC', preferred_server: 'US East', main_role: 'Support' },
      tier_scope: 'all_access', vod_usage: { used: 1, limit: 20, remaining: 19 },
    })
    return accounts.get(subject)
  }
  const supportFor = subject => {
    if (!support.has(subject)) support.set(subject, createFixtureTransport({ scenario: 'empty', latency: 0 }))
    return support.get(subject)
  }
  async function html(requestId, title) {
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html' }], body: Buffer.from('<!doctype html><title>Local processor fixture</title><main id="processor-fixture"><h1>' + title + '</h1><p>Synthetic browser response. No payment, provider session or cancellation occurred.</p></main>').toString('base64') })
  }
  state.journeyIntercept = async ({ requestId, request, url, subject }) => {
    if (['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) { await html(requestId, url.hostname === 'checkout.stripe.com' ? 'Synthetic checkout' : 'Synthetic billing portal'); return true }
    if (url.hostname === 'support-fixture.invalid') {
      assert.ok(subject, 'Support fixture requires a synthetic authenticated subject')
      try {
        const body = JSON.parse(request.postData || '{}')
        if (subject === 'subject-a' && url.pathname === '/cs/me/support/cases/R6-999999' && request.method === 'GET') {
          const closed = await closedSupport.request('GET', '/cs/me/support/cases/R6-000001')
          await fulfill(requestId, { ...closed, caseNumber: 'R6-999999', subject: 'Private A closed case fixture' }); return true
        }
        if (subject === 'subject-a' && url.pathname === '/cs/me/support/cases/R6-999999/messages' && request.method === 'POST') {
          const data = await closedSupport.request('POST', '/cs/me/support/cases/R6-000001/messages', { body })
          held.push({ requestId, data, kind: 'closed-reply', subject }); return true
        }
        const data = await supportFor(subject).request(request.method, url.pathname + url.search, { body })
        if (request.method === 'POST' && url.pathname === '/cs/me/support/cases') {
          calls.supportCreates.push({ subject, body, data })
          if (modes.support === 'lostReceipt') { modes.support = 'ok'; await send('Fetch.failRequest', { requestId, errorReason: 'ConnectionReset' }); return true }
        }
        await fulfill(requestId, data)
      } catch (error) { await fulfill(requestId, error.detail || { error: error.message }, error.status || 503) }
      return true
    }
    if (url.hostname !== 'u0k402df6j.execute-api.us-east-1.amazonaws.com') return false
    assert.ok(subject)
    if (url.pathname.endsWith('/me')) {
      const account = member(subject)
      if (request.method === 'PUT') {
        calls.profileWrites.push({ subject, body: JSON.parse(request.postData) })
        if (modes.profile === 'failure') { await fulfill(requestId, { error: 'Synthetic profile save unavailable' }, 503); return true }
        Object.assign(account.profile, JSON.parse(request.postData))
        await fulfill(requestId, { profile: account.profile }); return true
      }
      if (modes.holdMember === subject) { held.push({ requestId, data: structuredClone(account), kind: 'membership', subject }); return true }
      await fulfill(requestId, account); return true
    }
    if (url.pathname.endsWith('/me/membership-checkout')) {
      const body = JSON.parse(request.postData)
      calls.checkouts.push({ subject, body })
      await fulfill(requestId, { url: 'https://checkout.stripe.com/c/pay/cs_test_LocalFixture' }); return true
    }
    if (url.pathname.endsWith('/me/billing-portal')) {
      calls.portals.push({ subject, body: JSON.parse(request.postData || '{}') })
      if (modes.portal === 'failure') await fulfill(requestId, { error: 'Synthetic billing unavailable' }, 503)
      else if (modes.portal === 'hold') held.push({ requestId, data: { url: 'https://billing.stripe.com/p/session/test_LocalFixture' }, kind: 'portal', subject })
      else await fulfill(requestId, { url: 'https://billing.stripe.com/p/session/test_LocalFixture' })
      return true
    }
    if (url.pathname.endsWith('/me/climb-progress')) {
      if (request.method === 'PUT') {
        const body = JSON.parse(request.postData); calls.progressWrites.push({ subject, body })
        if (modes.progress === 'failure') await fulfill(requestId, { error: 'Synthetic cloud unavailable' }, 503)
        else { progress.set(subject, structuredClone(body.progress)); await fulfill(requestId, { progress: body.progress }) }
      } else if (modes.progressRead === 'failure') await fulfill(requestId, { error: 'Synthetic cloud unavailable' }, 503)
      else await fulfill(requestId, { progress: progress.get(subject) || {} })
      return true
    }
    if (url.pathname.endsWith('/me/coaching-profile')) {
      if (modes.evidence === 'failB' && subject === 'subject-b') { await fulfill(requestId, { error: 'Synthetic history unavailable' }, 503); return true }
      await fulfill(requestId, subject === 'subject-a' ? { totals: { sessions: 1, events: 1, deaths: 0 }, observedRank: 'Diamond I', mechanics: { latest: { drill: 'Private A practice drill', dominant: 'crosshair', date: '2026-10-29T00:00:00Z' } }, progressEvidence: { skills: {}, recent: [] }, trainingSessions: [] } : { totals: { sessions: 0, events: 0, deaths: 0 }, progressEvidence: { skills: {}, recent: [] }, trainingSessions: [] }); return true
    }
    if (url.pathname.endsWith('/me/coaching-history')) {
      if (modes.evidence === 'failB' && subject === 'subject-b') { await fulfill(requestId, { error: 'Synthetic history unavailable' }, 503); return true }
      await fulfill(requestId, { sessions: subject === 'subject-a' ? [{ sessionId: 'Private-A-history', firstTs: '2026-10-29T00:00:00Z', events: 1, maps: ['bank'], deaths: 0 }] : [] }); return true
    }
    return false
  }
  async function load(path) { await send('Page.navigate', { url: origin + path }); await until("!!document.querySelector('#fixture-identity')&&!JSON.parse(document.querySelector('#fixture-identity').textContent).loading", 'fixture app ready') }
  async function release() {
    modes.holdMember = null
    for (const item of held.splice(0)) { try { await fulfill(item.requestId, item.data) } catch { /* navigation may have cancelled this fixture */ } }
  }
  async function asA(path) {
    await release(); modes.portal = modes.profile = modes.progress = modes.progressRead = modes.support = modes.evidence = 'ok'
    Object.assign(member('subject-a'), { plan: 'pro', sub_status: 'active', stripe_customer_id: 'cus_LocalSubjectA', checkout_session_id: null, checkout_payment_status: null })
    await load('/vod')
    await evaluate("document.querySelector('#fixture-switch-a').click()")
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject==='subject-a'", 'account A')
    await load(path)
  }
  async function scenario(name, fn) {
    try { await fn(); check(name) }
    catch (error) { failures.push({ name, error: error.message }); console.error('FAIL ' + name + ': ' + error.message); try { await screenshot('journey-failure-' + failures.length) } catch { /* keep primary result */ } }
    finally { await release() }
  }
  const bodyHas = text => `document.body.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`
  await scenario('rendered profile save failure preserves draft and retry persists the same owner', async () => {
    await asA('/account'); await until("!!document.querySelector('.account-form input')", 'profile form')
    await fill('.account-form input', 'Local changed name'); modes.profile = 'failure'
    await evaluate("document.querySelector('.account-form').requestSubmit()")
    await until(bodyHas('Synthetic profile save unavailable'), 'profile error')
    assert.equal(await evaluate("document.querySelector('.account-form input').value"), 'Local changed name')
    modes.profile = 'ok'; await evaluate("document.querySelector('.account-form').requestSubmit()")
    await until(bodyHas('Profile saved.'), 'profile saved receipt')
    await load('/account'); await until("document.querySelector('.account-form input')?.value==='Local changed name'", 'profile readback')
    assert.ok(calls.profileWrites.filter(call => 'first_name' in call.body).every(call => call.subject === 'subject-a'))
  })
  await scenario('rendered billing failure recovers and paid/past-due accounts open the existing portal', async () => {
    await asA('/account'); await until(bodyHas('Manage billing'), 'billing action')
    modes.portal = 'failure'; await click('Manage billing'); await until(bodyHas('Synthetic billing unavailable'), 'portal error')
    modes.portal = 'ok'; await click('Manage billing'); await until("!!document.querySelector('#processor-fixture')", 'synthetic portal navigation')
    Object.assign(member('subject-a'), { plan: 'free', sub_status: 'past_due' })
    await load('/account'); await until(bodyHas('Update payment method'), 'past-due recovery')
    const count = calls.checkouts.length; await click('Update payment method')
    await until("!!document.querySelector('#processor-fixture')", 'past-due portal')
    assert.equal(calls.checkouts.length, count)
    assert.ok(calls.portals.every(call => call.subject === 'subject-a'))
  })
  await scenario('rendered selected checkout survives signup; return URL alone never grants access; exact paid receipt does', async () => {
    await asA('/pricing'); await signedOut()
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject===null", 'signed out for checkout')
    await evaluate("Array.from(document.querySelectorAll('.pricing-card')).find(c=>c.querySelector('.pricing-tier')?.textContent.trim().toLowerCase()==='pro').querySelector('button').click()")
    await until("!!document.querySelector('input[placeholder=\"First and last name\"]')", 'selected-plan signup')
    assert.equal(await evaluate("new URLSearchParams(location.search).get('redirect')"), '/?checkout=pro')
    member('checkout-owner').plan = 'free'
    await fill('input[placeholder="First and last name"]', 'Checkout Fixture'); await fill('input[type=email]', 'checkout-owner@example.test'); await fill('input[type=password]', 'LocalFixture123!')
    await evaluate("document.querySelector('form').requestSubmit()")
    await until("!!document.querySelector('input[placeholder=\"6-digit code\"]')", 'checkout confirmation')
    await fill('input[placeholder="6-digit code"]', '123456'); await evaluate("document.querySelector('form').requestSubmit()")
    await until("!!document.querySelector('#processor-fixture')", 'synthetic checkout navigation')
    const own = calls.checkouts.filter(call => call.subject === 'checkout-owner')
    assert.equal(own.length, 1); assert.deepEqual(own[0].body, { tier: 'pro' })
    await load('/account?checkout=success&session_id=cs_test_LocalPro')
    await until(bodyHas('Payment is still confirming'), 'unverified return stays pending', 11000)
    assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).plan"), 'free')
    Object.assign(member('checkout-owner'), { plan: 'pro', sub_status: 'active', stripe_customer_id: 'cus_LocalCheckout', checkout_session_id: 'cs_test_LocalPro', checkout_payment_status: 'paid' })
    await load('/account?checkout=success&session_id=cs_test_LocalPro')
    await until(bodyHas('Manage billing'), 'verified paid receipt')
    assert.equal(await evaluate(bodyHas('Payment is still confirming')), false)
    await load('/account?checkout=success&session_id=cs_test_LocalPro')
    await until(bodyHas('Manage billing'), 'repeat return remains usable')
    assert.equal(calls.checkouts.filter(call => call.subject === 'checkout-owner').length, 1)
  })
  await scenario('scheduled cancellation does not claim renewal; ended membership keeps billing receipts reachable', async () => {
    await asA('/account'); await until(bodyHas('Current period ends'), 'neutral paid-period label')
    assert.equal(await evaluate(bodyHas('Renews')), false)
    Object.assign(member('subject-a'), { plan: 'free', sub_status: 'canceled', current_period_end: '2026-10-01T00:00:00Z' })
    await load('/account'); await until("!!document.querySelector('.account-badge-canceled')", 'ended membership')
    assert.equal(await evaluate("JSON.parse(document.querySelector('#fixture-identity').textContent).plan"), 'free')
    await click('Manage billing'); await until("!!document.querySelector('#processor-fixture')", 'former paid account billing receipts')
  })
  await scenario('rendered progress cloud save/readback and offline local fallback stay account scoped', async () => {
    await asA('/progress'); await until("!!document.querySelector('.progress-tabs')", 'progress page')
    await evaluate("Array.from(document.querySelectorAll('.progress-tabs button')).find(b=>/Skill map/i.test(b.textContent)).click()")
    await until("!!document.querySelector('.progress-tier-buttons button')", 'rank roadmap')
    await evaluate("Array.from(document.querySelectorAll('.progress-tier-buttons button')).find(b=>/Copper/.test(b.textContent)).click()")
    await untilFixture(() => progress.get('subject-a')?.selectedTierId === 'copper', 'cloud progress write')
    await load('/progress'); await until("!!document.querySelector('.progress-tabs')", 'progress readback ready')
    await evaluate("Array.from(document.querySelectorAll('.progress-tabs button')).find(b=>/Skill map/i.test(b.textContent)).click()")
    await until("document.querySelector('.progress-rank-mode strong')?.textContent.startsWith('Copper')", 'progress readback')
    modes.progress = 'failure'
    await evaluate("Array.from(document.querySelectorAll('.progress-tabs button')).find(b=>/Skill map/i.test(b.textContent)).click()")
    await until("!!document.querySelector('.progress-tier-buttons button')", 'offline roadmap')
    await evaluate("Array.from(document.querySelectorAll('.progress-tier-buttons button')).find(b=>/Bronze/.test(b.textContent)).click()")
    await until(bodyHas('Saved on this device'), 'device save status')
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('recon6-road-to-champion-v2:subject-a')).selectedTierId"), 'bronze')
    assert.ok(calls.progressWrites.every(call => call.subject === 'subject-a'))
    modes.progressRead = 'failure'; await load('/progress'); await until("!!document.querySelector('.progress-tabs')", 'offline device roadmap ready')
    await evaluate("Array.from(document.querySelectorAll('.progress-tabs button')).find(b=>/Skill map/i.test(b.textContent)).click()")
    await until("document.querySelector('.progress-rank-mode strong')?.textContent.startsWith('Bronze')", 'offline device readback')
  })
  await scenario('account switch immediately hides the previous account profile and blocks its late portal redirect', async () => {
    await asA('/account'); await until("!!document.querySelector('.account-form input')", 'account form')
    modes.portal = 'hold'; await click('Manage billing'); await untilFixture(() => held.some(item => item.kind === 'portal'), 'held portal')
    modes.holdMember = 'subject-b'; await evaluate("document.querySelector('#fixture-switch-b').click()")
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject==='subject-b'", 'switched B')
    assert.equal(await evaluate("Array.from(document.querySelectorAll('.account-form input')).some(i=>/Local-A-Only|Local changed name|Private A profile/.test(i.value))"), false)
    await release(); await pause(250)
    assert.equal(await evaluate("!!document.querySelector('#processor-fixture')"), false)
    assert.equal(await evaluate('location.pathname'), '/account')
  })
  await scenario('account switch removes old coaching history/evidence even while new account requests settle', async () => {
    await asA('/progress'); await until("!!document.querySelector('.progress-tabs')", 'progress ready')
    modes.evidence = 'failB'
    await evaluate("document.querySelector('#fixture-switch-b').click()")
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject==='subject-b'", 'progress switched B')
    await pause(250)
    assert.equal(await evaluate(bodyHas('Private A practice drill')), false)
    assert.equal(await evaluate(bodyHas('Private-A-history')), false)
    assert.equal(await evaluate("document.querySelector('.progress-scoreboard')?.innerText.includes('Diamond I')"), false)
  })
  let caseNumber
  await scenario('Support lost create receipt retries once with the same request ID; timeline and reply persist', async () => {
    await asA('/support'); await until("!!document.querySelector('textarea')", 'Support composer')
    await evaluate("(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Private A fixture access question after checkout');e.dispatchEvent(new Event('input',{bubbles:true}));})()")
    modes.support = 'lostReceipt'
    await evaluate("document.querySelector('textarea').closest('form').requestSubmit()")
    await until(bodyHas("Couldn't reach Recon"), 'Support lost receipt error')
    assert.equal(await evaluate("document.querySelector('textarea').value"), 'Private A fixture access question after checkout')
    await evaluate("document.querySelector('textarea').closest('form').requestSubmit()")
    await untilFixture(() => calls.supportCreates.length >= 2, 'Support replay receipt')
    assert.equal(calls.supportCreates[0].body.clientRequestId, calls.supportCreates[1].body.clientRequestId)
    assert.equal(calls.supportCreates[1].data.replayed, true)
    caseNumber = calls.supportCreates[1].data.case.caseNumber
    await until(bodyHas(caseNumber), 'Support case receipt')
    await load('/support/cases/' + caseNumber); await until(bodyHas('Private A fixture access question'), 'Support own timeline')
    await evaluate("(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Local fixture follow-up reply');e.dispatchEvent(new Event('input',{bubbles:true}));})()")
    await evaluate("document.querySelector('textarea').closest('form').requestSubmit()")
    await until(bodyHas('Local fixture follow-up reply'), 'persisted Support reply')
    await load('/support/cases/' + caseNumber); await until(bodyHas('Local fixture follow-up reply'), 'Support reply readback')
  })
  await scenario('Support account switch cannot retain another customer case, draft or timeline', async () => {
    assert.ok(caseNumber, 'prior synthetic Support case must exist')
    await asA('/support/cases/' + caseNumber); await until(bodyHas('Private A fixture access question'), 'A case loaded')
    await evaluate("document.querySelector('#fixture-switch-b').click()")
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject==='subject-b'", 'Support switched B')
    await pause(250)
    assert.equal(await evaluate(bodyHas('Private A fixture access question')), false)
    assert.equal(await evaluate(bodyHas('Local fixture follow-up reply')), false)
    await until(bodyHas('No case ' + caseNumber + ' on your account'), 'other-owner case denied')
  })
  await scenario('late closed-case reply cannot navigate the next account to the former owner follow-up', async () => {
    await asA('/support/cases/R6-999999'); await until(bodyHas('Private A closed case fixture'), 'closed case A')
    await evaluate("(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Local closed-case follow-up fixture');e.dispatchEvent(new Event('input',{bubbles:true}));})()")
    await evaluate("document.querySelector('textarea').closest('form').requestSubmit()")
    await untilFixture(() => held.some(item => item.kind === 'closed-reply'), 'held closed-case follow-up')
    assert.ok(held.find(item => item.kind === 'closed-reply').data.linkedCaseNumber)
    await evaluate("document.querySelector('#fixture-switch-b').click()")
    await until("JSON.parse(document.querySelector('#fixture-identity').textContent).subject==='subject-b'", 'closed-case switched B')
    await release(); await pause(250)
    assert.equal(await evaluate('location.pathname'), '/support/cases/R6-999999')
    assert.equal(await evaluate("JSON.stringify(history.state).includes('followUpOf')"), false)
    await until(bodyHas('No case R6-999999 on your account'), 'new owner remains denied old case')
  })
  state.customerJourneyEvidence = { fixtureProcessorOnly: true, cases: 10, failures, checkoutRequests: calls.checkouts.length, portalRequests: calls.portals.length, profileWrites: calls.profileWrites.length, progressWrites: calls.progressWrites.length, supportCreateRequests: calls.supportCreates.length }
  assert.deepEqual(failures, [], 'rendered customer journey failures')
}
