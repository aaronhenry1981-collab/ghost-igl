export function assertTestEvent(event) {
  if (event?.livemode !== false) throw new Error('Sandbox refused an event without livemode=false')
}
export function hasExpectedEvents(events, types, subscriptionId) {
  return types.every(type => events.some(event => {
    const object = event.data?.object
    return event.type === type && (!subscriptionId || object?.id === subscriptionId ||
      object?.subscription === subscriptionId || object?.parent?.subscription_details?.subscription === subscriptionId)
  }))
}
