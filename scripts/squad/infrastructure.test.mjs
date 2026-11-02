import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const template = JSON.parse(readFileSync(new URL('../../aws/squad-preview.template.json', import.meta.url)))
const resources = template.Resources, values = Object.values(resources), role = resources.SquadRole.Properties
test('infrastructure creates only the separate squad boundary and retains both data tables', () => {
  assert.equal(values.length, 42)
  const tables = values.filter(value => value.Type === 'AWS::DynamoDB::Table')
  assert.deepEqual(tables.map(value => value.Properties.TableName).sort(), ['recon-squad-grants', 'recon-squad-state'])
  assert.ok(tables.every(value => value.DeletionPolicy === 'Retain' && value.UpdateReplacePolicy === 'Retain' && value.Properties.SSESpecification.SSEEnabled))
  assert.equal(values.some(value => value.Type.includes('Secret') || value.Type.includes('Cognito') || value.Type === 'AWS::S3::Bucket'), false)
  assert.equal(resources.SquadFunction.Properties.Environment.Variables.GRANTS_TABLE.Ref, 'SquadGrantsTable')
})
test('app role can check hosting grants but explicitly cannot mutate them or access existing billing/CRM tables', () => {
  const statements = role.Policies[0].PolicyDocument.Statement, grantArn = 'arn:aws:dynamodb:us-east-1:183678667221:table/recon-squad-grants'
  const deny = statements.find(value => value.Sid === 'DenyAllOtherHostingGrantAccess')
  assert.equal(deny.Effect, 'Deny'); assert.equal(deny.Resource, grantArn); assert.deepEqual(deny.NotAction, ['dynamodb:GetItem', 'dynamodb:ConditionCheckItem'])
  const writes = statements.find(value => value.Sid === 'WriteOnlyTransactionalSquadState')
  assert.equal(writes.Resource, 'arn:aws:dynamodb:us-east-1:183678667221:table/recon-squad-state')
  assert.equal(writes.Condition.StringEquals['dynamodb:EnclosingOperation'], 'TransactWriteItems')
  assert.equal(JSON.stringify(statements).includes('dynamodb:TransactWriteItems'), false)
  assert.equal(statements.some(value => JSON.stringify(value.Resource).includes('subscription') || JSON.stringify(value.Resource).includes('customer-success')), false)
  assert.equal(JSON.stringify(statements).includes('iam:'), false)
})
test('all ten HTTP routes use existing-account JWT, managed CORS and exact prod invocation permissions', () => {
  const routes = values.filter(value => value.Type === 'AWS::ApiGatewayV2::Route' && value.Properties.ApiId.Ref === 'SquadHttpApi')
  assert.equal(routes.length, 10); assert.ok(routes.every(value => value.Properties.AuthorizationType === 'JWT' && value.Properties.AuthorizerId.Ref === 'SquadJwtAuthorizer'))
  assert.equal(routes.some(value => value.Properties.RouteKey.startsWith('OPTIONS')), false)
  assert.deepEqual(resources.SquadHttpApi.Properties.CorsConfiguration.AllowMethods, ['GET', 'POST', 'PUT'])
  assert.deepEqual(resources.SquadJwtAuthorizer.Properties.JwtConfiguration.Audience, ['5bpa1cteenctoue24v4e245re8'])
  const permissions = values.filter(value => value.Type === 'AWS::Lambda::Permission')
  assert.equal(permissions.length, 13)
  assert.ok(permissions.every(value => value.Properties.SourceAccount === '183678667221' && value.Properties.Principal === 'apigateway.amazonaws.com' && value.Properties.FunctionName.Ref === 'SquadAlias'))
  assert.ok(permissions.every(value => value.Properties.SourceArn['Fn::Sub'][0].split('${Api}/')[1]?.startsWith('prod/')))
})
test('template seeds no grant, never imports existing APIs and permits only new socket management', () => {
  assert.equal(values.some(value => /CustomResource|Custom::/.test(value.Type)), false)
  assert.equal(JSON.stringify(template).includes('u0k402df6j'), false); assert.equal(JSON.stringify(template).includes('gc3tzbeeoi'), false)
  const statements = role.Policies[0].PolicyDocument.Statement, manage = statements.find(value => value.Sid === 'ManageOnlyThisVoiceFreeSocketApi')
  assert.equal(manage.Resource.length, 2)
  assert.ok(manage.Resource.every(value => value['Fn::Sub'][1].Api.Ref === 'SquadWsApi' && /\/prod\/(POST|DELETE)\/@connections\/\*/.test(value['Fn::Sub'][0])))
  assert.equal(resources.SquadHttpStage.Properties.DefaultRouteSettings.ThrottlingRateLimit, 5)
})
