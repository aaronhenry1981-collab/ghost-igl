// Missing historical form metadata is not a denial or proof of permission.
export function testimonialReviewPresentation(item) {
  const customer = item.record_type === 'customer_submission'
  const permission = (value, photo = false) => {
    if (value === true) return 'Yes'
    if (value === false) return customer && !photo ? 'No - private feedback only' : 'No'
    return customer ? 'Not recorded - publication unavailable' : 'Not recorded (legacy admin entry)'
  }
  return {
    quotePermission: permission(item.quote_consent),
    photoPermission: permission(item.photo_consent, true),
    recorded: item.consent_at || 'Not recorded',
    legacyNotice: customer ? null : 'Legacy/manual quote. Customer-form consent was not required by the original admin workflow. Check the original permission separately before republishing; this screen does not establish it.',
    publishDisabled: customer ? item.quote_consent !== true || !['pending', 'approved'].includes(item.status) : item.quote_consent === false,
    publishAction: customer ? 'approve' : 'publish',
    publishPrompt: customer ? `Publish the exact permitted quote from ${item.name}?` : `Republish the legacy quote from ${item.name}? Confirm you have checked the original permission before continuing.`,
    publishSuccess: customer ? 'Published with recorded permission.' : 'Legacy quote publication updated.',
  }
}
