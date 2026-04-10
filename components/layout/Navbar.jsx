'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Tools',   href: '/tools' },
  { label: 'Docs',    href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'API',     href: '/api-docs' },
];

/* ── Apex Brandmark logo (white PNG) ─────────────────────────── */
function ApexMark({ size = 22 }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/apex-brandmark-white.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0, objectFit: 'contain', display: 'block' }}
    />
  );
}

/* ── Animated hamburger — 3 pill bars morph to X ─────────────── */
function HamburgerBars({ open }) {
  const t = 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease';
  // Each bar: center of viewBox is (12,12). Top bar center-y=5.25, bottom center-y=18.75
  // Offset to center: 12-5.25=6.75, 12-18.75=-6.75
  const topStyle = {
    transition: t,
    transformOrigin: 'center',
    transform: open ? 'translateY(6.75px) rotate(45deg)' : 'translateY(0) rotate(0deg)',
  };
  const midStyle = {
    transition: t,
    transformOrigin: 'center',
    opacity: open ? 0 : 1,
    transform: open ? 'scaleX(0)' : 'scaleX(1)',
  };
  const botStyle = {
    transition: t,
    transformOrigin: 'center',
    transform: open ? 'translateY(-6.75px) rotate(-45deg)' : 'translateY(0) rotate(0deg)',
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Top bar */}
      <rect x="3" y="3.5" width="18" height="3.5" rx="1.75" style={topStyle} />
      {/* Middle bar */}
      <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" style={midStyle} />
      {/* Bottom bar */}
      <rect x="3" y="17" width="18" height="3.5" rx="1.75" style={botStyle} />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  // Close overlay on route change
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
        {/* Wordmark */}
        <Link href="/" className="navbar-logo">
          <ApexMark size={22} />
          <span className="navbar-logo-text">Apex Studio Utilities</span>
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
          <HamburgerBars open={menuOpen} />
        </button>
      </nav>

      {/* Full-screen mobile nav overlay — fades + slides in */}
      <div className={`nav-overlay${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-overlay-header">
          <Link href="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
            <ApexMark size={22} />
            <span className="navbar-logo-text">Apex Studio Utilities</span>
          </Link>

          <button
            className="nav-hamburger"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <HamburgerBars open={menuOpen} />
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

        {/* Mobile overlay footer CTA */}
        <div className="nav-overlay-footer">
          <Link href="/tools" className="btn-primary" onClick={() => setMenuOpen(false)}>
            Browse All 170+ Tools
          </Link>
          <p className="nav-overlay-note">100% free · No account · Client-side only</p>
        </div>
      </div>
    </>
  );
}
