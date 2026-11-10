import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {CognitoJwtVerifier} from 'aws-jwt-verify'
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048})
const jwk={...publicKey.export({format:'jwk'}),kid:'offline',use:'sig',alg:'RS256'}
const verifier=CognitoJwtVerifier.create({userPoolId:'us-east-1_offline',clientId:'offline-client',tokenUse:'id'})
verifier.cacheJwks({keys:[jwk]})
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url')
function token(exp=Math.floor(Date.now()/1000)+600){const h=encode({alg:'RS256',kid:'offline'}),p=encode({sub:'owner',email:'owner@test.invalid',email_verified:true,'cognito:groups':['admins'],iss:'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_offline',aud:'offline-client',token_use:'id',iat:Math.floor(Date.now()/1000)-20,exp});return `${h}.${p}.${sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url')}`}
const src=readFileSync(new URL('./index.mjs',import.meta.url),'utf8');const fn=src.slice(src.indexOf('export async function authorizeReviewJob'),src.indexOf('export { buildHeaders }')).replace('export ','');const ctx=vm.createContext({verifier,VOD_AI_ENABLED:true});vm.runInContext(fn,ctx)
test('actual cryptographic Cognito verifier accepts signed fixture and rejects expiry/signature/forged authorizer',async()=>{
 assert.ok((await ctx.authorizeReviewJob({headers:{authorization:'Bearer '+token()}},false)).owner)
 for(const jwt of [token(Math.floor(Date.now()/1000)-600),token().slice(0,-8)+'AAAAAAAA','']){
 const response=await ctx.authorizeReviewJob({headers:{authorization:'Bearer '+jwt},requestContext:{authorizer:{jwt:{claims:{sub:'fake',email:'fake@test.invalid',email_verified:true}}}}},false)
 assert.equal(response.statusCode,401);assert.equal(response.owner,undefined)
 }
})
