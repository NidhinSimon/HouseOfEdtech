'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart2, FileSearch, LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { href: '/analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
  { href: '/analyzer', label: 'Analyzer', icon: <FileSearch size={15} /> },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email || 'User';
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      }
    };

    fetchUser();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email || 'User';
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setUserName('User');
        setUserInitial('U');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    try {
      // 1. Sign out on the client side (catch and log any network/server failures silently to allow client-side signout)
      await supabase.auth.signOut().catch((err) => {
        console.warn('Silent warning during Supabase signOut:', err);
      });
    } catch (e) {
      console.warn('Exception during signout:', e);
    }

    try {
      // 2. Obliterate any remaining Supabase cookies from the browser
      document.cookie.split(';').forEach((c) => {
        const name = c.trim().split('=')[0];
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      // Clear local storage and session storage to remove cached tokens
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      toast.success('Signed out successfully');

      // 3. Navigate directly to /auth and force-refresh the router state
      router.push('/');
      router.refresh();

      // 4. Hard redirect fallback in case Next.js soft navigation fails to re-evaluate the proxy/guard immediately
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }, 300);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete sign out';
      toast.error(errorMsg);
    }
  };

  return (
    <header className="topbar">
      {/* Logo */}
      <Link href="/dashboard" className="topbar-logo">
        <div className="topbar-logo-mark">A</div>
        <span>Applywise</span>
      </Link>

      {/* Divider */}
      <div className="topbar-divider" />

      {/* Nav links */}
      <nav className="topbar-nav">
        {navItems.map((item) => {
          // Highlight only exact match for non-duplicate routes
          const active = pathname === item.href && item.label !== 'Add New' && item.label !== 'Gap Analyzer';
          return (
            <Link

              key={item.label}
              href={item.href}
              className={`topbar-nav-item${active ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="topbar-actions">
        <button
          onClick={handleSignOut}
          className="topbar-icon-btn"
          title="Sign out"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <LogOut size={16} />
        </button>
        {/* Avatar → links to Settings */}
        <Link
          href="/settings"
          className="topbar-avatar"
          title={`${userName} · Profile & Settings`}
          style={{ textDecoration: 'none' }}
        >
          {userInitial}
        </Link>
      </div>
    </header>
  );
}

// Keep backward-compat export alias so pages importing Sidebar still work
export { Topbar as Sidebar };

