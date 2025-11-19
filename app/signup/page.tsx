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

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('Email already exists');
        setLoading(false);
        return;
      }

      users.push({ email, password });
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify({ email }));

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
          <p className="text-slate-400 mt-2">Start creating videos</p>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="password"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-cyan-500 text-slate-900 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Sign Up'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Have an account? <Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
