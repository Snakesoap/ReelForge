import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(request: NextRequest) {
  try {
    const predictionId = request.nextUrl.searchParams.get('id');

    if (!predictionId) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
    }

    // Get the prediction status from Replicate
    const prediction = await replicate.predictions.get(predictionId);

    console.log('Prediction status:', prediction);
    console.log('Output:', prediction.output);

    // Replicate returns output as a URL string directly
    const videoUrl = typeof prediction.output === 'string' ? prediction.output : null;

    // Update database with current status
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: prediction.status,
        video_url: videoUrl,
        completed_at: prediction.status === 'succeeded' ? new Date().toISOString() : null,
        error_message: prediction.error || null,
      })
      .eq('generation_id', predictionId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't fail the request if database update fails
    }

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      videoUrl: videoUrl,
      createdAt: prediction.created_at,
      error: prediction.error || null,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}