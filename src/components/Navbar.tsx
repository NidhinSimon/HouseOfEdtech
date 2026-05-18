'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, CircleDollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="mark">A</span>
          <span>Applywise</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <Home size={16} /> Home
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
        <Link href={isLoggedIn ? "/dashboard" : "/auth"} className="btn btn-primary">
          {isLoggedIn ? "Dashboard →" : "Get Started →"}
        </Link>
      </nav>
    </div>
  );
}

