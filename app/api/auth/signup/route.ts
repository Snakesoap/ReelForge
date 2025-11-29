import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
  emailRedirectTo: `https://www.tryreelforge.com/dashboard`,
}
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create Stripe customer (optional - can be done later on first purchase)
    let stripeCustomerId = null;
    try {
      const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}`,
      });
      const stripeData = await stripeResponse.json();
      stripeCustomerId = stripeData.id;
    } catch (err) {
      console.error('Error creating Stripe customer:', err);
      // Continue even if Stripe customer creation fails
    }

    // Create user subscription record with 0 credits (NO FREE CREDITS)
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: email,
        stripe_customer_id: stripeCustomerId,
        tier: 'free',
        status: 'active',
        monthly_credits: 0,
        credits_used: 0,
        credits_remaining: 0, // 🚫 NO FREE CREDITS - Users must purchase
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (subError) {
      // Rollback: delete the auth user if subscription creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: authData.user.id,
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
