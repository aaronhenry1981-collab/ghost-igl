# Stripe Webhook (Supabase Edge Function)

Keeps the `subscriptions` table in sync whenever a customer pays, cancels, or fails payment in Stripe.

## Deploy

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

(The `--no-verify-jwt` flag is required — Stripe sends its own signature, not a Supabase JWT.)

## Configure secrets

```bash
# Get these from https://dashboard.stripe.com/apikeys and the webhook config page
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

## Configure Stripe

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. **Endpoint URL**: `https://zewzeaoecdjcbkdqpcfh.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and set it with `supabase secrets set STRIPE_WEBHOOK_SECRET=...`

## Price ID mapping

Update `PRICE_TO_PLAN` in `index.ts` whenever products change. Current live prices:

- `price_1TLEtrJNddvjgWcg9iTWJoLS` → `pro` ($12/mo)
- `price_1TLEtsJNddvjgWcgYcmiNmW7` → `champion` ($29/mo)

## Testing

Use the Stripe CLI to forward events to your deployed function:

```bash
stripe listen --forward-to https://zewzeaoecdjcbkdqpcfh.supabase.co/functions/v1/stripe-webhook
stripe trigger customer.subscription.created
```
