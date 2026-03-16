# Solora Review Checkout (Netlify)

This project creates a Stripe Checkout Session from your Framer form.

## Files

- `netlify/functions/review-removal-checkout.js` - Netlify serverless function
- `netlify.toml` - Netlify config
- `package.json` - project dependencies

## Deploy on Netlify

1. Upload this project to GitHub.
2. In Netlify, create a new site from that GitHub repo.
3. Add this environment variable in Netlify:
   - `STRIPE_SECRET_KEY=sk_test_...`
4. Deploy the site.

## Endpoint

After deploy, your endpoint will be:

`https://YOUR-SITE.netlify.app/.netlify/functions/review-removal-checkout`

## Put this in Framer

Replace your endpoint with:

```ts
const CHECKOUT_ENDPOINT = "https://YOUR-SITE.netlify.app/.netlify/functions/review-removal-checkout"
```

## Expected payload from frontend

```json
{
  "customer": {
    "businessName": "Acme Inc.",
    "contactName": "John Doe",
    "email": "john@acme.com",
    "phone": "+1 555 123 4567"
  },
  "reviewLinks": [
    "https://google.com/...",
    "https://yelp.com/..."
  ],
  "order": {
    "reviewCount": 2,
    "pricePerReview": 350,
    "total": 700,
    "currency": "usd"
  },
  "payment": {
    "type": "authorization",
    "confirmationUrl": "https://solora.ai/confirmation",
    "cancelUrl": "https://solora.ai/remove-negative-reviews"
  },
  "meta": {
    "source": "framer-review-removal-form",
    "submittedAt": "2026-03-17T00:00:00.000Z"
  }
}
```

## Response shape

```json
{
  "success": true,
  "redirectUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

## Important

Use your Stripe **secret key** in Netlify environment variables, not the publishable key.
