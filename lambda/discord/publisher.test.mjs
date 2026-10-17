import test from 'node:test'
import assert from 'node:assert/strict'
import {publishDailyTip,localTime,preview,createBotClient,createWebhookClient} from './publisher.mjs'
import {handler} from './daily-tip-handler.mjs'
import {TIPS} from './tips.mjs'
const channel='1561007958890909706',guild='1492733599424839781'
function fixture(extra={}){const rows=new Map();let sends=0,verifies=0
 const store={claim:async row=>{if(rows.has(row.key))return false;rows.set(row.key,row);return true},markSent:async(key,id)=>{rows.get(key).status='sent';rows.get(key).messageId=id},markUncertain:async key=>{rows.get(key).status='needs-review'}}
 const discord={verifyChannel:async()=>{verifies++},send:async payload=>{sends++;assert.deepEqual(payload.allowed_mentions,{parse:[]});return{id:'123456789012345678',channel_id:channel}}}
 return{rows,sends:()=>sends,verifies:()=>verifies,args:{config:{enabled:true,channelId:channel},event:{action:'daily-tip',scheduledTime:'2026-10-17T16:00:00Z'},now:new Date('2026-10-17T16:00:01Z'),store,discord,...extra}}}
test('noon follows New York DST transitions, not fixed UTC',()=>{
 for(const [t,h] of [['2026-03-07T17:00:00Z',12],['2026-03-08T16:00:00Z',12],['2026-11-01T17:00:00Z',12],['2026-11-01T16:00:00Z',11]])assert.equal(localTime(new Date(t)).hour,h)
})
test('disabled and dry run do not claim or call Discord',async()=>{const f=fixture();assert.equal((await publishDailyTip({...f.args,config:{enabled:false}})).status,'disabled');const r=await publishDailyTip({...f.args,event:{...f.args.event,dryRun:true}});assert.equal(r.status,'dry-run');assert.equal(f.rows.size,0);assert.equal(f.sends(),0);assert.equal(f.verifies(),0)})
test('concurrent and duplicate jobs send once for a local calendar day',async()=>{const f=fixture();const r=await Promise.all([publishDailyTip(f.args),publishDailyTip(f.args)]);assert.equal(f.sends(),1);assert.ok(r.some(x=>x.status==='sent'));assert.ok(r.some(x=>x.status==='already-claimed'));await publishDailyTip(f.args);assert.equal(f.sends(),1)})
test('unknown outcome and failed receipt storage never auto retry',async()=>{for(const mode of ['send','save']){const f=fixture();if(mode==='send')f.args.discord.send=async()=>{throw Error('secret URL must not escape')};else f.args.store.markSent=async()=>{throw Error('private backend error')};const r=await publishDailyTip(f.args);assert.equal(r.status,'needs-review');assert.doesNotMatch(JSON.stringify(r),/secret|private/);assert.equal((await publishDailyTip(f.args)).status,'already-claimed')}})
test('wrong time, stale date, invalid trigger and storage failure send nothing',async()=>{const f=fixture();for(const t of ['invalid','2026-10-16T16:00:00Z','2026-10-17T15:00:00Z','2026-10-17T16:01:00Z'])assert.notEqual((await publishDailyTip({...f.args,event:{action:'daily-tip',scheduledTime:t}})).status,'sent');assert.equal(f.sends(),0);f.args.store.claim=async()=>{throw Error()};assert.equal((await publishDailyTip(f.args)).status,'storage-unavailable')})
test('14 deterministic curated tips have bounded content and no mentions',()=>{assert.equal(TIPS.length,14);for(let d=1;d<=28;d++){const t=`2026-10-${String(d).padStart(2,'0')}T16:00:00Z`;assert.deepEqual(preview(t),preview(t));assert.ok(preview(t).content.length<1800);assert.doesNotMatch(preview(t).content,/@everyone|@here|<@/)}})
test('existing bot is pinned to exact guild/channel and sends with nonce, no mentions',async()=>{
 const calls=[];const bot=createBotClient({getToken:async()=>'fixture-only',channelId:channel,guildId:guild,fetchImpl:async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(init.method==='GET'?{id:channel,guild_id:guild,type:0}:{id:'123456789012345678',channel_id:channel}))}})
 await bot.verifyChannel(channel);await bot.send({content:'fixture',allowed_mentions:{parse:[]}},channel+':2026-10-17')
 assert.equal(calls.length,2);assert.equal(calls[1].url,`https://discord.com/api/v10/channels/${channel}/messages`);assert.equal(calls[1].init.redirect,'error');assert.equal(JSON.parse(calls[1].init.body).enforce_nonce,true)
 await assert.rejects(bot.verifyChannel('999999999999999999'))
})
test('wrong guild and non-Discord webhook fail before posting',async()=>{let posts=0;const bot=createBotClient({getToken:async()=>'fixture',channelId:channel,guildId:guild,fetchImpl:async()=>new Response(JSON.stringify({id:channel,guild_id:'other',type:0}))});await assert.rejects(bot.verifyChannel(channel));const webhook=createWebhookClient({getUrl:async()=>'https://example.invalid/secret',fetchImpl:async()=>{posts++}});await assert.rejects(webhook.verifyChannel(channel));assert.equal(posts,0)})
test('AWS handler defaults disabled without SDK/credential access',async()=>{delete process.env.DAILY_TIP_ENABLED;assert.deepEqual(await handler({action:'daily-tip'}),{status:'disabled'})})
