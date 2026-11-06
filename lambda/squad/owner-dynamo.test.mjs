import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createDynamoRepository } from './dynamo-repository.mjs'
import { hostingPolicy } from './hosting-policy.mjs'
const now=Date.parse('2026-11-06T08:00:00Z'), subject='verified-owner-001'
const grant=hostingPolicy({id:'owner-grant-001',kind:'owner',policy:'owner-v1',ownerSubject:subject,version:1,enabled:true},subject,now)
const envelope={id:'owner-room-001',hostSubject:subject,grantId:grant.id,version:0,expiresAt:now+14400000,state:{}}
class Command{constructor(input){this.input=input}}
function fixture(responses=[]){const calls=[];return {calls,repo:createDynamoRepository({table:'recon-squad-state',now:()=>now,commands:{GetCommand:Command,QueryCommand:Command,TransactWriteCommand:Command},client:{send:async cmd=>{calls.push(cmd.input);const result=responses.shift();if(result instanceof Error)throw result;return result||{}}}})}}
test('actual Dynamo adapter atomically checks owner policy and stores durable usage without touching grants',async()=>{
 const f=fixture();assert.equal(await f.repo.createSession({envelope,grant,createReceipt:{requestId:'owner-create-001'}}),true);const items=f.calls[1].TransactItems
 assert.equal(items.length,4);assert.match(items[0].ConditionCheck.ConditionExpression,/attribute_not_exists\(#g\.#until\)/);assert.equal(items[0].ConditionCheck.ExpressionAttributeValues[':policy'],'owner-v1')
 const writes=items.filter(x=>x.Put).map(x=>x.Put);assert.ok(writes.every(x=>x.TableName==='recon-squad-state'));assert.equal(writes.find(x=>x.Item.PK.startsWith('ROOM#')).Item.expiresAtTtl,undefined);assert.equal(writes.find(x=>x.Item.PK.startsWith('CREATE#')).Item.expiresAtTtl,undefined);const usage=writes.find(x=>x.Item.PK.startsWith('OWNER_USAGE#')).Item;assert.equal(usage.expiresAtTtl,undefined);assert.equal(usage.usage.period,'2026-11');assert.equal(usage.usage.sessionsToday,1)
})
test('daily cap and active cross-month room stop before a transaction can be submitted',async()=>{
 for(const usage of [{version:1,sessions:2,sessionsToday:2,day:'2026-11-06',period:'2026-11',activeUntil:now-1},{version:2,sessions:20,sessionsToday:1,day:'2026-10-31',period:'2026-10',activeUntil:now+1000,activeRoomId:'room-active-001'}]){const f=fixture([{Item:{usage}}]);assert.equal(await f.repo.createSession({envelope,grant,createReceipt:{requestId:'owner-create-001'}}),false);assert.equal(f.calls.length,1)}
})
test('room receipts observations and profiles are retained without TTL markers',async()=>{
 const f=fixture(),profile={ownerSubject:subject,version:1};await f.repo.commitRoom({next:envelope,expectedVersion:0,grant,receipt:{actor:'member-001',requestId:'owner-request-001'},privateProfile:{profile,previousVersion:0,requestId:'owner-profile-001'}});const writes=f.calls[0].TransactItems.filter(x=>x.Put).map(x=>x.Put.Item);assert.equal(writes.find(x=>x.SK==='PROFILE').expiresAtTtl,undefined);assert.equal(writes.find(x=>x.SK.startsWith('OBS#')).expiresAtTtl,undefined);assert.equal(writes.find(x=>x.SK.startsWith('RECEIPT#')).expiresAtTtl,undefined)
 const history=fixture([{Items:[{profile:{version:1},expiresAtTtl:Math.floor(now/1000)-1},{profile:{version:2}},{profile:{version:3},expiresAtTtl:Math.floor(now/1000)+1000}]}]);assert.deepEqual(await history.repo.getProfileHistory(subject),{observations:[{version:1},{version:2},{version:3}],nextCursor:null})
})
test('template remains exactly the deployed no-TTL baseline; IAM and grant-write denial unchanged',()=>{
 const next=JSON.parse(readFileSync(new URL('../../aws/squad-preview.template.json',import.meta.url)));assert.equal(next.Resources.SquadTable.Properties.TimeToLiveSpecification,undefined);assert.equal(createHash('sha256').update(JSON.stringify(next)).digest('hex'),'c97fe96b91fb5d90adaaa26863a072503ef35db998fca84ad8f819a9aa80452c')
})

test('end-room active lock release shares the room/receipt transaction and binds room plus usage version',async()=>{
 const usage={version:4,sessions:2,sessionsToday:1,period:'2026-11',day:'2026-11-06',activeRoomId:envelope.id,activeUntil:envelope.expiresAt};const f=fixture([{Item:{usage}},{}]);assert.equal(await f.repo.commitRoom({expectedVersion:0,next:{...envelope,expiresAt:now},grant,receipt:{actor:'member-owner-001',requestId:'close-owner-001'},releaseActiveRoom:true}),true);const items=f.calls[1].TransactItems;const update=items.find(x=>x.Put?.Item.PK.startsWith('OWNER_USAGE#')).Put;assert.match(update.ConditionExpression,/#u\.#room = :room/);assert.equal(update.ExpressionAttributeValues[':room'],envelope.id);assert.equal(update.Item.usage.activeRoomId,null);assert.equal(update.Item.usage.sessions,2);assert.equal(update.Item.usage.version,5)
})
