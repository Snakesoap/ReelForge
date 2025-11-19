import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Credit costs per model (in credits)
export const MODEL_CREDITS = {
  'seedance-1-pro-fast': 0.4,
  'gen-4-turbo': 0.3,
  'gen-4': 0.8,
  'veo-3': 2.7,
  'veo-3-1': 2.7,
  'veo-3-1-fast': 0.9,
} as const;

// Create or get Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  try {
    // Check if user already has a Stripe customer ID
    const { data } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (data?.stripe_customer_id) {
      return data.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    // Store in database
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
      }, { onConflict: 'user_id' });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Get user's available credits
export async function getUserCredits(userId: string) {
  try {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('credits_remaining, tier, monthly_credits')
      .eq('user_id', userId)
      .single();

    return {
      creditsRemaining: data?.credits_remaining || 0,
      tier: data?.tier || 'free',
      monthlyCredits: data?.monthly_credits || 0,
    };
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
}

// Deduct credits for video generation
export async function deductCredits(
  userId: string,
  generationId: string,
  model: string,
  costToUs: number
) {
  try {
    const creditsNeeded = MODEL_CREDITS[model as keyof typeof MODEL_CREDITS] || 1;

    // Check if user has enough credits
    const { data: userData } = await supabase
      .from('user_subscriptions')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (!userData || userData.credits_remaining < creditsNeeded) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits
    await supabase
      .from('user_subscriptions')
      .update({
        credits_remaining: userData.credits_remaining - creditsNeeded,
        credits_used: (userData.credits_remaining || 0) + creditsNeeded,
      })
      .eq('user_id', userId);

    // Log the generation credit usage
    await supabase
      .from('generation_credits')
      .insert({
        generation_id: generationId,
        user_id: userId,
        model,
        credits_used: creditsNeeded,
        cost_to_us: costToUs,
      });

    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

// Create a checkout session for subscription
export async function createSubscriptionCheckout(
  userId: string,
  email: string,
  tier: 'starter' | 'pro' | 'business',
  returnUrl: string
) {
  try {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    // Get the price ID for the tier from database
    const { data: tierData } = await supabase
      .from('subscription_tiers')
      .select('stripe_price_id')
      .eq('name', tier)
      .single();

    if (!tierData?.stripe_price_id) {
      throw new Error(`No Stripe price ID configured for tier: ${tier}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: tierData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      metadata: {
        userId,
        tier,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create checkout for one-time credit purchase
export async function createCreditsCheckout(
  userId: string,
  email: string,
  creditAmount: number, // number of credits to buy ($1.50 per credit)
  returnUrl: string
) {
  try {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditAmount} Video Credits`,
              description: `Purchase ${creditAmount} credits for video generation`,
            },
            unit_amount: Math.round(creditAmount * 1.5 * 100), // $1.50 per credit
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      metadata: {
        userId,
        type: 'credits',
        creditAmount: creditAmount.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating credits checkout:', error);
    throw error;
  }
}

// Handle successful subscription
export async function handleSubscriptionSuccess(customerId: string, tier: string) {
  try {
    // Get tier credits from database
    const { data: tierData } = await supabase
      .from('subscription_tiers')
      .select('monthly_credits')
      .eq('name', tier)
      .single();

    if (!tierData) {
      throw new Error(`Tier not found: ${tier}`);
    }

    // Get user ID from Stripe customer
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId as string;

    if (!userId) {
      throw new Error('User ID not found in Stripe customer metadata');
    }

    // Update subscription in database
    await supabase
      .from('user_subscriptions')
      .update({
        tier,
        status: 'active',
        credits_remaining: tierData.monthly_credits,
        monthly_credits: tierData.monthly_credits,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .eq('user_id', userId);

    return userId;
  } catch (error) {
    console.error('Error handling subscription success:', error);
    throw error;
  }
}

// Handle successful credit purchase
export async function handleCreditsSuccess(customerId: string, creditAmount: number) {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId as string;

    if (!userId) {
      throw new Error('User ID not found in Stripe customer metadata');
    }

    // Get current credits
    const { data } = await supabase
      .from('user_subscriptions')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    // Add credits
    await supabase
      .from('user_subscriptions')
      .update({
        credits_remaining: (data?.credits_remaining || 0) + creditAmount,
      })
      .eq('user_id', userId);

    // Log the purchase
    await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        amount: creditAmount * 1.5, // $1.50 per credit
        credit_type: 'purchase',
        source: 'stripe',
      });

    return userId;
  } catch (error) {
    console.error('Error handling credits success:', error);
    throw error;
  }
}
