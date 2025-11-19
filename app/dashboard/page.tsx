'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [videosUsed, setVideosUsed] = useState(0);
  const [generationId, setGenerationId] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [videoStats, setVideoStats] = useState<any>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  // Fetch video stats
  useEffect(() => {
    if (!user?.email) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/video-history?userId=${user.email}`);
        const data = await response.json();
        setVideoStats(data.stats);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [user]);

  // Poll for video generation status
  useEffect(() => {
    if (!generationId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/check-video-status?id=${generationId}`);
        const data = await response.json();

        console.log('Poll response:', data);
        setGenerationStatus(data.status);

        if (data.status === 'succeeded') {
          setVideoUrl(data.videoUrl);
          setGenerating(false);
          setGenerationId(''); // Stop polling
          setVideosUsed(videosUsed + 1);
          // Refresh stats after video completes
          if (user?.email) {
            const response = await fetch(`/api/video-history?userId=${user.email}`);
            const updatedData = await response.json();
            setVideoStats(updatedData.stats);
          }
        } else if (data.status === 'failed') {
          setError('Video generation failed. Please try again.');
          setGenerating(false);
          setGenerationId(''); // Stop polling
        }
        // If status is starting or processing, keep polling
      } catch (err) {
        console.error('Poll error:', err);
        // Continue polling even on error
      }
    };

    // Poll every 3 seconds while generating
    const interval = setInterval(pollStatus, 3000);

    // Initial poll immediately
    pollStatus();

    return () => clearInterval(interval);
  }, [generationId, user, videosUsed]);

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setVideoUrl('');
    setGenerationStatus('');

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start video generation');
      }

      const data = await response.json();
      console.log('Generation started:', data);
      
      setGenerationId(data.generationId);
      setGenerationStatus(data.status);
      setPrompt('');
      
      // Show estimated time if available
      if (data.estimatedDurationSeconds) {
        setEstimatedTime(data.estimatedDurationSeconds + 30); // Add buffer
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
      setGenerating(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
            <span className="text-xl font-bold">ReelForge</span>
          </div>
          <button onClick={handleSignOut} className="px-4 py-2 text-slate-400 hover:text-white transition">Sign Out</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {videoStats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Videos</p>
              <p className="text-2xl font-bold">{videoStats.totalVideos}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold">{videoStats.completedVideos}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Cost</p>
              <p className="text-2xl font-bold">${videoStats.totalCost.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Create Your Video</h2>

          <form onSubmit={handleGenerateVideo} className="space-y-4">
            {error && <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">{error}</div>}

            {generating && (
              <div className="bg-blue-900/30 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg">
                <p className="font-semibold">Generating video...</p>
                <p className="text-sm mt-1">Status: <span className="capitalize">{generationStatus}</span></p>
                {estimatedTime > 0 && <p className="text-sm">Estimated time: {estimatedTime} seconds</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Video Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 h-24 resize-none"
                disabled={generating}
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-cyan-500 text-slate-900 py-3 rounded-lg font-semibold hover:bg-cyan-400 transition disabled:opacity-50"
            >
              {generating ? `Generating... (Status: ${generationStatus || 'Starting'})` : 'Generate Video'}
            </button>
          </form>
        </div>

        {videoUrl && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Your Video</h3>
            <div className="bg-slate-900 rounded-lg overflow-hidden aspect-video mb-4 flex items-center justify-center">
              <video src={videoUrl} controls className="w-full h-full object-cover" />
            </div>
            <a href={videoUrl} download="video.mp4" className="inline-block px-6 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition">
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
