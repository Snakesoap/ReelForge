import { NextRequest, NextResponse } from 'next/server';
import { createCreditsCheckout } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, creditAmount } = await request.json();

    if (!userId || !email || !creditAmount || creditAmount < 1) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const session = await createCreditsCheckout(
      userId,
      email,
      creditAmount,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
