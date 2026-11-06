import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import * as domain from '../../src/features/squad/domain.mjs'
import { createSquadService } from './service.mjs'
import { createMemoryRepository } from './memory-repository.mjs'
import { hostingPolicy, nextSessionUsage, OWNER_POLICY } from './hosting-policy.mjs'
const owner={subject:'verified-owner-001'}, guest={subject:'verified-guest-001'}, other={subject:'verified-other-001'}
function fixture(){
 let at=Date.parse('2026-11-06T08:00:00Z'),serial=0
 const record={id:'owner-grant-001',kind:'owner',policy:'owner-v1',ownerSubject:owner.subject,version:1,enabled:true}
 const repo=createMemoryRepository({grants:[record],now:()=>at})
 const service=createSquadService({repo,authenticate:async r=>r.principal,domain,now:()=>at,random:()=>`generated-owner-${++serial}`})
 const req=actor=>({principal:actor}),create=(id=`owner-create-${++serial}`)=>service.create(req(owner),{requestId:id,alias:'Owner'})
 const join=(room,actor=guest,invite=room.invite)=>service.join(req(actor),{roomId:room.room.id,requestId:`owner-join-${++serial}`,alias:'Teammate',invite})
 const command=(room,type='vote',extra={},id=`owner-command-${++serial}`)=>service.command(req(owner),room.room.id,{type,requestId:id,phaseEpoch:room.room.phaseEpoch,planId:'solo',...extra})
 return{repo,service,req,create,join,command,record,now:()=>at,set:v=>{at=v},advance:v=>{at+=v}}
}
test('durable owner access has no pilot end date and survives future months without renewal',async()=>{
 const f=fixture();assert.equal((await f.service.grant(f.req(owner))).kind,'owner');f.advance(400*86400_000);const grant=await f.service.grant(f.req(owner));assert.equal(grant.enabled,true);assert.equal(grant.validUntil,null);assert.equal(grant.maxSessions,20);assert.equal(grant.sessionMs,4*3600_000)
})
test('owner mode requires an operator-created exact policy, not client/body/canonical membership flags',async()=>{
 const f=fixture();await assert.rejects(()=>f.service.create({}, {alias:'Owner',requestId:'forged-owner-001',kind:'owner'}),{status:401});await assert.rejects(()=>f.service.create(f.req(owner),{alias:'Owner',requestId:'forged-owner-002',kind:'owner'}),{status:400});await assert.rejects(()=>f.service.grant(f.req(other)),{status:403})
 for(const extra of [{policy:'other'},{validUntil:Date.now()+9999999},{allowedSubjects:[owner.subject]},{version:0},{maxMembers:50}])assert.equal(hostingPolicy({...f.record,...extra},owner.subject,f.now()).error,503)
})
test('valid signed-in invite joins latest room but never grants hosting or permits ID guessing',async()=>{
 const f=fixture(),room=await f.create();await assert.rejects(()=>f.join(room,guest,'wrong-token'),{status:403});await assert.rejects(()=>f.service.snapshot(f.req(guest),room.room.id),{status:404});const joined=await f.join(room);assert.equal(Object.keys(joined.room.members).length,2);assert.equal(joined.hostingMode,'owner');await assert.rejects(()=>f.service.grant(f.req(guest)),{status:403});assert.equal(await f.repo.getGrant(guest.subject),null)
})
test('concurrent owner invitations admit at most five signed-in participants',async()=>{
 const f=fixture(),room=await f.create();const results=await Promise.allSettled(Array.from({length:5},(_,i)=>f.join(room,{subject:`verified-member-${i}`})));assert.equal(results.filter(x=>x.status==='fulfilled').length,4);assert.equal(Object.keys((await f.service.snapshot(f.req(owner),room.room.id)).room.members).length,5)
})
test('owner invitations expire after fifteen minutes; replacement revokes the old token',async()=>{
 const f=fixture(),room=await f.create();f.advance(15*60000);await assert.rejects(()=>f.join(room),{status:403});const replacement=await f.service.rotateInvite(f.req(owner),room.room.id,{requestId:'replace-invite-001'});await assert.rejects(()=>f.join(room,other,room.invite),{status:403});assert.equal(Object.keys((await f.join(room,other,replacement.invite)).room.members).length,2)
})
test('owner grant revocation closes later reads, mutations, ticket admission and fanout snapshots',async()=>{
 const f=fixture(),room=await f.create();const ticket=await f.service.socketTicket(f.req(owner),room.room.id,{requestId:'owner-ticket-001'});const hash=createHash('sha256').update(ticket.ticket).digest('hex');assert.ok(await f.repo.admitConnection(hash,'owner-connection-1'));f.repo.fixture.setGrant({...f.record,enabled:false,version:2});await assert.rejects(()=>f.service.snapshot(f.req(owner),room.room.id),{status:403});await assert.rejects(()=>f.command(room),{status:403});await assert.rejects(()=>f.service.connectionSnapshot('owner-connection-1'),{status:403});assert.equal(await f.repo.admitConnection(hash,'owner-connection-2'),null)
})
test('daily room admission is atomic and request retry consumes no second session',async()=>{
 const f=fixture();const first=await f.create('stable-create-001'),retry=await f.create('stable-create-001');assert.equal(first.room.id,retry.room.id);assert.equal((await f.service.grant(f.req(owner))).sessionsUsed,1);await assert.rejects(()=>f.create(),{status:409});f.advance(4*3600_000+1);await f.create();f.advance(4*3600_000+1);await assert.rejects(()=>f.create(),{status:409});f.set(Date.parse('2026-11-07T08:00:00Z'));await f.create();assert.equal((await f.service.grant(f.req(owner))).sessionsUsed,3)
})
test('month/day rollover does not permit a second simultaneous room',async()=>{
 const f=fixture();f.set(Date.parse('2026-11-30T23:30:00Z'));const room=await f.create();f.advance(3600_000);await assert.rejects(()=>f.create(),{status:409});assert.equal((await f.service.grant(f.req(owner))).activeRoomId,room.room.id)
})
test('twenty-room monthly quota resets at UTC month boundary without grant changes',async()=>{
 const f=fixture();for(let day=6;day<16;day++){f.set(Date.parse(`2026-11-${day.toString().padStart(2,'0')}T08:00:00Z`));await f.create();f.advance(4*3600_000+1);await f.create()};f.set(Date.parse('2026-11-20T08:00:00Z'));await assert.rejects(()=>f.create(),{status:409});f.set(Date.parse('2026-12-01T08:00:00Z'));await f.create();assert.equal((await f.service.grant(f.req(owner))).sessionsUsed,1);assert.deepEqual(await f.repo.getGrant(owner.subject),f.record)
})
test('five room changes per second is atomic; a receipt replay remains recoverable at the limit',async()=>{
 const f=fixture(),room=await f.create();await f.command(room,'vote',{},'repeat-command-001');for(let i=0;i<4;i++)await f.command(room);await assert.rejects(()=>f.command(room),{status:429,code:'RATE'});const replay=await f.command(room,'vote',{},'repeat-command-001');assert.equal(replay.recovered,true);f.advance(1000);await f.command(room)
})
test('owner permission never bypasses an expired identity token',async()=>{
 const f=fixture(),room=await f.create();await assert.rejects(()=>f.service.snapshot(f.req({...owner,tokenExpiresAt:f.now()}),room.room.id),{status:401});const ticket=await f.service.socketTicket(f.req({...owner,tokenExpiresAt:f.now()+1000}),room.room.id,{requestId:'short-ticket-001'});const hash=createHash('sha256').update(ticket.ticket).digest('hex');assert.ok(await f.repo.admitConnection(hash,'short-connection-1'));f.advance(1001);await assert.rejects(()=>f.service.connectionSnapshot('short-connection-1'),{status:403})
})
test('owner lease expiry never deletes or hides saved historical observations',async()=>{
 const f=fixture(),room=await f.create(),stored=await f.repo.getRoom(room.room.id);assert.equal(stored.retentionTtl,undefined);await f.service.updateProfile(f.req(owner),room.room.id,{requestId:'profile-owner-001',expectedVersion:0,platform:'playstation',season:'self-reported',mode:'Ranked',rankLabel:'Unknown',rp:null,context:'profile'});assert.equal((await f.service.history(f.req(owner))).observations.length,1);f.advance(31*86400_000);assert.equal((await f.service.history(f.req(owner))).observations.length,1);assert.equal((await f.service.profile(f.req(owner))).profile.rankLabel,'Unknown')
})
test('malformed usage fails closed instead of resetting or bypassing room quotas',()=>{
 const grant=hostingPolicy({id:'grant-owner-001',ownerSubject:owner.subject,kind:'owner',policy:'owner-v1',version:1,enabled:true},owner.subject,0)
 assert.equal(nextSessionUsage(grant,{version:1,sessions:NaN,activeUntil:0},0,'room-owner-001',1000),null);assert.equal(nextSessionUsage(grant,{version:1,sessions:0,activeUntil:0},0,'room-owner-001',1000),null);assert.equal(OWNER_POLICY.maxCommands,500)
})
test('host can end a room, recover its receipt, and start another without waiting four hours',async()=>{
 const f=fixture(),room=await f.create();const body={type:'close_room',requestId:'owner-close-001',expectedRevision:room.room.revision};const result=await f.service.command(f.req(owner),room.room.id,body);assert.equal(result.ended,true);await assert.rejects(()=>f.service.snapshot(f.req(owner),room.room.id),{status:410});assert.equal((await f.service.grant(f.req(owner))).activeRoomId,null);assert.equal((await f.service.command(f.req(owner),room.room.id,body)).recovered,true);const second=await f.create();assert.notEqual(second.room.id,room.room.id);await f.service.command(f.req(owner),room.room.id,body);assert.equal((await f.service.grant(f.req(owner))).activeRoomId,second.room.id);assert.equal((await f.service.grant(f.req(owner))).sessionsUsed,2)
})
test('guest or stale owner view cannot end the room or release another active room',async()=>{
 const f=fixture(),room=await f.create();await f.join(room);await assert.rejects(()=>f.service.command(f.req(guest),room.room.id,{type:'close_room',requestId:'guest-close-001',expectedRevision:room.room.revision}),{status:403});await assert.rejects(()=>f.service.command(f.req(owner),room.room.id,{type:'close_room',requestId:'stale-close-001',expectedRevision:0}),{status:409});assert.equal((await f.service.grant(f.req(owner))).activeRoomId,room.room.id)
})
