import test from 'node:test'
import assert from 'node:assert/strict'
import { createCoachSpeech } from './speech.mjs'
function fixture(voices = [{ localService:true,lang:'en-US',name:'Local voice' }]) {
  let time=1000,cancels=0,timer
  const spoken=[],status=[]
  const speech=createCoachSpeech({synthesis:{getVoices:()=>voices,speak:line=>spoken.push(line),cancel:()=>cancels++},utterance:text=>({text}),now:()=>time,
    schedule:fn=>{timer=fn;return 1},cancel:()=>{},onStatus:value=>status.push(value)})
  return {speech,spoken,status,cancels:()=>cancels,tick:ms=>{time+=ms},expire:()=>timer?.()}
}
test('speech is silent until explicit opt-in and never uses a remote/default fallback',()=>{
  const f=fixture();assert.equal(f.speech.speak('Drone before entering.',1000),false);assert.equal(f.spoken.length,0)
  const remote=fixture([{localService:false,lang:'en-US'}]);assert.equal(remote.speech.enable(),false);assert.equal(remote.speech.test(),false)
  assert.equal(remote.spoken.length,0)
})
test('local voice speaks a short fresh action; mute clears speech immediately',()=>{
  const f=fixture();assert.equal(f.speech.enable(),true);f.speech.speak('Drone before entering. A doorway is visible.',1000)
  assert.equal(f.spoken[0].text,'Drone before entering.');assert.equal(f.spoken[0].voice.localService,true)
  f.spoken[0].onstart();assert.equal(f.status.at(-1),'speaking');f.speech.mute()
  assert.equal(f.cancels(),1);assert.equal(f.status.at(-1),'off');assert.equal(f.speech.speak('Late response.',1000),false)
})
test('Stop invalidates queued callbacks; fresh advice replaces old rather than queueing',()=>{
  const f=fixture();f.speech.enable();f.speech.speak('Drone this doorway.',1000);const old=f.spoken[0]
  f.speech.speak('Keep your crosshair at head height.',1000);assert.equal(f.cancels(),1)
  f.speech.stop();old.onstart();old.onend();assert.equal(f.status.at(-1),'off');assert.equal(f.cancels(),2)
})
test('stale and duplicate lines are suppressed and speech has a freshness deadline',()=>{
  const f=fixture();f.speech.enable();f.speech.speak('Drone before entry.',1000)
  assert.equal(f.speech.speak('Drone before entry.',1000),false)
  f.expire();assert.equal(f.cancels(),1)
  f.tick(9000);assert.equal(f.speech.speak('Old action.',1000),false)
  assert.equal(f.spoken.length,1)
})
