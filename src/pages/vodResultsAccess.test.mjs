import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
test('dedicated results route remains outside membership gate',()=>{
 const main=read('../main.jsx')
 const route=main.split('\n').find(line=>line.includes("path: '/vod/results'"))
 assert.ok(route?.includes('<VodResultsPage />'))
 assert.ok(!route.includes('MembershipGate'))
 const page=read('./VodResultsPage.jsx')
 assert.match(page,/if \(!user\)/)
 assert.match(page,/onClick=\{resumeReview\}/)
 assert.doesNotMatch(page,/isPro|canAnalyze|MembershipGate|SessionUploadZone|analyzeSession/)
})
test('existing review link is outside paid submission condition',()=>{
 const page=read('./VodPage.jsx')
 assert.match(page,/\{user && <a href="\/vod\/results">/)
 assert.match(page,/isAdmin \|\| \(isPro && account\?\.strategy_only_catalog !== true\)/)
})
