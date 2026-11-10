import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {buildVodCoachingEvent} from './vodEvidence.js'
import {preflightVodUpload,serializeVodRequest} from './vodUploadSize.mjs'
import {pollVodJob,readPendingJob,savePendingJob,clearPendingJob,jobPending} from './vodJobPolling.mjs'
const source=readFileSync(new URL('./vodApi.js',import.meta.url),'utf8').replace(/^import .*\r?\n/gm,'').replace(/export /g,'')
function app(lostReceipt=false,streaming=true) {
 let subject='owner-a',posts=0,gets=0,writes=0
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
 const id='12345678-1234-4234-8234-123456789abc'
 const ctx=vm.createContext({API_URL:'https://offline.invalid',VOD_STREAM_URL:streaming?'https://test.lambda-url.us-east-1.on.aws':'',AbortController,setTimeout,clearTimeout,buildVodCoachingEvent,preflightVodUpload,serializeVodRequest,
  crypto:{randomUUID:()=>id},pollVodJob,jobPending,
  readPendingJob:owner=>readPendingJob(owner,storage),savePendingJob:job=>savePendingJob(job,storage),clearPendingJob:owner=>clearPendingJob(owner,storage),
  getCurrentUser:()=>({}),getSession:async()=>({getIdToken:()=>({decodePayload:()=>({sub:subject})})}),getIdToken:()=> 'offline',
  FileReader:class {readAsDataURL(){this.result='data:image/jpeg;base64,eA==';this.onload()}},
  fetch:async(url,options)=>{
    if(url.endsWith('/vod/analyze')){posts++;assert.equal(JSON.parse(options.body).request_id,streaming?id:undefined);if(lostReceipt)throw Error('lost reply');if(streaming)return {status:200,ok:true,body:{cancel:async()=>{}}};return {status:202,ok:true,json:async()=>({jobId:id,status:'pending'})}}
    if(url.includes('/vod/jobs/')){gets++;assert.equal(options.method,undefined);return {status:200,ok:true,json:async()=>({jobId:id,status:'completed',result:{statusCode:200,body:JSON.stringify({session:{headline:'Visible frame',score:null,image_count:1},per_image:[]})}})}}
    assert.ok(url.endsWith('/me/coaching-events'));writes++;return {ok:true,json:async()=>({written:1,received:1})}
  }})
 vm.runInContext(source,ctx)
 return {ctx,counts:()=>({posts,gets,writes}),storage,switchOwner:value=>{subject=value}}
}
test('actual client handles async completion and durable evidence receipt',async()=>{
 const a=app();const result=await a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}],{map:'coastline'})
 assert.equal(result.roadmap_sync,'saved');assert.deepEqual(a.counts(),{posts:1,gets:1,writes:1})
})
test('lost submit acknowledgement resumes existing id without paid POST replay',async()=>{
 const a=app(true);await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),{code:'review_pending'})
 const result=await a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]);assert.equal(result.roadmap_sync,'saved')
 assert.deepEqual(a.counts(),{posts:1,gets:1,writes:1})
})
test('different signed-in subject cannot resume owner receipt',async()=>{
 const a=app(true);await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),{code:'review_pending'})
 a.switchOwner('owner-b');await assert.rejects(a.ctx.resumeVodReviewApi(),{code:'review_not_found'})
 assert.deepEqual(a.counts(),{posts:1,gets:0,writes:0})
})

test('unavailable browser receipt storage fails before paid POST',async()=>{
 const a=app();a.ctx.savePendingJob=()=>false
 await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),{code:'review_receipt_unavailable'})
 assert.deepEqual(a.counts(),{posts:0,gets:0,writes:0})
})

test('streamed admission disconnects response and retrieves original receipt without replay',async()=>{const a=app(false,true);const result=await a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]);assert.equal(result.roadmap_sync,'saved');assert.deepEqual(a.counts(),{posts:1,gets:1,writes:1})})
test('streaming lost ACK retains original receipt across explicit resume',async()=>{const a=app(true,true);await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),{code:'review_pending'});await a.ctx.resumeVodReviewApi();assert.deepEqual(a.counts(),{posts:1,gets:1,writes:1})})

test('disabled legacy lost response creates no streaming receipt and never polls missing job',async()=>{const a=app(true,false);await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),/lost reply/);assert.equal(a.storage.getItem('recon-vod-job:owner-a'),undefined);await assert.rejects(a.ctx.resumeVodReviewApi(),{code:'review_not_found'});assert.deepEqual(a.counts(),{posts:1,gets:0,writes:0})})
test('rollback still recovers an existing streaming receipt without another POST',async()=>{const a=app(true,true);await assert.rejects(a.ctx.analyzeSessionApi([{size:1,type:'image/jpeg'}]),{code:'review_pending'});a.ctx.VOD_STREAM_URL='';await a.ctx.resumeVodReviewApi();assert.deepEqual(a.counts(),{posts:1,gets:1,writes:1})})
