import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createDailyTipRoute} from './daily-tip-route.mjs'
import {handler as publisher} from './daily-tip-handler.mjs'
const arn='arn:aws:lambda:us-east-1:183678667221:function:ghost-igl-discord-bot:daily-tip'
test('direct invocation requires exact alias; HTTP shapes always stay on signature route',async()=>{
  let sent=0,http=0
  const route=createDailyTipRoute(async()=>{http++;return {statusCode:401}},async()=>{sent++;return {status:'stub'}})
  for(const key of ['headers','body','requestContext','rawPath','httpMethod'])await route({action:'daily-tip',[key]:null},{invokedFunctionArn:arn})
  assert.equal(http,5);assert.equal(sent,0)
  for(const bad of [undefined,arn.replace(':daily-tip',''),arn.replace('183678667221','999999999999')])assert.equal((await route({action:'daily-tip'},{invokedFunctionArn:bad})).status,'invalid-invocation')
  await route({action:'daily-tip'},{invokedFunctionArn:arn});assert.equal(sent,1)
})
test('enabled publisher refuses absent, expired, future or longer than 31-day approval period before SDK access',async()=>{
  process.env.DAILY_TIP_ENABLED='true'
  for(const [start,stop] of [['',''],['2020-01-01','2020-01-02'],['2099-01-01','2099-01-02'],['2020-01-01','2099-01-01']]){
    process.env.DAILY_TIP_START_AT=start;process.env.DAILY_TIP_STOP_AT=stop
    assert.equal((await publisher({action:'daily-tip'})).status,'outside-approved-period')
  }
  delete process.env.DAILY_TIP_ENABLED;delete process.env.DAILY_TIP_START_AT;delete process.env.DAILY_TIP_STOP_AT
})
test('real interaction router preserves signature validation and signed ping',async()=>{
  const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519')
  process.env.DISCORD_PUBLIC_KEY=publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('hex')
  const {handler}=await import('./index.mjs')
  const body=JSON.stringify({type:1,action:'daily-tip'}),timestamp=String(Math.floor(Date.now()/1000))
  const base={action:'daily-tip',requestContext:{http:{method:'POST'}},body,headers:{}}
  assert.equal((await handler(base,{invokedFunctionArn:arn})).statusCode,401)
  base.headers={'x-signature-timestamp':timestamp,'x-signature-ed25519':crypto.sign(null,Buffer.from(timestamp+body),privateKey).toString('hex')}
  assert.deepEqual(JSON.parse((await handler(base,{invokedFunctionArn:arn})).body),{type:1})
  assert.equal((await handler({...base,body:body+'x'},{invokedFunctionArn:arn})).statusCode,401)
  assert.equal((await handler({requestContext:{http:{method:'GET'}}})).statusCode,405)
})
