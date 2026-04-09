import Link from 'next/link';

const FOOTER_COLS = [
  {
    heading: 'Tools',
    links: [
      { label: 'File Conversion', href: '/tools?cat=file-conversion' },
      { label: 'Image Tools',     href: '/tools?cat=image-tools' },
      { label: 'Media',           href: '/tools?cat=media' },
      { label: 'Developer',       href: '/tools?cat=developer' },
      { label: 'Text Tools',      href: '/tools?cat=text-tools' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'API Docs',    href: '/api-docs' },
      { label: 'Changelog',   href: '/changelog' },
      { label: 'Status',      href: '/status' },
      { label: 'Open Source', href: 'https://github.com' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Apex', href: '/about' },
      { label: 'Blog',       href: '/blog' },
      { label: 'Careers',    href: '/careers' },
      { label: 'Contact',    href: '/contact' },
    ],
  },
  {
    heading: 'Follow',
    links: [
      { label: 'Instagram',   href: 'https://instagram.com' },
      { label: 'Twitter / X', href: 'https://twitter.com' },
      { label: 'LinkedIn',    href: 'https://linkedin.com' },
      { label: 'GitHub',      href: 'https://github.com' },
    ],
  },
];

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="16" height="16" rx="3" fill="white" transform="rotate(45 11 11)" />
            </svg>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              Apex Studio Utilities
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 160 }}>
            The premier utility suite. Every tool, free forever.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.heading} className="footer-col">
            <h4>{col.heading}</h4>
            {col.links.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Apex. All rights reserved.</p>
        <p>Privacy · Terms · Cookies</p>
      </div>
    </footer>
  );
}
