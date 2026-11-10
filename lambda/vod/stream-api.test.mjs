import test from 'node:test'
import assert from 'node:assert/strict'
import {createStreamApi,createStatusApi,parseStreamInput,MAX_STREAM_BODY_BYTES,MAX_STREAM_EVENT_BYTES} from './stream-api.mjs'
const request=(body={request_id:'12345678-1234-4234-8234-123456789abc',images:[{base64:'eA==',media_type:'image/jpeg'}]})=>({headers:{origin:'https://r6coaching.com',authorization:'Bearer mock'},requestContext:{http:{method:'POST'}},rawPath:'/vod/analyze',body:JSON.stringify(body)})
const owner={subject:'owner',email:'owner@test.invalid'}
function fixture(auth={owner},broken=false){const calls=[],sink={start:(...x)=>calls.push(['start',...x]),write:x=>{calls.push(['write',x]);if(broken)throw Error('disconnect')},end:()=>calls.push(['end'])};const api=createStreamApi({authorize:async e=>{calls.push(['verify',e.headers.authorization]);return auth},jobs:{submit:async({input,emit})=>{calls.push(['admitted']);emit({type:'ack'});await Promise.resolve();calls.push(['model',input.images.length]);calls.push(['persist']);emit({type:'result'});return {statusCode:200,body:{status:'completed'}}}}});return {api,sink,calls}}
test('disconnect/write failure does not stop awaited model and result persistence',async()=>{const f=fixture({owner},true);await f.api(request(),f.sink);assert.deepEqual(f.calls.filter(x=>['model','persist','end'].includes(x[0])).map(x=>x[0]),['model','persist','end'])})
test('untrusted authorizer claims and expired JWT are rejected before input/model',async()=>{for(const error of ['expired_jwt','invalid_signature']){const f=fixture({statusCode:401,error});const e=request();e.requestContext.authorizer={jwt:{claims:{sub:'fake',email_verified:true,'cognito:groups':['admins']}}};await f.api(e,f.sink);assert.equal(f.calls.some(x=>x[0]==='model'),false);assert.equal(f.calls.find(x=>x[0]==='start')[1],401)}})
test('unapproved CORS origin does not reach verification or model',async()=>{const f=fixture();const e=request();e.headers.origin='https://evil.invalid';await f.api(e,f.sink);assert.equal(f.calls.some(x=>x[0]==='verify'),false)})
test('4 MiB encoded body plus conservative 64 KiB headers stays below6MiB event limit',()=>{const e=request();const base=JSON.parse(e.body);const overhead=Buffer.byteLength(JSON.stringify(base))-4;base.images[0].base64='A'.repeat(MAX_STREAM_BODY_BYTES-overhead);e.body=JSON.stringify(base);e.headers.authorization='x'.repeat(65536);assert.equal(Buffer.byteLength(e.body),MAX_STREAM_BODY_BYTES);assert.ok(Buffer.byteLength(JSON.stringify(e))<MAX_STREAM_EVENT_BYTES);assert.ok(parseStreamInput(e).input);e.body+=' ';assert.equal(parseStreamInput(e).error.statusCode,413)})
test('base64 event envelopes and oversized event overhead fail closed',()=>{const e=request();e.isBase64Encoded=true;assert.equal(parseStreamInput(e).error.statusCode,413);delete e.isBase64Encoded;e.headers.extra='x'.repeat(MAX_STREAM_EVENT_BYTES);assert.equal(parseStreamInput(e).error.statusCode,413)})
test('arbitrary nested image metadata is removed before execution/archive context',()=>{const e=request({request_id:'id',images:[{base64:'eA==',media_type:'image/jpeg',copy:'secret-image'}],context:{map:'coastline',images:'secret-image',site:'x'.repeat(1000)},other:'secret-image'});const parsed=parseStreamInput(e);assert.equal(JSON.stringify(parsed.input).includes('secret-image'),false);assert.deepEqual(parsed.input.context,{map:'coastline'})})
test('status retrieval authorizes identity without admission entitlement',async()=>{let called=false;const api=createStatusApi({authorize:async(e,submit)=>{assert.equal(submit,false);return {owner}},jobs:{poll:async args=>{called=true;assert.equal(args.owner,owner);return {statusCode:200,body:{status:'completed'}}}}});const e=request();e.requestContext.http.method='GET';e.rawPath='/vod/jobs/123';assert.equal((await api(e)).statusCode,200);assert.ok(called)})

test('managed Function URL CORS emits no application access-control response headers',async()=>{
 const f=fixture();await f.api(request(),f.sink)
 const headers=f.calls.find(x=>x[0]==='start')[2]
 assert.deepEqual(Object.keys(headers).filter(k=>k.toLowerCase().startsWith('access-control-')),[])
})
test('HTTP API status retains exactly one explicit origin header',async()=>{
 const api=createStatusApi({authorize:async()=>({owner}),jobs:{poll:async()=>({statusCode:200,body:{status:'pending'}})}})
 const e=request();e.rawPath='/vod/jobs/123';e.requestContext.http.method='GET'
 assert.equal((await api(e)).headers['Access-Control-Allow-Origin'],'https://r6coaching.com')
})
