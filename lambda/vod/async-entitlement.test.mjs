import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const source = readFileSync(new URL('./index.mjs', import.meta.url),'utf8')
const admission = source.slice(source.indexOf('export async function authorizeReviewJob'),source.indexOf('export { buildHeaders }')).replace('export ','')
const worker = source.slice(source.indexOf('export async function handler('),source.indexOf('async function getActiveSub(')).replace('export ','')
for (const strategy of [true,false,undefined]) for (const admin of [true,false]) test(`admission strategy=${strategy} admin=${admin}`,async()=>{
 const sub={status:'active',plan:'pro',strategy_only_catalog:strategy}
 const ctx=vm.createContext({VOD_AI_ENABLED:true,verifier:{verify:async()=>({sub:'owner',email:'owner@test.invalid',email_verified:true,'cognito:groups':admin?['admins']:[]})},getActiveSub:async()=>sub,effectivePlan:s=>s.plan})
 vm.runInContext(admission,ctx)
 assert.equal(!!(await ctx.authorizeReviewJob({headers:{}})).owner,admin||strategy!==true)
 assert.ok((await ctx.authorizeReviewJob({headers:{}},false)).owner,'result retrieval is auth-only')
})
test('strategy-only worker cannot reach reservation, parsing, or inference',async()=>{
 const ctx=vm.createContext({REVIEW_REQUEST_BUDGET_MS:24000,buildHeaders:()=>({}),VOD_AI_ENABLED:true,verifier:{verify:async()=>({sub:'owner',email:'owner@test.invalid',email_verified:true})},getActiveSub:async()=>({status:'active',plan:'pro',strategy_only_catalog:true}),effectivePlan:s=>s.plan})
 vm.runInContext(worker,ctx)
 const result=await ctx.handler({headers:{authorization:'Bearer test'},body:'{}'})
 assert.equal(result.statusCode,402)
})
