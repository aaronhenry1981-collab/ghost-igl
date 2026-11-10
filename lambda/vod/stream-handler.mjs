import {DynamoDBClient} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient,PutCommand,GetCommand,UpdateCommand} from '@aws-sdk/lib-dynamodb'
import {authorizeReviewJob,runVerifiedReview} from './index.mjs'
import {createStreamJobs} from './stream-jobs.mjs'
import {createStreamApi,createStatusApi} from './stream-api.mjs'
const ddb=DynamoDBDocumentClient.from(new DynamoDBClient({maxAttempts:1}))
const table=process.env.VOD_JOBS_TABLE
const conditional = error => error?.name === 'ConditionalCheckFailedException'
const store = {
  async acquireLease({ ownerKey, token, now, leaseUntil }) {
    try {
      await ddb.send(new PutCommand({ TableName: table,
        Item: { ownerKey, jobId: 'ADMISSION_LEASE', recordType: 'admissionLease', token, leaseUntil, expiresAt: Math.ceil(leaseUntil / 1000) + 3600 },
        ConditionExpression: 'attribute_not_exists(ownerKey) OR leaseUntil <= :now', ExpressionAttributeValues: { ':now': now } }))
      return true
    } catch (error) { if (conditional(error)) return false; throw error }
  },
  async releaseLease({ ownerKey, token }) {
    try {
      await ddb.send(new UpdateCommand({ TableName: table, Key: { ownerKey, jobId: 'ADMISSION_LEASE' },
        ConditionExpression: '#token = :token', UpdateExpression: 'SET leaseUntil = :released',
        ExpressionAttributeNames: { '#token': 'token' }, ExpressionAttributeValues: { ':token': token, ':released': 0 } }))
      return true
    } catch (error) { if (conditional(error)) return false; throw error }
  },
  async putJob(job) {
    try { await ddb.send(new PutCommand({ TableName: table, Item: job, ConditionExpression: 'attribute_not_exists(ownerKey)' })); return true }
    catch (error) { if (conditional(error)) return false; throw error }
  },
  async getJob(key) { return (await ddb.send(new GetCommand({ TableName: table, Key: key, ConsistentRead: true }))).Item || null },
  async claimJob({ ownerKey, jobId, now }) {
    try {
      return (await ddb.send(new UpdateCommand({ TableName: table, Key: { ownerKey, jobId },
        ConditionExpression: '#status = :pending AND deadlineAt > :now',
        UpdateExpression: 'SET #status = :running', ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':pending': 'pending', ':running': 'model_started', ':now': now }, ReturnValues: 'ALL_NEW' }))).Attributes
    } catch (error) { if (conditional(error)) return null; throw error }
  },
  async completeJob({ ownerKey, jobId, expectedStatus, patch }) {
    const names = { '#status': 'status' }, values = { ':expected': expectedStatus }, updates = []
    Object.entries(patch).forEach(([key,value],i) => { names[`#f${i}`]=key;values[`:v${i}`]=value;updates.push(`#f${i} = :v${i}`) })
    try { await ddb.send(new UpdateCommand({ TableName: table, Key: { ownerKey, jobId },
      ConditionExpression: '#status = :expected', UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: values })); return true }
    catch (error) { if (conditional(error)) return false; throw error }
  },
}

const jobs=createStreamJobs({...store,execute:(job,input)=>runVerifiedReview(job.owner,input,Math.min(job.deadlineAt,Date.now()+150000))})
const api=createStreamApi({jobs,authorize:authorizeReviewJob})
export const statusHandler=createStatusApi({jobs,authorize:authorizeReviewJob})
// Node24 Lambda response-streaming runtime. The returned promise owns all model
// and persistence work. Never detach work or end the response before it finishes.
export const handler=awslambda.streamifyResponse(async(event,responseStream)=>{
 let output=responseStream
 responseStream.on('error',()=>{})
 const sink={start:(statusCode,headers)=>{output=awslambda.HttpResponseStream.from(responseStream,{statusCode,headers});output.on('error',()=>{})},write:text=>{output.write(text)},end:()=>{output.end()}}
 await api(event,sink)
})
