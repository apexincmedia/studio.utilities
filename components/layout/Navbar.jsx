'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

const NAV_LINKS = [
  { label: 'Tools',   href: '/tools' },
  { label: 'API',     href: '/api-docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs',    href: '/docs' },
  { label: 'Blog',    href: '/blog' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close overlay when route changes
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Scroll-triggered border glow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (href) => {
    if (href === '/tools') return pathname === '/tools' || pathname.startsWith('/tools/');
    return pathname === href;
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link href="/" className="navbar-logo">
          {/* Inline SVG diamond mark */}
          <svg
            className="logo-diamond"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="16"
              height="16"
              rx="3"
              fill="white"
              transform="rotate(45 11 11)"
            />
          </svg>
          Apex Studio Utilities
        </Link>

        {/* Desktop nav links */}
        <div className="nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${isActive(href) ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon icon={menuOpen ? ICON_MAP.X : ICON_MAP.Menu} size={20} />
        </button>
      </nav>

      {/* Full-screen mobile nav overlay */}
      <div className={`nav-overlay${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-overlay-header">
          <Link href="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
            <svg
              className="logo-diamond"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="16"
                height="16"
                rx="3"
                fill="white"
                transform="rotate(45 11 11)"
              />
            </svg>
            Apex Studio Utilities
          </Link>

          <button
            className="nav-hamburger"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <Icon icon={ICON_MAP.X} size={20} />
          </button>
        </div>

        <nav className="nav-overlay-links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`nav-overlay-link${isActive(href) ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
