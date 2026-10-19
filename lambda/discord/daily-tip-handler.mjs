// AWS adapter loads SDKs only after enabled; no secret access while disabled.
import {publishDailyTip,createBotClient} from './publisher.mjs'
export async function handler(event) {
  if(process.env.DAILY_TIP_ENABLED!=='true')return {status:'disabled'}
  const start=Date.parse(process.env.DAILY_TIP_START_AT), stop=Date.parse(process.env.DAILY_TIP_STOP_AT), now=Date.now()
  if(!Number.isFinite(start)||!Number.isFinite(stop)||stop<=start||stop-start>31*86400000||now<start||now>=stop)return {status:'outside-approved-period'}
  try{
    const {DynamoDBClient}=await import('@aws-sdk/client-dynamodb')
    const {DynamoDBDocumentClient,PutCommand,UpdateCommand}=await import('@aws-sdk/lib-dynamodb')
    const db=DynamoDBDocumentClient.from(new DynamoDBClient({maxAttempts:1}))
    const TableName=process.env.DAILY_TIP_TABLE
    const store={claim:async item=>{try{await db.send(new PutCommand({TableName,Item:item,ConditionExpression:'attribute_not_exists(#k)',ExpressionAttributeNames:{'#k':'key'}}));return true}catch(e){if(e.name==='ConditionalCheckFailedException')return false;throw e}},
      markSent:(key,messageId)=>db.send(new UpdateCommand({TableName,Key:{key},UpdateExpression:'SET #s=:s, message_id=:m',ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:{':s':'sent',':m':messageId}})),
      markUncertain:(key,diagnostic)=>db.send(new UpdateCommand({TableName,Key:{key},UpdateExpression:'SET #s=:s, diagnostic=:d',ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:{':s':'needs-review',':d':diagnostic}}))}
    const getCredential=async()=>{
      // Preferred: execute inside the existing bot Lambda; reuse its already
      // configured token without exporting, copying or creating a credential.
      if(process.env.DISCORD_BOT_TOKEN)return process.env.DISCORD_BOT_TOKEN
      throw new Error('Existing credential unavailable')
    }
    const discord=createBotClient({getToken:getCredential,channelId:process.env.DAILY_TIP_CHANNEL_ID,guildId:process.env.DAILY_TIP_GUILD_ID})
    const result=await publishDailyTip({config:{enabled:true,channelId:process.env.DAILY_TIP_CHANNEL_ID},event,store,discord})
    if(result.diagnostic)console.warn('daily-tip-diagnostic',JSON.stringify(result.diagnostic))
    return result
  }catch{return {status:'configuration-or-storage-error'}}
}
