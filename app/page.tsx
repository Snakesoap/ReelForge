'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'starter' | 'pro' | 'business') => {
    setLoading(tier);
    
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        // Not logged in, redirect to signup
        router.push('/signup');
        return;
      }

      const user = JSON.parse(userStr);

      // Call checkout endpoint
      const response = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          email: user.email,
          tier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe checkout
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      credits: '10 credits',
      videos: '~25 videos',
      description: 'Perfect for getting started',
      features: [
        '10 credits per month',
        'Seedance 1 Pro (0.4 credits)',
        'Gen-4 Turbo (0.3 credits)',
        'Community support',
      ],
      highlight: false,
      tier: 'starter' as const,
    },
    {
      name: 'Pro',
      price: '$39',
      period: '/month',
      credits: '50 credits',
      videos: '~130 videos',
      description: 'For serious creators',
      features: [
        '50 credits per month',
        'All standard models',
        'Gen-4 High Quality (0.8 credits)',
        'Priority support',
        'Analytics dashboard',
      ],
      highlight: true,
      tier: 'pro' as const,
    },
    {
      name: 'Business',
      price: '$99',
      period: '/month',
      credits: '150 credits',
      videos: '~370 videos',
      description: 'For studios & agencies',
      features: [
        '150 credits per month',
        'All models including Veo 3.1',
        'API access',
        'Dedicated support',
        'Custom integrations',
      ],
      highlight: false,
      tier: 'business' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <header className="border-b border-slate-700/50 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
            <span className="text-xl font-bold">ReelForge</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-slate-800 transition">Sign In</Link>
            <Link href="/signup" className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition">Get Started</Link>
          </div>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Create Videos with AI
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Generate stunning short-form videos instantly with AI. Choose your model, customize your vision, and create professional content in seconds.
        </p>
        <Link href="/signup" className="inline-block px-8 py-3 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition text-lg">
          Start Now
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">Pricing & Plans</h2>
        <p className="text-center text-slate-400 mb-16">Choose the perfect plan for your video creation needs</p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-8 transition transform hover:scale-105 ${
                plan.highlight
                  ? 'border-cyan-500 bg-gradient-to-br from-slate-800 to-slate-900 ring-2 ring-cyan-500/20 md:scale-105'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              {plan.highlight && (
                <div className="text-cyan-400 text-sm font-semibold mb-2">★ MOST POPULAR</div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-cyan-400">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              
              <div className="mb-6 pb-6 border-b border-slate-700">
                <p className="text-sm text-slate-300 font-semibold">{plan.credits}</p>
                <p className="text-xs text-slate-400">~{plan.videos}</p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.tier)}
                disabled={loading === plan.tier}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  plan.highlight
                    ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-70'
                    : 'border border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-70'
                }`}
              >
                {loading === plan.tier ? 'Loading...' : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold mb-4">Need More Credits?</h3>
          <p className="text-slate-300 mb-6">Run out of credits? No problem! Purchase additional credits anytime.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  // TODO: Implement credit purchase
                  alert(`Purchase ${amount} credits for $${(amount * 1.5).toFixed(2)}`);
                }}
                className="p-4 border border-slate-600 rounded-lg hover:border-cyan-500 transition"
              >
                <div className="font-bold text-cyan-400">{amount}</div>
                <div className="text-sm text-slate-400">${(amount * 1.5).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-800/50 border-t border-slate-700/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Available Models</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Seedance 1 Pro Fast</h3>
              <p className="text-slate-400 mb-4">Fast, high-quality videos. Perfect for quick turnarounds.</p>
              <div className="flex justify-between items-center">
                <span className="text-cyan-400 font-semibold">0.4 credits per 6s video</span>
                <span className="text-slate-500">$0.36 cost</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Runway Gen-4 Turbo</h3>
              <p className="text-slate-400 mb-4">Fastest generation with excellent quality.</p>
              <div className="flex justify-between items-center">
                <span className="text-cyan-400 font-semibold">0.3 credits per 6s video</span>
                <span className="text-slate-500">$0.30 cost</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Runway Gen-4</h3>
              <p className="text-slate-400 mb-4">High-quality, cinematic videos.</p>
              <div className="flex justify-between items-center">
                <span className="text-cyan-400 font-semibold">0.8 credits per 6s video</span>
                <span className="text-slate-500">$0.72 cost</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Runway Veo 3.1</h3>
              <p className="text-slate-400 mb-4">Premium quality with advanced features. Coming soon.</p>
              <div className="flex justify-between items-center">
                <span className="text-cyan-400 font-semibold">2.7 credits per 6s video</span>
                <span className="text-slate-500">$2.40 cost</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
