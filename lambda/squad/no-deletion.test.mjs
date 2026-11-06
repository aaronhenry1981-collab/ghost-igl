import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createSquadService} from './service.mjs'
import {createMemoryRepository} from './memory-repository.mjs'
import {createDynamoRepository} from './dynamo-repository.mjs'
import {hostingPolicy,nextSessionUsage,OWNER_POLICY} from './hosting-policy.mjs'
import * as domain from '../../src/features/squad/domain.mjs'
const who='retained-owner-001',at=Date.parse('2026-11-06T08:00:00Z')
const record={id:'retained-grant-001',ownerSubject:who,kind:'owner',policy:'owner-v1',version:1,enabled:true}
const policy=hostingPolicy(record,who,at)
const used={version:7,period:'2026-11',day:'2026-11-06',sessions:1,sessionsToday:1,activeUntil:at-1,retainedRooms:511,reservedBytes:511*8*1024*1024}
test('last lifetime slot is admitted once; month rollover cannot refund capacity',()=>{
 const last=nextSessionUsage(policy,used,at,'room-last-001',at+1000);assert.equal(last.retainedRooms,512);assert.equal(last.reservedBytes,4*1024**3)
 assert.equal(nextSessionUsage(policy,{...last,activeUntil:at-1},Date.parse('2026-12-01T08:00:00Z'),'room-next-001',at+1000),null)
 for(const value of [{...used,reservedBytes:0},{...used,retainedRooms:NaN},{...used,retainedRooms:undefined}])assert.equal(nextSessionUsage(policy,value,at,'room-next-001',at+1000),null)
})
test('capacity is subject-bound across grant id change and End Room never refunds stored slots',async()=>{
 let serial=0,clock=at;const repo=createMemoryRepository({grants:[record],now:()=>clock}),s=createSquadService({repo,domain,authenticate:async()=>({subject:who}),now:()=>clock,random:()=>`retained-generated-${++serial}`})
 const room=await s.create({},{alias:'Owner',requestId:'retained-create-001'});assert.equal((await s.grant({})).retainedRooms,1)
 await s.command({},room.room.id,{type:'close_room',requestId:'retained-close-001',expectedRevision:room.room.revision});assert.equal((await s.grant({})).retainedRooms,1)
 repo.fixture.setGrant({...record,id:'retained-grant-002',version:2});assert.equal((await s.grant({})).retainedRooms,1)
 await s.create({},{alias:'Owner',requestId:'retained-create-002'});assert.equal((await s.grant({})).retainedRooms,2)
 clock=Date.parse('2027-01-01T00:00:00Z');assert.equal((await s.grant({})).retainedRooms,2);assert.equal((await s.grant({})).sessionsUsed,0)
})
test('expired room denies use while saved profile and all observations remain readable years later',async()=>{
 let clock=at,serial=0;const repo=createMemoryRepository({grants:[record],now:()=>clock}),s=createSquadService({repo,domain,authenticate:async()=>({subject:who}),now:()=>clock,random:()=>`history-retained-${++serial}`})
 const room=await s.create({},{alias:'Owner',requestId:'history-create-001'})
 await s.updateProfile({},room.room.id,{requestId:'history-profile-001',expectedVersion:0,platform:'playstation',season:'self-reported',mode:'Ranked',rankLabel:'Unknown',rp:null,context:'profile'})
 const before=await s.history({});clock+=5*365*86400_000;await assert.rejects(()=>s.snapshot({},room.room.id),{status:410});assert.deepEqual(await s.history({}),before);assert.equal((await s.profile({})).profile.version,1);assert.ok(await repo.getRoom(room.room.id))
})
class Command{constructor(input){this.input=input}}
function fixture(responses=[]){const calls=[];return{calls,repo:createDynamoRepository({table:'recon-squad-state',now:()=>at,commands:{GetCommand:Command,QueryCommand:Command,TransactWriteCommand:Command},client:{send:async c=>{calls.push(c.input);return responses.shift()||{}}}})}}
test('actual Dynamo capacity reservation uses subject key and atomic version; no TTL or delete writes',async()=>{
 const f=fixture([{Item:{usage:used}},{}]),envelope={id:'retained-room-001',hostSubject:who,grantId:record.id,version:0,expiresAt:at+14400000,state:{}}
 assert.equal(await f.repo.createSession({envelope,grant:policy,createReceipt:{requestId:'retained-create-001'}}),true)
 assert.equal(f.calls[0].Key.PK,`OWNER_USAGE#${who}`);const writes=f.calls[1].TransactItems;const usage=writes.find(x=>x.Put?.Item.PK.startsWith('OWNER_USAGE#')).Put;assert.equal(usage.Item.usage.retainedRooms,512);assert.equal(usage.ExpressionAttributeValues[':v'],7)
 assert.ok(writes.every(x=>!x.Delete&&!x.Put?.Item.expiresAtTtl));assert.equal(JSON.stringify(writes).includes('retentionTtl'),false)
 const capped=fixture([{Item:{usage:{...used,retainedRooms:512,reservedBytes:4*1024**3}}}]);assert.equal(await capped.repo.createSession({envelope,grant:policy,createReceipt:{requestId:'retained-create-002'}}),false);assert.equal(capped.calls.length,1)
})
test('oversize retained owner row fails before a write; legacy write behavior remains unchanged',async()=>{
 const next={id:'retained-room-001',hostSubject:who,version:0,expiresAt:at+1000,state:{}};const receipt={actor:who,requestId:'big-record-001',unexpected:'x'.repeat(3000)}
 const f=fixture();await assert.rejects(()=>f.repo.commitRoom({next,expectedVersion:0,grant:policy,receipt}),/reserved storage bound/);assert.equal(f.calls.length,0)
 const legacy=fixture();await legacy.repo.commitRoom({next,expectedVersion:0,grant:{...policy,kind:undefined},receipt});assert.equal(legacy.calls.length,1)
})
test('no runtime or template assigns automatic deletion markers or deletion operations',()=>{
 for(const name of ['service.mjs','dynamo-repository.mjs','memory-repository.mjs','hosting-policy.mjs']){const text=readFileSync(new URL('./'+name,import.meta.url),'utf8');assert.doesNotMatch(text,/expiresAtTtl|retentionTtl|DeleteCommand|DeleteItem|\.delete\(/)}
 const template=JSON.parse(readFileSync(new URL('../../aws/squad-preview.template.json',import.meta.url)));assert.equal(template.Resources.SquadTable.Properties.TimeToLiveSpecification,undefined);assert.equal(OWNER_POLICY.maxRetainedRooms*OWNER_POLICY.roomReservationBytes,4*1024**3)
})
