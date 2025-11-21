import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { getRunwayVideoUrl, checkRunwayStatus } from '@/lib/runway-service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('id');

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID required' }, { status: 400 });
    }

    // Get video record to know which provider to use
    const { data: videoRecord } = await supabase
      .from('videos')
      .select('*')
      .eq('generation_id', generationId)
      .single();

    if (!videoRecord) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const provider = videoRecord.provider;
    let status = 'processing';
    let videoUrl: string | null = null;

    if (provider === 'runway') {
      // Check Runway status
      const runwayTask = await checkRunwayStatus(generationId);
      
      if (runwayTask.status === 'SUCCEEDED') {
        status = 'succeeded';
        videoUrl = await getRunwayVideoUrl(generationId);
      } else if (runwayTask.status === 'FAILED') {
        status = 'failed';
      } else if (runwayTask.status === 'IN_PROGRESS') {
        status = 'processing';
      } else {
        status = 'starting';
      }
    } else {
      // Check Replicate status
      const prediction = await replicate.predictions.get(generationId);

      if (prediction.status === 'succeeded') {
        status = 'succeeded';
        videoUrl = prediction.output?.[0] || null;
      } else if (prediction.status === 'failed') {
        status = 'failed';
      } else if (prediction.status === 'processing') {
        status = 'processing';
      }
    }

    // Update video record status
    await supabase
      .from('videos')
      .update({
        status,
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('generation_id', generationId);

    return NextResponse.json({
      status,
      videoUrl,
      generationId,
      provider,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
