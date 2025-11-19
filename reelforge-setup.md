# ReelForge SaaS -- Setup & Workflow Reference

## Environment Variables (.env)

    REPLICATE_API_TOKEN=your_replicate_key
    RUNWAY_API_TOKEN=your_runway_key
    STRIPE_SECRET_KEY=sk_live_xxx_or_test_key
    STRIPE_WEBHOOK_SECRET=whsec_xxx

## Stripe Setup

1.  Create a Product in Stripe.
2.  Add Pricing Tiers (Price IDs appear on the right panel).
3.  Add to frontend:

``` js
const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PK);

await stripe.redirectToCheckout({
  lineItems: [{ price: "price_12345", quantity: 1 }],
  mode: "subscription",
  successUrl: "...",
  cancelUrl: "..."
});
```

## Webhook Setup (ngrok)

1.  `ngrok http 3000`
2.  Set webhook endpoint in Stripe.
3.  Add events:

-   checkout.session.completed
-   customer.subscription.created
-   invoice.payment_succeeded
-   customer.subscription.deleted

## Deployment Checklist

-   Switch to production keys
-   Update webhook URL to real domain
-   Enable SSL
-   Update CORS rules
