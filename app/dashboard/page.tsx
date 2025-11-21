'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MODELS = [
  {
    id: 'seedance-1-pro-fast',
    name: 'Seedance 1 Pro Fast',
    provider: 'Replicate',
    credits: 0.4,
    description: 'Fast, high-quality videos. Perfect for quick turnarounds.',
    cost: '$0.36',
  },
  {
    id: 'gen-4-turbo',
    name: 'Runway Gen-4 Turbo',
    provider: 'Runway',
    credits: 0.3,
    description: 'Fastest generation with excellent quality.',
    cost: '$0.30',
  },
  {
    id: 'gen-4',
    name: 'Runway Gen-4',
    provider: 'Runway',
    credits: 0.8,
    description: 'High-quality, cinematic videos.',
    cost: '$0.72',
  },
  {
    id: 'veo-3-1',
    name: 'Runway Veo 3.1',
    provider: 'Runway',
    credits: 2.7,
    description: 'Premium quality with advanced features. Coming soon.',
    cost: '$2.40',
  },
];

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
  const [purchasingCredits, setPurchasingCredits] = useState(false);
  const [selectedModel, setSelectedModel] = useState('seedance-1-pro-fast');

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
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start video generation');
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

  const handlePurchaseCredits = async (creditAmount: number) => {
    if (!user?.email) return;
    
    setPurchasingCredits(true);
    try {
      const response = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          email: user.email,
          creditAmount,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to start checkout');
        setPurchasingCredits(false);
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
      setPurchasingCredits(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div>Loading...</div></div>;

  const selectedModelData = MODELS.find(m => m.id === selectedModel);

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
              <label className="block text-sm font-medium mb-2">Select Model</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      selectedModel === model.id
                        ? 'border-cyan-500 bg-slate-700/50'
                        : 'border-slate-600 bg-slate-700/20 hover:border-slate-500'
                    } ${model.id === 'veo-3-1' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={model.id === 'veo-3-1'}
                  >
                    <p className="font-semibold">{model.name}</p>
                    <p className="text-sm text-slate-400">{model.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-cyan-400">{model.credits} credits</span>
                      <span className="text-sm text-slate-300">{model.cost}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Need More Credits?</h2>
          <p className="text-slate-400 mb-6">Run out of credits? No problem! Purchase additional credits anytime.</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { credits: 10, price: 15.0 },
              { credits: 25, price: 37.5 },
              { credits: 50, price: 75.0 },
              { credits: 100, price: 150.0 },
            ].map(({ credits, price }) => (
              <button
                key={credits}
                onClick={() => handlePurchaseCredits(credits)}
                disabled={purchasingCredits}
                className="border border-cyan-500/50 rounded-lg p-4 hover:bg-slate-700/50 transition disabled:opacity-50 text-center"
              >
                <p className="text-cyan-400 text-2xl font-bold">{credits}</p>
                <p className="text-white font-semibold">${price.toFixed(2)}</p>
              </button>
            ))}
          </div>
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
