export const MAX_STREAM_BODY_BYTES = 4 * 1024 * 1024
export const MAX_STREAM_EVENT_BYTES = 6 * 1024 * 1024
export const STREAM_ORIGINS = ['https://r6coaching.com', 'https://www.r6coaching.com']
const response = (statusCode, error) => ({statusCode,body:{error}})
export function parseStreamInput(event) {
  if (event.isBase64Encoded || typeof event.body !== 'string' || Buffer.byteLength(event.body) > MAX_STREAM_BODY_BYTES || Buffer.byteLength(JSON.stringify(event)) > MAX_STREAM_EVENT_BYTES) return {error:response(413,'screenshot_batch_too_large')}
  let raw
  try {raw=JSON.parse(event.body)} catch {return {error:response(400,'invalid_json')}}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.images) || raw.images.length<1 || raw.images.length>10 || raw.images.some(x=>!x || typeof x.base64!=='string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(x.base64) || !['image/jpeg','image/png','image/webp','image/gif'].includes(x.media_type))) return {error:response(400,'invalid_screenshots')}
  const input={images:raw.images.map(x=>({base64:x.base64,media_type:x.media_type}))}
  // Only bounded textual hints enter existing model/archive context. Ignore arbitrary
  // properties (including image-bearing fields); input bytes never enter receipt storage.
  const context={}
  for(const field of ['map','site','side','operator','character']) if(typeof raw.context?.[field]==='string' && /^[\p{L}\p{N} _/()'-]{1,80}$/u.test(raw.context[field])) context[field]=raw.context[field]
  if(Object.keys(context).length) input.context=context
  if(typeof raw.game_id==='string' && /^[a-z0-9_-]{1,24}$/.test(raw.game_id)) input.game_id=raw.game_id
  if(raw.analysis_type==='rank_snapshot'||raw.analysis_type==='vod_review') input.analysis_type=raw.analysis_type
  return {input,idempotencyKey:raw.request_id}
}
export function streamHeaders(event, origins=STREAM_ORIGINS) {
  const origin=event.headers?.origin||event.headers?.Origin
  return {'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type',...(origins.includes(origin)?{'Access-Control-Allow-Origin':origin}:{})}
}
export function createStreamApi({jobs,authorize,origins=STREAM_ORIGINS}) {
  return async function handle(event,sink) {
    // Function URL managed CORS owns response access-control headers.
    // Adding them here duplicates AWS headers and breaks browser POST responses.
    const headers={'Content-Type':'application/json','Cache-Control':'no-store'}
    let started=false
    // A disconnected stream is not an execution/cancellation signal. All work below
    // is awaited, even when every client write fails. No event/input/error logging.
    const send=(value,stream=false)=>{try{if(!started){sink.start(stream?200:value.statusCode,{...headers,...(stream?{'Content-Type':'application/x-ndjson'}:{})});started=true}sink.write(JSON.stringify(stream?value:value.body)+'\n')}catch{/* Lost connection must not lose the durable result. */}}
    try {
      const origin=event.headers?.origin||event.headers?.Origin
      if(origin&&!origins.includes(origin)){send(response(403,'origin_not_allowed'));return}
      const method=event.requestContext?.http?.method
      if(method==='OPTIONS'){send({statusCode:200,body:{}});return}
      if(method!=='POST'||!(event.rawPath||'').endsWith('/vod/analyze')){send(response(404,'not_found'));return}
      // Uses actual Cognito signature/issuer/audience/expiry verification; never
      // event.requestContext.authorizer, which is untrusted on a public Function URL.
      const auth=await authorize(event,true)
      if(!auth.owner){send({statusCode:auth.statusCode,body:{error:auth.error}});return}
      const parsed=parseStreamInput(event)
      if(parsed.error){send(parsed.error);return}
      const outcome=await jobs.submit({owner:auth.owner,...parsed,emit:frame=>send(frame,true)})
      if(!started)send(outcome)
    }catch{if(!started)send(response(503,'review_status_unavailable'))}
    finally{try{sink.end()}catch{/* Execution and durability already awaited. */}}
  }
}
export function createStatusApi({jobs,authorize,origins=STREAM_ORIGINS}) {
 return async event=>{
  const headers=streamHeaders(event,origins),reply=value=>({...value,headers,body:JSON.stringify(value.body||{error:value.error})})
  const origin=event.headers?.origin||event.headers?.Origin
  if(origin&&!origins.includes(origin))return reply(response(403,'origin_not_allowed'))
  if(event.requestContext?.http?.method==='OPTIONS')return reply({statusCode:200,body:{}})
  // HTTP API named stages can remain in rawPath. Strip only the exact trusted
  // request-context stage prefix; custom-domain/default-stage paths need none.
  const stage=event.requestContext?.stage
  let path=typeof event.rawPath==='string'?event.rawPath:''
  if(typeof stage==='string'&&/^[A-Za-z0-9_-]+$/.test(stage)&&path.startsWith('/'+stage+'/'))path=path.slice(stage.length+1)
  const route=/^\/vod\/jobs\/([^/]+)$/.exec(path)
  if(event.requestContext?.http?.method!=='GET'||!route)return reply(response(404,'not_found'))
  try{const auth=await authorize(event,false);if(!auth.owner)return reply(auth);return reply(await jobs.poll({owner:auth.owner,idempotencyKey:route[1]}))}catch{return reply(response(503,'review_status_unavailable'))}
 }
}
