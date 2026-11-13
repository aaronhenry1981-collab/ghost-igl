import test from 'node:test'
import assert from 'node:assert/strict'
import {resolveVodStreamConfig} from './vodStreamConfig.mjs'
test('enabled streaming fails closed for missing or unsafe URL',()=>{for(const url of ['', 'http://abc.lambda-url.us-east-1.on.aws/','https://evil.invalid/','https://abc.lambda-url.us-east-1.on.aws/?token=x'])assert.throws(()=>resolveVodStreamConfig('true',url))})
test('streaming URL is explicit fixed regional deployment URL',()=>{assert.equal(resolveVodStreamConfig('true','https://abc.lambda-url.us-east-1.on.aws/'),'https://abc.lambda-url.us-east-1.on.aws');assert.equal(resolveVodStreamConfig(undefined,undefined),'')})
