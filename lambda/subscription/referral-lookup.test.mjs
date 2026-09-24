import test from 'node:test'
import assert from 'node:assert/strict'
import { findReferralProfile } from './referral-lookup.mjs'
test('finds a code after an empty filtered page',async()=>{
 const calls=[];const match={referral_code:'valid-code',email:'test@example.invalid'}
 const result=await findReferralProfile(async input=>{calls.push(input);return calls.length===1?{Items:[],LastEvaluatedKey:{email:'cursor'}}:{Items:[match]}},'profiles','valid-code')
 assert.deepEqual(result,match);assert.deepEqual(calls[1].ExclusiveStartKey,{email:'cursor'})
})
test('stops once matching profile is found',async()=>{
 let count=0;await findReferralProfile(async()=>{count++;return {Items:[{referral_code:'ok'}],LastEvaluatedKey:{email:'more'}}},'profiles','ok');assert.equal(count,1)
})
test('returns null only when all pages are exhausted',async()=>{
 let count=0;const found=await findReferralProfile(async()=>++count===1?{LastEvaluatedKey:{email:'next'}}:{Items:[]},'profiles','absent');assert.equal(found,null);assert.equal(count,2)
})
test('propagates database errors instead of claiming code is invalid',async()=>{
 await assert.rejects(findReferralProfile(async()=>{throw Error('database unavailable')},'profiles','code'),/database unavailable/)
})
