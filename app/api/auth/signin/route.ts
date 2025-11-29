import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Get user subscription info
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', email)
      .single();

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        subscription: subscription || null,
      },
      session: data.session,
    });

  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: error.message || 'Sign in failed' },
      { status: 500 }
    );
  }
}