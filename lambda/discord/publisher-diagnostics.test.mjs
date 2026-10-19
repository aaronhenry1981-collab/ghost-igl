import test from 'node:test'
import assert from 'node:assert/strict'
import {publishDailyTip,createBotClient} from './publisher.mjs'
const channel='1561007958890909706',guild='1492733599424839781'
const secret='TOKEN-PRIVATE-DO-NOT-LOG'
function fixture(mode){
 const rows=new Map(),calls=[]
 const store={claim:async r=>{if(rows.has(r.key))return false;rows.set(r.key,r);return true},markSent:async(k,id)=>{if(mode==='storage')throw Error(secret);Object.assign(rows.get(k),{status:'sent',message_id:id})},markUncertain:async(k,diagnostic)=>{if(mode==='uncertain-storage')throw Error(secret);Object.assign(rows.get(k),{status:'needs-review',diagnostic})}}
 const discord=createBotClient({channelId:channel,guildId:guild,getToken:async()=>secret,fetchImpl:async(url,init)=>{
   calls.push(init.method)
   if((mode==='network-get'&&init.method==='GET')||(['network-post','uncertain-storage'].includes(mode)&&init.method==='POST'))throw Error(secret+' https://private.invalid')
   if(mode==='timeout'&&init.method==='GET'){const e=Error(secret);e.name='TimeoutError';throw e}
   if(mode==='permission'&&init.method==='POST')return new Response(JSON.stringify({code:50013,message:secret}),{status:403})
   if(mode==='unsafe-code'&&init.method==='POST')return new Response(JSON.stringify({code:secret,message:secret}),{status:400})
   if(mode==='non-json'&&init.method==='POST')return new Response(secret,{status:502})
   return new Response(JSON.stringify(init.method==='GET'?{id:channel,guild_id:mode==='channel'?'wrong':guild,type:0}:{id:mode==='receipt'?'bad':'123456789012345678',channel_id:channel}))
 }})
 return {rows,calls,args:{config:{enabled:true,channelId:channel},event:{action:'daily-tip',scheduledTime:'2026-10-18T16:00:00Z'},now:new Date('2026-10-18T16:00:01Z'),store,discord}}
}
for(const [mode,stage,kind,started,status,code] of [
 ['channel','verify-channel','channel-mismatch',false],
 ['permission','send','http-error',true,403,50013],
 ['network-get','verify-channel','request-failed',false],
 ['network-post','send','request-failed',true],
 ['timeout','verify-channel','timeout',false],
 ['receipt','validate-receipt','operation-failed',true],
 ['storage','store-receipt','operation-failed',true],
 ['unsafe-code','send','http-error',true,400],
 ['non-json','send','http-error',true,502],
 ['uncertain-storage','send','request-failed',true],
])test('sanitized diagnostics and no retry: '+mode,async()=>{
 const f=fixture(mode),r=await publishDailyTip(f.args),d=r.diagnostic
 assert.equal(r.status,'needs-review');assert.equal(d.stage,stage);assert.equal(d.kind,kind);assert.equal(d.postStarted,started)
 assert.equal(d.httpStatus,status);assert.equal(d.discordCode,code);assert.ok(Number.isFinite(Date.parse(d.at)))
 assert.doesNotMatch(JSON.stringify([r,[...f.rows.values()]]),/TOKEN-PRIVATE|private.invalid|Authorization|stack|message"/)
 assert.ok(f.calls.filter(x=>x==='POST').length<=1)
 const before=f.calls.length;assert.equal((await publishDailyTip(f.args)).status,'already-claimed');assert.equal(f.calls.length,before)
 if(mode!=='uncertain-storage')assert.deepEqual([...f.rows.values()][0].diagnostic,d)
})
test('normal successful flow saves receipt and no diagnostic',async()=>{
 const f=fixture('success'),r=await publishDailyTip(f.args)
 assert.equal(r.status,'sent');assert.equal(r.diagnostic,undefined);assert.deepEqual(f.calls,['GET','POST'])
 assert.equal([...f.rows.values()][0].message_id,'123456789012345678')
})
test('untrusted thrown metadata cannot leak into diagnostics',async()=>{
 const f=fixture('success');f.args.discord.verifyChannel=async()=>{throw Object.assign(Error(secret),{kind:secret,httpStatus:secret,discordCode:secret,postStarted:secret})}
 const r=await publishDailyTip(f.args);assert.equal(r.diagnostic.kind,'operation-failed');assert.equal(r.diagnostic.postStarted,false);assert.doesNotMatch(JSON.stringify(r),/TOKEN-PRIVATE/)
})
