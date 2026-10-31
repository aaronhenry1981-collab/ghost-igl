import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import HostedCoachPage from '../src/pages/HostedCoachPage.jsx'
import { harness } from './mocks.jsx'
const root=createRoot(document.getElementById('root')), results=document.getElementById('results')
const tick=()=>new Promise(resolve=>setTimeout(resolve,30))
const button=text=>[...document.querySelectorAll('#root button')].find(b=>b.textContent===text)
const consent=()=>document.querySelector('#root .hosted-check input')
const check=(value,message)=>{if(!value)throw new Error(message)}
let hidden=false
Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden})
const show=value=>{hidden=!value;document.dispatchEvent(new Event('visibilitychange'))}
async function settle(){for(let i=0;i<5;i++)await tick()}
async function select(){button('Choose game / Elgato preview window').click();await settle();check(consent(),'source preview did not mount');consent().click();await settle()}
async function start(){button('Start local recording').click();await settle();check(button('Start local recording').disabled,'pending start should be busy')}
async function reset(key){harness.delay=false;root.render(<MemoryRouter><HostedCoachPage key={key}/></MemoryRouter>);await settle();harness.pending=[];harness.starts=0;harness.delay=true;await select()}
document.getElementById('run').onclick=async()=>{
  results.textContent='Running rendered page tests';harness.aborted=0
  const passed=[]
  try {
    await reset('hide');await start();show(false);await settle();show(true);harness.pending.shift()();await settle();check(harness.starts===0,'hidden pending start recorded');check(!button('Start local recording').disabled,'hide left controls busy');passed.push('hide cancels delayed start even after visibility restored')
    await reset('consent');await start();consent().click();await settle();harness.pending.shift()();await settle();check(harness.starts===0,'withdrawn consent recorded');check(!button('Choose game / Elgato preview window').disabled,'consent cancel left busy');passed.push('uncheck cancels delayed start and resets operation state')
    await reset('restart');await start();const old=harness.pending.shift();button('Stop sharing and coaching').click();await settle();check(!button('Choose game / Elgato preview window').disabled,'Stop left source controls busy');await select();await start();const current=harness.pending.shift();old();await settle();check(harness.starts===0,'stale request started recorder');check(button('Start local recording').disabled,'stale completion cleared newer busy state');current();await settle();check(harness.starts===1,'new request did not start exactly once');passed.push('Stop/reselect/restart survives old response; old finally cannot unlock new request')
    button('Stop recording and capture').click();await settle()
    await reset('recheck');await start();hidden=true;harness.pending.shift()();await settle();check(harness.starts===0,'final visibility recheck failed');show(true);passed.push('visibility rechecked immediately before start without relying on event')
    check(harness.aborted>=3,'canceled requests were not aborted')
    results.textContent=JSON.stringify({result:'PASS',tests:passed,abortedRequests:harness.aborted,realCapture:false,realApiCalls:0},null,2)
  }catch(error){results.textContent=JSON.stringify({result:'FAIL',passed,error:error.message},null,2)}
}
root.render(<MemoryRouter><HostedCoachPage/></MemoryRouter>)
