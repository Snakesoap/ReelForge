import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, tier } = await request.json();

    if (!userId || !email || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await createSubscriptionCheckout(
      userId,
      email,
      tier,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
