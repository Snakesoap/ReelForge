'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password required');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Call the signup API route
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign up');
        setLoading(false);
        return;
      }

      // Store user session in localStorage (or use Supabase session storage)
      localStorage.setItem('currentUser', JSON.stringify({ email }));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
            <span className="text-2xl font-bold">ReelForge</span>
          </div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-slate-400 mt-2">Start creating videos with AI</p>
        </div>

        <form onSubmit={handleSignUp} className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-cyan-500 text-slate-900 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <p className="text-slate-400 text-sm mb-3">
              Have an account? <Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign In</Link>
            </p>
            <p className="text-slate-500 text-xs">
              New accounts start with 0 credits. Purchase credits to begin creating videos.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
