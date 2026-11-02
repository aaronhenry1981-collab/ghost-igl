import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCommand, createRoom, planFor, myRole, COORDINATION_MAPS } from './domain.mjs'
import { stackPlanning, planningSizeFor, STACK_SIZES } from './stack-planning.mjs'
const people = ['Thermite','Thatcher','Ash','Nomad','Iana'].map((operator,index)=>({subject:`synthetic-${index}`,alias:`Demo ${index}`,operator}))
const ids=['solo','pair','trio','quad','stack'];let serial=0
const command=(room,actor,type,fields={})=>applyCommand(room,{type,requestId:`partial-${++serial}`,phaseEpoch:room.phaseEpoch,iglTerm:room.iglTerm,expectedRevision:room.revision,...fields},actor,1000)
function roomWith(size){let room=createRoom({id:'unchanged-room',actor:people[0],now:1000,inviteExpiresAt:99999});for(let i=1;i<size;i++){room=command(room,people[i],'join');room=command(room,people[i],'report_operator',{operator:people[i].operator})}return room}
for(const size of STACK_SIZES){
 test(`${size}-player planning never creates or removes identities or resets the room`,()=>{
  const room=roomWith(Math.min(size,3)),before=structuredClone(room),preview=stackPlanning(room,size)
  assert.equal(preview.drill.minPlayers,size);assert.equal(preview.slots.length,5)
  assert.equal(preview.confirmedCount,Math.min(size,3));assert.equal(preview.missingCoordinated,Math.max(0,size-3))
  assert.equal(preview.slots.filter(x=>x.member).length,Object.keys(room.members).length)
  for(const slot of preview.slots.filter(x=>x.kind!=='member'))assert.equal(slot.member,null)
  assert.deepEqual(room,before);assert.equal(preview.roles.length,size)
 })
 test(`${size}-player drill assigns only compatible real members and locks without randoms`,()=>{
  let room=command(roomWith(size),people[0],'choose_map',{map:'Bank'})
  room=command(room,people[0],'select_plan',{planId:ids[size-1]})
  const before=structuredClone(room)
  assert.throws(()=>command(room,people[0],'assign',{roleId:planFor(ids[size-1]).roles[0].id,memberSubject:'random-not-a-member'}),{code:'ASSIGNMENT'})
  assert.deepEqual(room,before)
  planFor(ids[size-1]).roles.forEach((role,index)=>{room=command(room,people[0],'assign',{roleId:role.id,memberSubject:people[index].subject})})
  room=command(room,people[0],'lock');assert.equal(room.plan.locked,true)
  for(let i=0;i<size;i++)assert.ok(myRole(room,people[i].subject))
  const preview=stackPlanning(room,size);assert.equal(preview.roles.every(x=>x.status==='assigned'),true)
  assert.equal(preview.unconfirmedTeammates,5-size);assert.equal(Object.keys(room.ready).length,0)
 })
}
test('planning smaller than the current roster never relabels confirmed members as randoms',()=>{
 const room=roomWith(4),preview=stackPlanning(room,2);assert.equal(preview.confirmedCount,4);assert.equal(preview.additionalConfirmed,2)
 assert.equal(preview.slots.filter(x=>x.kind==='member').length,4);assert.equal(preview.slots.filter(x=>x.kind==='unconfirmed').length,1)
 assert.equal(Object.keys(room.members).length,4)
})
test('a fresh view follows the shared drill size without overwriting an intentional personal preview',()=>{
 for(const [id,size] of [['trio',3],['quad',4]]){
  const room=command(command(roomWith(1),people[0],'choose_map',{map:'Bank'}),people[0],'select_plan',{planId:id}),before=structuredClone(room)
  assert.equal(planningSizeFor(room),size);assert.equal(planningSizeFor(room,2),2)
  assert.equal(stackPlanning(room,planningSizeFor(room)).shared,true)
  assert.equal(stackPlanning(room,2).sharedDrillName,planFor(id).name);assert.deepEqual(room,before)
 }
})
test('no-plan defaults track confirmed roster and never add seats for a fresh or empty view',()=>{
 assert.equal(planningSizeFor(null),1);assert.equal(planningSizeFor(roomWith(3)),3);assert.equal(planningSizeFor(roomWith(4)),4)
 assert.throws(()=>planningSizeFor(roomWith(1),6),RangeError)
})
test('three and four player previews show missing members and outside-drill responsibilities explicitly',()=>{
 const room=roomWith(1)
 assert.deepEqual(stackPlanning(room,3).outsideDrill.map(x=>x.id),['flank','intel'])
 assert.deepEqual(stackPlanning(room,4).outsideDrill.map(x=>x.id),['intel'])
 for(const size of [3,4]){
  const selected=command(command(room,people[0],'choose_map',{map:'Bank'}),people[0],'select_plan',{planId:ids[size-1]})
  assert.throws(()=>command(selected,people[0],'lock'),{code:'STACK_SIZE'})
  assert.equal(Object.keys(selected.members).length,1);assert.equal(selected.id,room.id)
 }
})
test('roster joins and removals update uncovered slots while preserving current room, map and phase',()=>{
 let room=command(command(roomWith(3),people[0],'choose_map',{map:'Coastline'}),people[0],'select_plan',{planId:'trio'})
 planFor('trio').roles.forEach((role,index)=>{room=command(room,people[0],'assign',{roleId:role.id,memberSubject:people[index].subject})})
 room=command(room,people[0],'lock');const before=structuredClone(room)
 const joined=command(room,people[3],'join')
 for(const key of ['id','map','phase','phaseEpoch','round','plan','assignments'])assert.deepEqual(joined[key],before[key])
 assert.equal(stackPlanning(joined,4).confirmedCount,4)
 const removed=command(joined,people[0],'remove',{memberSubject:people[2].subject})
 for(const key of ['id','map','phase','phaseEpoch','round'])assert.deepEqual(removed[key],before[key])
 assert.equal(removed.plan.locked,false);assert.equal(stackPlanning(removed,3).roles.find(x=>x.id==='entry').status,'unassigned')
})
test('operator repick exposes an uncovered incompatible role without inventing a replacement',()=>{
 let room=command(command(roomWith(3),people[0],'choose_map',{map:'Bank'}),people[0],'select_plan',{planId:'trio'})
 room=command(room,people[0],'assign',{roleId:'entry',memberSubject:people[2].subject});room=command(room,people[2],'report_operator',{operator:'Thermite'})
 const preview=stackPlanning(room,3);assert.equal(preview.roles.find(x=>x.id==='entry').status,'incompatible');assert.equal(preview.roles.find(x=>x.id==='entry').member,null)
})
test('invalid size input cannot produce phantom roster state',()=>{
 for(const size of [0,6,1.5,'3',null,undefined])assert.throws(()=>stackPlanning(roomWith(1),size),RangeError)
})
test('all name-only map choices use the existing map command and preserve old Bank/Coastline values',()=>{
 assert.equal(COORDINATION_MAPS.length,26);assert.equal(new Set(COORDINATION_MAPS).size,26)
 for(const map of COORDINATION_MAPS){const room=roomWith(1),next=command(room,people[0],'choose_map',{map});assert.equal(next.map,map);assert.equal(next.id,room.id);assert.deepEqual(next.members,room.members);assert.equal(next.phaseEpoch,room.phaseEpoch+1)}
 for(const map of ['Unknown','Close Quarter',null])assert.throws(()=>command(roomWith(1),people[0],'choose_map',{map}),{code:'MAP'})
})
test('map change retains the original ballot/revision boundaries and cannot reset a live round',()=>{
 let room=command(command(roomWith(1),people[0],'choose_map',{map:'Bank'}),people[0],'select_plan',{planId:'solo'})
 room=command(room,people[0],'assign',{roleId:'observe',memberSubject:people[0].subject});room=command(room,people[0],'lock')
 room=command(room,people[0],'vote',{planId:'trio'});const action=command(room,people[0],'advance')
 assert.throws(()=>command(action,people[0],'choose_map',{map:'Villa'}),{code:'PHASE'})
 const result=command(action,people[0],'advance'),changed=command(result,people[0],'choose_map',{map:'Villa'})
 assert.equal(changed.id,result.id);assert.equal(changed.round,result.round);assert.equal(changed.map,'Villa');assert.deepEqual(changed.votes,{});assert.deepEqual(changed.assignments,{});assert.equal(changed.plan,null)
 assert.equal(changed.phaseEpoch,result.phaseEpoch+1);assert.equal(changed.revision,result.revision+1)
})
