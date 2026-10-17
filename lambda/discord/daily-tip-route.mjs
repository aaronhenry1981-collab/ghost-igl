// Caller identity is enforced by IAM on the alias, not by event fields.
export function createDailyTipRoute(interactions, publish) {
  return async (event, context) => {
    if (event?.action !== 'daily-tip') return interactions(event, context)
    const httpShape = ['requestContext', 'headers', 'body', 'rawPath', 'httpMethod'].some(k => Object.hasOwn(event, k))
    if (httpShape) return interactions(event, context)
    if (context?.invokedFunctionArn !== 'arn:aws:lambda:us-east-1:183678667221:function:ghost-igl-discord-bot:daily-tip') return {status:'invalid-invocation'}
    return publish(event)
  }
}
