// Executes a confirmed deletion plan (plan.mjs). Called only by the CLI after
// it re-collected the data, re-built the plan, checked the plan id and the
// typed confirmation, and found no blockers. Cognito accounts go last so a
// failure part-way leaves the person able to sign in and ask again.
import { DeleteCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { randomUUID } from 'node:crypto'
import { reviewArchiveHash } from './sources.mjs'

export async function applyDeletionPlan({ plan, ddb, cognito, userPoolId, actor, auditTable = 'ghost-igl-audit-log', now = () => new Date() }) {
  if (plan.blockers.length) throw new Error(`plan is blocked: ${plan.blockers.join('; ')}`)
  const done = { delete: 0, anonymize: 0, cognitoDelete: 0, failed: 0 }
  const ordered = [...plan.actions.filter((a) => a.op !== 'cognito-delete'), ...plan.actions.filter((a) => a.op === 'cognito-delete')]
  for (const a of ordered) {
    try {
      if (a.op === 'delete') {
        await ddb.send(new DeleteCommand({ TableName: a.table, Key: a.key }))
        done.delete += 1
      } else if (a.op === 'anonymize') {
        const names = Object.fromEntries(a.remove.map((f, i) => [`#r${i}`, f]))
        await ddb.send(new UpdateCommand({ TableName: a.table, Key: a.key, UpdateExpression: `REMOVE ${Object.keys(names).join(', ')}`, ExpressionAttributeNames: names }))
        done.anonymize += 1
      } else if (a.op === 'cognito-delete') {
        await cognito.send(new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: a.username }))
        done.cognitoDelete += 1
      }
    } catch (err) {
      done.failed += 1
      console.error(`FAILED ${a.op} ${a.table || 'cognito'}: ${err?.name || 'Error'}`)
    }
  }
  // The audit entry names the request by hash only, never the email.
  await ddb.send(new PutCommand({
    TableName: auditTable,
    Item: { id: randomUUID(), timestamp: now().toISOString(), actor: actor || 'privacy-tool', action: 'privacy.delete', target: `email_hash:${reviewArchiveHash(plan.email)}`, details: { planId: plan.planId, counts: plan.counts, result: done } },
  }))
  return done
}
