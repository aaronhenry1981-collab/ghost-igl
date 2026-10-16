import { createHash } from 'node:crypto'
import { assembleDirectory } from '../data/assemble.mjs'
import { pkFor, ITEM_TYPES } from '../data/items.mjs'
import { effectiveConsent } from '../domain/outreach.mjs'
import { HttpError, json, parseJsonBody } from '../lib/http.mjs'

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export function loginHelpRoutes({ ctx, requireAdmin }) {
  async function preview(key) {
    if (!/^pl_[a-f0-9]{20}$/.test(key || '')) throw new HttpError(400, 'invalid player key')
    // No directory cache or fallback to an earlier queue snapshot.
    const directory = await assembleDirectory({tables:ctx.tables,store:ctx.store,log:ctx.log})
    const contact = directory.contacts.find(c => c.contactKey === key)
    if (!contact) throw new HttpError(404, 'player not found')
    const {facts} = await ctx.factsFor(contact.identity, {withCognito:true,signedIn:false})
    if (facts.sources.account !== 'ok' || facts.sources.billing !== 'ok') throw new HttpError(409, 'Current account or membership state is unavailable. Refresh before sending.')
    if (facts.account.status !== 'force_change_password' || !facts.billing?.hasAccess || facts.identity.isAdmin) throw new HttpError(409, 'First-login help no longer applies to this account. Refresh the queue.')
    const consent = effectiveConsent(await ctx.store.get(pkFor(key), ITEM_TYPES.CONSENT))
    if (consent.doNotContact) throw new HttpError(409, 'This player is marked do not contact.')
    const subject = 'Help finishing your Recon 6 sign-in'
    const body = ['Hi,', '', 'Your Recon 6 account still needs its first sign-in completed.', '',
      'Open https://r6coaching.com/#/auth and sign in using this email address and the temporary password in your original invitation. Follow the prompt to choose your own password.',
      '', 'If the invitation is missing or the temporary password has expired, reply to this email for help. Do not send us your password.',
      '', 'This message does not reset your password or change your membership.', '', 'Recon 6 Support'].join('\n')
    const receiptKey = 'LOGINHELP#' + digest([key, facts.account.createdAt, 'first-login-v1'])
    const message = {recipient:contact.email,subject,body,accountStatus:facts.account.status}
    return {...message, previewToken:digest(message), receiptKey, available:!!ctx.loginHelpEmail,
      receipt:await ctx.store.get(pkFor(key),receiptKey)}
  }
  return {routes:[
    {method:'GET',path:'/cs/admin/players/{key}/login-help',handler:async req=>{
      await requireAdmin(req); return json(200,await preview(req.params.key))
    }},
    {method:'POST',path:'/cs/admin/players/{key}/login-help',handler:async req=>{
      const admin=await requireAdmin(req)
      const input=parseJsonBody(req.rawBody,{maxBytes:1024})
      const p=await preview(req.params.key)
      if(input.previewToken!==p.previewToken || input.recipient!==p.recipient) throw new HttpError(409,'Recipient or message changed. Review a fresh preview.')
      if(p.receipt) return json(200,{receipt:p.receipt,duplicate:true})
      if(!ctx.loginHelpEmail) throw new HttpError(503,'Customer email sending is not configured. No email was sent.')
      const at=new Date(ctx.now()).toISOString()
      const receipt={pk:pkFor(req.params.key),sk:p.receiptKey,type:'LOGINHELP',gsi1pk:'LOGINHELP',gsi1sk:at,
        recipient:p.recipient,subject:p.subject,body:p.body,actor:admin.email,createdAt:at,status:'sending',providerMessageId:null,
        history:[{at,status:'sending',actor:admin.email}]}
      try {await ctx.store.put(receipt,{ifNotExists:true})}
      catch(err) {if(err.name==='ConditionalCheckFailedException') return json(200,{receipt:await ctx.store.get(receipt.pk,receipt.sk),duplicate:true});throw err}
      let status='unknown',providerMessageId=null
      try {
        const result=await ctx.loginHelpEmail({recipient:p.recipient,subject:p.subject,body:p.body,receiptKey:p.receiptKey})
        providerMessageId=result?.messageId || null
        status=providerMessageId?'accepted':'unknown'
      } catch(err) {
        // A transport timeout might follow acceptance: never retry blindly.
        status=['MessageRejected','MailFromDomainNotVerifiedException','BadRequestException','AccountSuspendedException'].includes(err.name)?'failed':'unknown'
      }
      const updatedAt=new Date(ctx.now()).toISOString()
      const saved=await ctx.store.update(receipt.pk,receipt.sk,{status,providerMessageId,updatedAt,
        history:[...receipt.history,{at:updatedAt,status,actor:'email-provider'}]})
      return json(200,{receipt:saved,issueResolved:false})
    }},
  ]}
}
