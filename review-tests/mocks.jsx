import { useState } from 'react'
export const harness = { pending: [], delay: false, starts: 0, aborted: 0 }
const availability = () => ({ serviceEnabled: true, available: true, kind: 'pilot', endsAt: Date.now()+600_000, framesRemaining: 3, creditsRemaining: 100_000, shareMinutesRemaining: 0, aiAvailable: false })
export function useAuth() { const [user] = useState({ id: 'synthetic-only' }); return { user, isAdmin: true, loading: false } }
export function liveRequest(path, body, signal) {
  if (path === '/history') return Promise.resolve({ sessions: [] })
  if (path === '/status') {
    if (!harness.delay) return Promise.resolve(availability())
    // Intentionally ignore abort completion: prove stale promises cannot change a new operation.
    signal?.addEventListener('abort', () => harness.aborted++)
    return new Promise(resolve => harness.pending.push(() => resolve(availability())))
  }
  throw new Error('Unexpected API call in local page test: '+path)
}
export const liveRequestId = () => 'synthetic-request'
export function createGameplayCapture() {
  let stream=null,confirmed=false
  return { stop(){stream?.getTracks().forEach(t=>t.stop());stream=null;confirmed=false}, current:()=>({stream,confirmed,kind:'capture-card'}),confirm(){confirmed=true}, async choose(){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;canvas.getContext('2d').fillRect(0,0,640,360);stream=canvas.captureStream(15);return stream}, async inspectCards(){return {cards:[]}} }
}
export const createAnalysisLoop = () => { throw new Error('AI must not start') }
export const frameFromVideo = () => { throw new Error('AI frame must not be read') }
export function createGameplayRecorder({ onState, onRelease }) { let running=false; return {start(){running=true;harness.starts++;onState({phase:'recording',seconds:0,bytes:0})},stop(){if(running){running=false;onState({phase:'idle'});onRelease()}},discard(){running=false}} }
