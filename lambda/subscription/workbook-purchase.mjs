import crypto from 'node:crypto'

export function normalizePurchaseEmail(value) {
  return String(value || '').trim().toLowerCase()
}
export function workbookIntegrationIdentifier() {
  const suffix = crypto.randomBytes(8).toString('base64url').replace(/[^a-z]/gi, '').slice(0, 8).toLowerCase()
  return `recon6_workbook_${suffix.padEnd(8, 'x')}`
}

export function validateWorkbookPurchase({ session, lineItems, accountEmail, expectedPriceId }) {
  if (!session?.id || session.mode !== 'payment') {
    return { ok: false, error: 'This is not a workbook payment session.' }
  }
  if (!['paid', 'no_payment_required'].includes(session.payment_status)) {
    return { ok: false, error: 'Workbook payment is not complete.' }
  }
  if (session.metadata?.kind !== 'beginner_workbook') {
    return { ok: false, error: 'This checkout is not a workbook purchase.' }
  }

  const expectedEmail = normalizePurchaseEmail(accountEmail)
  const sessionEmail = normalizePurchaseEmail(
    session.customer_details?.email || session.customer_email || session.metadata?.email,
  )
  if (!expectedEmail || !sessionEmail || sessionEmail !== expectedEmail) {
    return { ok: false, error: 'Sign in with the same email used for this purchase.' }
  }

  const purchasedPriceIds = (lineItems || []).map((item) => item?.price?.id).filter(Boolean)
  if (!expectedPriceId || !purchasedPriceIds.includes(expectedPriceId)) {
    return { ok: false, error: 'The workbook product was not found in this checkout.' }
  }

  return { ok: true, email: sessionEmail, sessionId: session.id }
}
