'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    setIsLoggedIn(!!user);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="border-b border-slate-700/50 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
            <span className="text-xl font-bold">ReelForge</span>
          </Link>
          
          <div className="flex gap-4">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-lg transition ${
                pathname === '/' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-3 py-1.5 rounded-lg transition ${
                pathname === '/dashboard' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex gap-4">
          {isLoggedIn ? (
            <button 
              onClick={handleSignOut} 
              className="px-4 py-2 text-slate-400 hover:text-white transition"
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
