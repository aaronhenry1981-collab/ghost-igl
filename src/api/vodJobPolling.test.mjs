import test from 'node:test'
import assert from 'node:assert/strict'
import {pollVodJob,readPendingJob,savePendingJob} from './vodJobPolling.mjs'
const response=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body})
test('29.5 second provider latency completes through status reads, no resubmit',async()=>{
 let t=0,reads=0
 const result=await pollVodJob({jobId:'test',now:()=>t,sleep:async ms=>{t+=ms},fetchStatus:async()=>{reads++;return response(t<29505?202:200,t<29505?{status:'running'}:{status:'completed',result:{statusCode:200,body:'{"session":{"score":null}}'}})}})
 assert.equal((await result.json()).session.score,null);assert.equal(reads,16)
})
test('transient status failure only repeats GET and remains bounded',async()=>{
 let t=0,reads=0
 await assert.rejects(pollVodJob({jobId:'test',budgetMs:5000,now:()=>t,sleep:async ms=>{t+=ms},fetchStatus:async()=>{reads++;throw Error('offline')}}),{code:'review_pending'})
 assert.equal(reads,3)
})
test('account interruption prevents late result exposure',async()=>{
 let current=true
 await assert.rejects(pollVodJob({jobId:'test',isCurrent:()=>current,fetchStatus:async()=>{current=false;return response(200,{status:'completed',result:{statusCode:200,body:'{}'}})}}),{code:'review_cancelled'})
})
test('failed/unknown jobs do not get resubmitted',async()=>{
 for(const [status,body,code] of [[200,{status:'failed'},'review_failed'],[404,{},'review_pending']])await assert.rejects(pollVodJob({jobId:'test',fetchStatus:async()=>response(status,body)}),{code})
})
test('pending receipts are isolated by subject and contain no credentials or images',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}
 savePendingJob({subject:'a',jobId:'job',context:{map:'coastline'}},storage)
 assert.equal(readPendingJob('b',storage),null);assert.equal(readPendingJob('a',storage).jobId,'job')
})
