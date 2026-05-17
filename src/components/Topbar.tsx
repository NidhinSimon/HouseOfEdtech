'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BriefcaseBusiness, PlusCircle,
  BarChart2, FileSearch, ScanSearch, Settings, LogOut, FileText
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',   icon: <LayoutDashboard size={15} /> },
  { href: '/jobs',      label: 'Applications', icon: <BriefcaseBusiness  size={15} /> },
  { href: '/jobs',      label: 'Add New',      icon: <PlusCircle         size={15} /> },
  { href: '/analytics', label: 'Analytics',    icon: <BarChart2          size={15} /> },
  { href: '/analyzer',  label: 'Analyzer',     icon: <FileSearch         size={15} /> },
  { href: '/jobs',      label: 'Gap Analyzer', icon: <ScanSearch         size={15} /> },
  { href: '/application', label: 'App Detail', icon: <FileText           size={15} /> },
];

export function Topbar() {
  const pathname = usePathname();

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
          const isActive = pathname === item.href && item.href !== '/jobs'
            ? true
            : pathname === item.href;
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
        <Link href="/settings" className="topbar-icon-btn" title="Settings">
          <Settings size={16} />
        </Link>
        <Link href="/auth" className="topbar-icon-btn" title="Sign out">
          <LogOut size={16} />
        </Link>
        {/* Avatar */}
        <div className="topbar-avatar" title="Nidhi">N</div>
      </div>
    </header>
  );
}

// Keep backward-compat export alias so pages importing Sidebar still work
export { Topbar as Sidebar };
