import { createHash } from 'node:crypto'
import { TIPS } from './tips.mjs'
export const TIMEZONE = 'America/New_York'
export function localTime(date) {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid scheduled time')
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]))
  return {day:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour),minute:Number(p.minute)}
}
export function preview(scheduledTime) {
  const local=localTime(new Date(scheduledTime))
  const offset=Math.floor(Date.parse(local.day+'T00:00:00Z')/86400000)
  const tip=TIPS[((offset%TIPS.length)+TIPS.length)%TIPS.length]
  const content=`**Daily Siege drill — ${tip.title}**\n${tip.drill}\n**Check:** ${tip.check}`
  if(content.length>1800||/@everyone|@here|<@/i.test(content))throw new Error('Unsafe curated content')
  return {day:local.day,tipId:tip.id,content,allowed_mentions:{parse:[]},tts:false}
}

// store: atomic claim once, markSent, markUncertain. No tokens/URLs in journal.
// discord: checks exact channel before posting; returns confirmed message ID.
export async function publishDailyTip({config,event,store,discord,now=new Date()}) {
  if(!config.enabled)return {status:'disabled'}
  if(!/^\d{15,22}$/.test(config.channelId||''))return {status:'invalid-configuration'}
  if(event?.action!=='daily-tip')return {status:'invalid-trigger'}
  let scheduled,local,current,post
  try{scheduled=new Date(event.scheduledTime);local=localTime(scheduled);current=localTime(now);post=preview(event.scheduledTime)}catch{return {status:'invalid-trigger'}}
  const lateness=now.getTime()-scheduled.getTime()
  if(local.hour!==12||local.minute!==0||local.day!==current.day||lateness<0||lateness>10*60000)return {status:'outside-window'}
  if(event.dryRun===true)return {status:'dry-run',...post}
  const key=`${config.channelId}:${local.day}`
  const hash=createHash('sha256').update(post.content).digest('hex')
  // Claim BEFORE all outbound Discord work. Retries never send twice even if
  // Discord accepted a POST but the caller lost its response or DB receipt write.
  let claimed
  try{claimed=await store.claim({key,day:local.day,tipId:post.tipId,contentHash:hash,status:'claimed'})}catch{return {status:'storage-unavailable'}}
  if(!claimed)return {status:'already-claimed',day:local.day}
  try{
    await discord.verifyChannel(config.channelId)
    const receipt=await discord.send({content:post.content,allowed_mentions:post.allowed_mentions,tts:false},key)
    if(receipt?.channel_id!==config.channelId||!/^\d{15,22}$/.test(receipt?.id||''))throw new Error('Invalid receipt')
    await store.markSent(key,receipt.id)
    return {status:'sent',day:local.day,messageId:receipt.id,tipId:post.tipId}
  }catch{
    // Persist only a generic state. An ambiguous POST is never auto-retried.
    try{await store.markUncertain(key)}catch{}
    return {status:'needs-review',day:local.day}
  }
}

export function createBotClient({getToken,channelId,guildId,fetchImpl=globalThis.fetch}) {
  if(!/^\d{15,22}$/.test(channelId||'')||!/^\d{15,22}$/.test(guildId||''))throw new Error('Invalid destination')
  let token
  async function request(method,payload) {
    token ||= await getToken()
    if(typeof token!=='string'||!token.trim()||/[\r\n]/.test(token))throw new Error('Bot configuration unavailable')
    const url=`https://discord.com/api/v10/channels/${channelId}${method==='POST'?'/messages':''}`
    const res=await fetchImpl(url,{method,redirect:'error',signal:AbortSignal.timeout(8000),headers:{Authorization:`Bot ${token}`,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})})
    if(!res.ok)throw new Error('Discord request failed')
    const reader=res.body.getReader();let size=0;const chunks=[]
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw new Error('Response exceeded limit');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  return {verifyChannel:async id=>{if(id!==channelId)throw new Error('Wrong destination');const channel=await request('GET');if(channel.id!==channelId||channel.guild_id!==guildId||channel.type!==0)throw new Error('Wrong channel')},
    send:(payload,key)=>request('POST',{...payload,nonce:createHash('sha256').update(key).digest('hex').slice(0,24),enforce_nonce:true})}
}

export function createWebhookClient({getUrl,fetchImpl=globalThis.fetch}) {
  let url
  async function request(method,payload) {
    if(!url){url=new URL(await getUrl());if(url.protocol!=='https:'||url.hostname!=='discord.com'||url.port||url.username||url.password||url.search||url.hash||!/^\/api(?:\/v10)?\/webhooks\/\d{15,22}\/[A-Za-z0-9._-]+$/.test(url.pathname))throw new Error('Webhook configuration rejected')}
    const target=new URL(url);if(method==='POST')target.searchParams.set('wait','true')
    const res=await fetchImpl(target.toString(),{method,redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})})
    if(!res.ok)throw new Error('Discord request failed')
    // Bound response parsing and never log raw errors or response content.
    const reader=res.body.getReader();let size=0;const chunks=[]
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw new Error('Response exceeded limit');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  return {verifyChannel:async id=>{const meta=await request('GET');if(meta.channel_id!==id||meta.type!==1)throw new Error('Wrong webhook destination')},send:payload=>request('POST',payload)}
}
