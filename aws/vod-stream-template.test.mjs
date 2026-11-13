import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import yaml from 'js-yaml'
const types=['Ref','Sub','GetAtt'].map(tag=>new yaml.Type('!'+tag,{kind:'scalar',construct:value=>value})).concat(['If','Equals','Not'].map(tag=>new yaml.Type('!'+tag,{kind:'sequence',construct:value=>value})))
const source=readFileSync(new URL('./vod-stream-template.yaml',import.meta.url),'utf8')
const template=yaml.load(source,{schema:yaml.DEFAULT_SCHEMA.extend(types)})
test('streaming stack contains no screenshot persistence or async worker resources',()=>{
 assert.doesNotMatch(source,/AWS::S3|s3:|VOD_INPUT_BUCKET|StreamSpecification|AWS::SQS|InvocationType/)
 assert.equal(template.Globals.Function.Runtime,'nodejs24.x')
 assert.equal(template.Resources.StreamUrl.Properties.InvokeMode,'RESPONSE_STREAM')
 assert.equal(template.Resources.StreamFunction.Properties.Timeout,180)
 assert.equal(template.Resources.StreamFunction.Properties.ReservedConcurrentExecutions,2)
 assert.deepEqual(template.Resources.StreamUrl.Properties.Cors.AllowOrigins,['https://r6coaching.com','https://www.r6coaching.com'])
 assert.equal(template.Resources.StreamUrlPermission.Properties.FunctionUrlAuthType,'NONE')
 assert.equal(template.Resources.StreamInvokePermission.Properties.InvokedViaFunctionUrl,true)
 const status=template.Resources.ApiFunction.Properties.Policies[0].Statement
 assert.equal(status.length,1);assert.deepEqual(status[0].Action,['dynamodb:GetItem','dynamodb:UpdateItem'])
})
