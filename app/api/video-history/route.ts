import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch user's videos ordered by most recent first
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Last 50 videos

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    // Calculate stats
    const totalVideos = data?.length || 0;
    const totalCost = data?.reduce((sum, video) => sum + (video.cost || 0), 0) || 0;
    const completedVideos = data?.filter((v) => v.status === 'succeeded').length || 0;

    return NextResponse.json({
      videos: data,
      stats: {
        totalVideos,
        completedVideos,
        totalCost,
        averageCost: totalVideos > 0 ? totalCost / totalVideos : 0,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
