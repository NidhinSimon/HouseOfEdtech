'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, CircleDollarSign } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="nav-logo">
          <span className="mark">A</span>
          <span>Applywise</span>
        </div>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <Home size={16} /> Home
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link href="/pricing" className={`nav-link ${pathname === '/pricing' ? 'active' : ''}`}>
            <CircleDollarSign size={16} /> Pricing
          </Link>
        </div>
        <Link href="/auth" className="btn btn-primary">Get Started →</Link>
      </nav>
    </div>
  );
}
