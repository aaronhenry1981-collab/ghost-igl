import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createDynamoRepository } from './dynamo-repository.mjs'
import { encodeHistoryCursor, decodeHistoryCursor } from './history-cursor.mjs'
import { createSquadService } from './service.mjs'
import { createMemoryRepository } from './memory-repository.mjs'
import * as domain from '../../src/features/squad/domain.mjs'
import { hostingConnection, hostingFailure } from '../../src/features/squad/hosting-status.mjs'
const who='verified-owner-001',at=Date.parse('2026-11-06T08:00:00Z')
const key=n=>({PK:`USER#${who}`,SK:`OBS#${String(n).padStart(12,'0')}#request-${String(n).padStart(6,'0')}`})
class Command{constructor(input){this.input=input}}
function dynamo(responses){const calls=[];return{calls,repo:createDynamoRepository({table:'recon-squad-state',now:()=>at,commands:{QueryCommand:Command},client:{send:async c=>{calls.push(c.input);return responses.shift()||{}}}})}}
const profile=n=>({ownerSubject:who,version:n,rankLabel:'Retained'})
test('expiry timestamps do not hide any stored observation; older history is explicitly paginated',async()=>{
 const f=dynamo([{Items:Array.from({length:25},(_,i)=>({profile:profile(100+i),expiresAtTtl:at/1000-1})),LastEvaluatedKey:key(100)},{Items:[{profile:profile(1)}]}]);const service=createSquadService({repo:f.repo,authenticate:async()=>({subject:who}),domain,now:()=>at});const result=await service.history({});assert.equal(result.observations.length,25);assert.deepEqual(result.observations[0],profile(100));assert.ok(result.nextCursor);assert.equal(f.calls.length,1);const older=await service.history({queryStringParameters:{cursor:result.nextCursor}});assert.deepEqual(older.observations,[profile(1)]);assert.equal(older.nextCursor,null);assert.deepEqual(f.calls[1].ExclusiveStartKey,key(100));assert.ok(f.calls.every(c=>c.ExpressionAttributeValues[':pk']===`USER#${who}`&&c.Limit<=25&&c.ConsistentRead))
})
test('history pages stay bounded and older marked rows remain available through cursor',async()=>{
 const f=dynamo([{Items:Array.from({length:25},(_,i)=>({profile:profile(200-i),expiresAtTtl:1})),LastEvaluatedKey:key(176)},{Items:[{profile:profile(1),expiresAtTtl:1}]}]);const first=await f.repo.getProfileHistory(who);assert.equal(first.observations.length,25);assert.equal(f.calls.length,1);assert.deepEqual(decodeHistoryCursor(who,first.nextCursor),key(176));const older=await f.repo.getProfileHistory(who,first.nextCursor);assert.deepEqual(older.observations,[profile(1)]);assert.equal(older.nextCursor,null);assert.deepEqual(f.calls[1].ExclusiveStartKey,key(176))
})

test('mixed expiry metadata does not change page size or drop retained observations',async()=>{
 const f=dynamo([{Items:Array.from({length:25},(_,i)=>({profile:profile(100-i),...(i<15?{expiresAtTtl:1}:{})})),LastEvaluatedKey:key(76)},{Items:Array.from({length:15},(_,i)=>({profile:profile(75-i)})),LastEvaluatedKey:key(61)}]);const result=await f.repo.getProfileHistory(who);assert.equal(result.observations.length,25);assert.equal(f.calls.length,1);assert.equal(f.calls[0].Limit,25);assert.deepEqual(decodeHistoryCursor(who,result.nextCursor),key(76))
})
test('cursor rejects account switch, foreign PK, malformed fields and stops before any read',async()=>{
 const cursor=encodeHistoryCursor(who,key(20));assert.throws(()=>decodeHistoryCursor('verified-other-001',cursor),{status:400});assert.throws(()=>encodeHistoryCursor(who,{...key(20),PK:'USER#verified-other-001'}));for(const value of [123,'!bad',Buffer.from(JSON.stringify({v:1,who:'x',sk:key(20).SK,PK:'foreign'})).toString('base64url')]){const f=dynamo([]);await assert.rejects(()=>f.repo.getProfileHistory(who,value),{status:400});assert.equal(f.calls.length,0)}
})
test('legacy, zero, expired, boundary and future timestamps never hide saved history',async()=>{
 const f=dynamo([{Items:[{profile:profile(1)},{profile:profile(2),expiresAtTtl:null},{profile:profile(3),expiresAtTtl:0},{profile:profile(4),expiresAtTtl:at/1000},{profile:profile(5),expiresAtTtl:at/1000+1}]}]);assert.deepEqual((await f.repo.getProfileHistory(who)).observations,[profile(1),profile(2),profile(3),profile(4),profile(5)])
})
function recoveryFixture({holdGrant=false,initialRecovery=true}={}){
 let serial=0
 const record={id:'owner-grant-001',kind:'owner',policy:'owner-v1',ownerSubject:who,version:1,enabled:true},repo=createMemoryRepository({grants:[record],now:()=>at}),service=createSquadService({repo,authenticate:async()=>({subject:who}),domain,now:()=>at,random:()=>`recovery-room-${++serial}`})
 const state={room:null,grant:null,busy:false,recovery:initialRecovery,closeCalls:0,hostingDiagnostic:''},generation={current:0},pendingMutation={current:null};let releaseGrant
 const noop=()=>{},auth={currentSubject:()=>who}
 const bindings={canInteract:()=>true,recoveryRequired:initialRecovery,pendingMutation,speech:{stop:noop,mute:noop},setFresh:noop,generation,setBusy:v=>{state.busy=v},setError:noop,suspend:()=>{throw Error('Unexpected suspension')},auth,forgetAccount:()=>{throw Error('Unexpected account switch')},setRecoveryRequired:v=>{state.recovery=v},attached:{current:true},apply:()=>{throw Error('Ended result must never apply an expired room')},watch:()=>{throw Error('Ended result must never restart a room')},setProfile:noop,setHistory:noop,setHistoryCursor:noop,setGrant:v=>{state.grant=v},realtime:{current:{stop:noop}},setAudioEnabled:noop,setSnapshot:v=>{state.room=v;state.closeCalls++},setInvite:noop,setConnection:noop,api:{current:{grant:()=>holdGrant?new Promise(resolve=>{releaseGrant=resolve}):service.grant({}),disconnect:noop}}}
 Object.assign(bindings,{hostingConnection,hostingFailure,setHostingDiagnostic:v=>{state.hostingDiagnostic=v}})
 const text=readFileSync(new URL('../../src/features/squad/AccountApp.jsx',import.meta.url),'utf8'),perform=text.slice(text.indexOf('  async function perform('),text.indexOf('  async function connect(')),recover=text.match(/  function recoverChange\(\) \{[^\n]*\}/)[0],close=text.match(/  function closeView\(\) \{[^\n]*\}/)[0];const functions=new Function(...Object.keys(bindings),perform+'\n'+close+'\n'+recover+'\nreturn {perform,recoverChange};')(...Object.values(bindings))
 return{state,repo,service,record,generation,pendingMutation,functions,auth,release:()=>releaseGrant?.({enabled:true,kind:'owner',activeRoomId:null})}
}
test('P2 F2: actual perform/recover source clears old room after committed lost End Room response',async()=>{
 const f=recoveryFixture(),room=await f.service.create({},{requestId:'recovery-create-001',alias:'Owner'}),body={type:'close_room',requestId:'recovery-close-001',expectedRevision:room.room.revision};await f.service.command({},room.room.id,body);f.state.room=room.room;f.pendingMutation.current={task:()=>f.service.command({},room.room.id,body),options:{mutation:true}};f.functions.recoverChange();await new Promise(setImmediate);assert.equal(f.state.room,null);assert.equal(f.state.closeCalls,1);assert.equal(f.state.recovery,false);assert.equal(f.state.busy,false);assert.equal(f.state.grant.activeRoomId,null);assert.equal(f.state.grant.sessionsUsed,1)
})
test('direct close also uses central cleanup and never applies an expired returned room',async()=>{
 const f=recoveryFixture({initialRecovery:false}),room=await f.service.create({},{requestId:'direct-create-001',alias:'Owner'});f.state.room=room.room;await f.functions.perform(()=>f.service.command({},room.room.id,{type:'close_room',requestId:'direct-close-001',expectedRevision:room.room.revision}),{mutation:true});assert.equal(f.state.room,null);assert.equal(f.state.closeCalls,1);assert.equal(f.state.busy,false)
})
test('account generation change fences late hosting refresh after End Room cleanup',async()=>{
 const f=recoveryFixture({holdGrant:true,initialRecovery:false}),room=await f.service.create({},{requestId:'late-create-001',alias:'Owner'});const pending=f.functions.perform(()=>f.service.command({},room.room.id,{type:'close_room',requestId:'late-close-001',expectedRevision:room.room.revision}),{mutation:true});await new Promise(setImmediate);assert.equal(f.state.room,null);f.generation.current++;f.auth.currentSubject=()=> 'verified-other-001';f.release();await pending;assert.equal(f.state.grant,null);assert.equal(f.state.room,null)
})
