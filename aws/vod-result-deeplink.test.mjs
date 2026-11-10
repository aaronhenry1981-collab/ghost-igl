import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import vm from 'node:vm'
import {metaForPath,allRoutePaths} from '../src/config/routeMeta.js'
const ctx={};vm.runInNewContext(readFileSync(new URL('./cloudfront-site-router.js',import.meta.url),'utf8')+'\nthis.run=handler',ctx)
test('fresh result deep link maps to generated private shell',()=>{
 const response=ctx.run({request:{uri:'/vod/results',querystring:{}}})
 assert.equal(response.uri,'/_shell/vod/results.html')
 assert.ok(allRoutePaths().includes('/vod/results'))
 assert.equal(metaForPath('/vod/results').noindex,true)
 if(process.env.REQUIRE_BUILT_SHELL==='1'){
 const shell=new URL('../dist/_shell/vod/results.html',import.meta.url)
 assert.ok(existsSync(shell))
 const html=readFileSync(shell,'utf8');assert.match(html,/noindex/);assert.match(html,/Existing Screenshot Review Result/);assert.match(html,/https:\/\/r6coaching.com\/vod\/results/)
 }
})
test('trailing slash redirects to known result route, unknown children stay 404',()=>{
 assert.equal(ctx.run({request:{uri:'/vod/results/',querystring:{}}}).statusCode,301)
 assert.equal(ctx.run({request:{uri:'/vod/results/unknown',querystring:{}}}).uri,'/vod/results/unknown')
})
