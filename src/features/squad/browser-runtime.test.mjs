import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createContext,runInContext} from 'node:vm'
const body=readFileSync(new URL('./browser-runtime.mjs',import.meta.url),'utf8')
test('standalone browser bootstrap provides the existing website SDK compatibility aliases',()=>{
 const context=createContext({});assert.equal(runInContext('typeof global',context),'undefined');runInContext(body,context)
 assert.equal(runInContext('global === globalThis',context),true);assert.equal(runInContext('typeof process.env',context),'object')
 assert.equal(runInContext('typeof require',context),'undefined');assert.equal(runInContext('typeof Buffer',context),'undefined')
})
test('bootstrap is idempotent and never replaces existing globals/environment values',()=>{
 const global={existing:true},process={env:{NODE_ENV:'fixture',retained:'unchanged'}};const context=createContext({global,process});runInContext(body,context);runInContext(body,context)
 assert.equal(context.global,global);assert.equal(context.process,process);assert.deepEqual(process.env,{NODE_ENV:'fixture',retained:'unchanged'})
})
test('bootstrap neither reads storage/identity nor invokes any network or media capability',()=>{
 const forbidden=()=>{throw Error('Unexpected capability use')},context=createContext({fetch:forbidden,localStorage:new Proxy({},{get:forbidden}),navigator:new Proxy({},{get:forbidden})});runInContext(body,context);assert.equal(runInContext('global === globalThis',context),true)
})
test('compatibility bootstrap is the first standalone entry import before shared SDK can load',()=>{
 const entry=readFileSync(new URL('./demo-entry.jsx',import.meta.url),'utf8');assert.equal(entry.split(/\r?\n/)[0],"import './browser-runtime.mjs'")
})
