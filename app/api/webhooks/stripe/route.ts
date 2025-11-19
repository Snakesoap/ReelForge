import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleSubscriptionSuccess, handleCreditsSuccess } from '@/lib/stripe-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Webhook received: ${event.type}`);

    // Handle checkout.session.completed for both subscriptions and purchases
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata as any;

      if (metadata.type === 'credits') {
        // Handle credit purchase
        await handleCreditsSuccess(session.customer as string, parseInt(metadata.creditAmount));
        console.log(`Credits purchase completed for customer: ${session.customer}`);
      } else {
        // Handle subscription
        await handleSubscriptionSuccess(session.customer as string, metadata.tier);
        console.log(`Subscription created for customer: ${session.customer}`);
      }
    }

    // Handle subscription updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription updated: ${subscription.id}`);
    }

    // Handle subscription deleted (canceled)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription canceled: ${subscription.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
