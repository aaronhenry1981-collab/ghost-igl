import test from 'node:test'
import assert from 'node:assert/strict'
import { fixtureApp } from '../fixtures/app.mjs'
import { routeModules } from './index.mjs'
const parse = r => JSON.parse(r.body)
async function setup(sender=null) {
  const app=fixtureApp({extraRoutes:routeModules,loginHelpEmail:sender})
  const q=parse(await app.call('GET','/cs/admin/queue',{token:'tok-admin'}))
  const item=q.items.find(i=>i.type==='account_setup_incomplete')
  const path=`/cs/admin/support/login-help/${item.player.key}`
  return {...app,path}
}
const admin={token:'tok-admin'}
test('login help preview is admin-only, exact and disabled without a sender',async()=>{
  const {call,path}=await setup()
  assert.equal((await call('GET',path)).statusCode,401)
  assert.equal((await call('GET',path,{token:'tok-paying_active'})).statusCode,403)
  const p=parse(await call('GET',path,admin))
  assert.equal(p.available,false);assert.ok(p.recipient.endsWith('@example.test'))
  assert.match(p.body,/does not reset your password/)
  assert.equal((await call('POST',path,{...admin,body:p})).statusCode,503)
})
test('concurrent sends yield one provider call and a durable accepted receipt; issue stays open',async()=>{
  let sent=0
  const {call,path}=await setup(async()=>{sent++;return {messageId:'test-receipt'}})
  const p=parse(await call('GET',path,admin))
  const results=await Promise.all([call('POST',path,{...admin,body:p}),call('POST',path,{...admin,body:p})])
  assert.ok(results.every(r=>r.statusCode===200));assert.equal(sent,1)
  const after=parse(await call('GET',path,admin));assert.equal(after.receipt.status,'accepted');assert.equal(after.receipt.providerMessageId,'test-receipt')
  const q=parse(await call('GET','/cs/admin/queue',admin));assert.ok(q.items.some(i=>i.type==='account_setup_incomplete'))
})
test('changed preview and unknown outcomes fail closed without resend',async()=>{
  let sent=0
  const {call,path}=await setup(async()=>{sent++;throw new Error('timeout')})
  const p=parse(await call('GET',path,admin))
  assert.equal((await call('POST',path,{...admin,body:{...p,recipient:'other@example.test'}})).statusCode,409)
  const result=parse(await call('POST',path,{...admin,body:p}));assert.equal(result.receipt.status,'unknown')
  await call('POST',path,{...admin,body:p});assert.equal(sent,1)
})
test('account resolution after preview prevents sending from a stale queue',async()=>{
  let sent=0
  const {call,path,world}=await setup(async()=>{sent++;return {messageId:'test'}})
  const p=parse(await call('GET',path,admin))
  world.cognitoUsers.find(u=>u.email===p.recipient).status='CONFIRMED'
  assert.equal((await call('POST',path,{...admin,body:p})).statusCode,409)
  assert.equal(sent,0)
})
test('a definite provider rejection is recorded as failed, not delivered or resolved',async()=>{
  const {call,path}=await setup(async()=>{throw Object.assign(new Error('rejected'),{name:'MessageRejected'})})
  const p=parse(await call('GET',path,admin))
  const result=parse(await call('POST',path,{...admin,body:p}))
  assert.equal(result.receipt.status,'failed');assert.equal(result.issueResolved,false)
  assert.equal(result.receipt.providerMessageId,null)
})
