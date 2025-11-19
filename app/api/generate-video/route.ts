import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { deductCredits, getUserCredits, MODEL_CREDITS } from '@/lib/stripe-service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Model costs (actual API costs)
const MODEL_COSTS = {
  'seedance-1-pro-fast': 0.36,
  'gen-4-turbo': 0.30,
  'gen-4': 0.72,
  'veo-3': 2.40,
  'veo-3-1': 2.40,
  'veo-3-1-fast': 0.90,
} as const;

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, model = 'seedance-1-pro-fast' } = await request.json();

    console.log('Received:', { prompt, userId, model });

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user has enough credits
    const userCredits = await getUserCredits(userId);
    const creditsNeeded = MODEL_CREDITS[model as keyof typeof MODEL_CREDITS] || 1;

    console.log(`User credits remaining: ${userCredits.creditsRemaining}, Credits needed: ${creditsNeeded}`);

    if (userCredits.creditsRemaining < creditsNeeded) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          creditsNeeded,
          creditsRemaining: userCredits.creditsRemaining,
          tier: userCredits.tier,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    // Start the video generation on Replicate
    const prediction = await replicate.predictions.create({
      model: `bytedance/${model}`,
      input: {
        prompt,
        duration: 6,
        resolution: '1080p',
        aspect_ratio: '16:9',
        camera_fixed: false,
        fps: 24,
      },
    });

    console.log('Prediction created:', prediction);

    // Get the cost for this model
    const costToUs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.36;

    // Deduct credits immediately (before video completes, to prevent race conditions)
    try {
      await deductCredits(userId, prediction.id, model, costToUs);
      console.log(`Credits deducted for user ${userId}: ${creditsNeeded} credits`);
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      // Don't fail - let the video generate but log the error
    }

    // Log to database
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          generation_id: prediction.id,
          user_id: userId,
          prompt: prompt,
          status: prediction.status,
          model: model,
          duration: 6,
          resolution: '1080p',
          cost: costToUs,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Database error:', error);
      // Don't fail the request if database logging fails
    }

    return NextResponse.json({
      generationId: prediction.id,
      status: prediction.status,
      creditsDeducted: creditsNeeded,
      creditsRemaining: userCredits.creditsRemaining - creditsNeeded,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
