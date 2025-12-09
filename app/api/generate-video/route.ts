import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { deductCredits } from '@/lib/stripe-service';
import { generateVideoWithRunway } from '@/lib/runway-service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MODEL_DETAILS: { [key: string]: { credits: number; cost: number; provider: 'replicate' | 'runway'; name: string } } = {
  'seedance-1-pro-fast': {
    credits: 0.4,
    cost: 0.36,
    provider: 'replicate',
    name: 'Seedance 1 Pro Fast',
  },
  'gen-4-turbo': {
    credits: 0.3,
    cost: 0.30,
    provider: 'runway',
    name: 'Runway Gen-4 Turbo',
  },
  'gen-4': {
    credits: 0.8,
    cost: 0.72,
    provider: 'runway',
    name: 'Runway Gen-4',
  },
  'veo-3-1': {
    credits: 2.7,
    cost: 2.40,
    provider: 'runway',
    name: 'Runway Veo 3.1',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, model = 'seedance-1-pro-fast' } = await request.json();

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const modelInfo = MODEL_DETAILS[model];
    if (!modelInfo) {
      return NextResponse.json({ error: 'Invalid model selected' }, { status: 400 });
    }

    // Check if user has enough credits
    const { data: userData } = await supabase
      .from('user_subscriptions')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (!userData || userData.credits_remaining < modelInfo.credits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${modelInfo.credits} credits but have ${userData?.credits_remaining || 0}` },
        { status: 402 }
      );
    }

    // Generate video based on provider
    let generationId: string;
    let provider: string;
    let estimatedDurationSeconds = 30;

    if (modelInfo.provider === 'runway') {
      // Use Runway API
      const result = await generateVideoWithRunway(prompt, model);
      generationId = result.taskId;
      provider = 'runway';
      estimatedDurationSeconds = 60; // Runway takes longer typically
    } else {
      // Use Replicate
      const prediction = await replicate.predictions.create({
        model: 'bytedance/seedance-1-pro-fast', // Seedance version - update with actual
        input: {
          prompt,
          seconds: 6,
          ratio: '16:9',
        },
      });

      generationId = prediction.id;
      provider = 'replicate';
    }

    // Create video record in database (NOW INCLUDES COST)
    const { data: videoRecord } = await supabase
      .from('videos')
      .insert({
        generation_id: generationId,
        user_id: userId,
        prompt,
        model,
        provider,
        status: 'starting',
        cost: modelInfo.cost,  // <-- THIS WAS MISSING
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Deduct credits
    await deductCredits(userId, generationId, model, modelInfo.credits);

    return NextResponse.json({
      generationId,
      status: 'starting',
      estimatedDurationSeconds,
      provider,
      model,
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    );
  }
}
