import Link from 'next/link';

const FOOTER_COLS = [
  {
    heading: 'Tools',
    links: [
      { label: 'File Conversion',   href: '/tools?cat=file-conversion' },
      { label: 'Image Tools',       href: '/tools?cat=image-tools' },
      { label: 'Developer Tools',   href: '/tools?cat=developer' },
      { label: 'Text Tools',        href: '/tools?cat=text-tools' },
      { label: 'Calculators',       href: '/tools?cat=calculators' },
      { label: 'Security & Network',href: '/tools?cat=security' },
    ],
  },
  {
    heading: 'More Tools',
    links: [
      { label: 'Encoding & Decoding', href: '/tools?cat=encoding' },
      { label: 'Media & Downloads',   href: '/tools?cat=media' },
      { label: 'SEO & Web',           href: '/tools?cat=seo' },
      { label: 'All 170+ Tools',      href: '/tools' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',   href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms',   href: '/terms' },
    ],
  },
  {
    heading: 'Follow',
    links: [
      { label: 'Instagram',   href: 'https://instagram.com',  external: true },
      { label: 'Twitter / X', href: 'https://twitter.com',    external: true },
      { label: 'LinkedIn',    href: 'https://linkedin.com',   external: true },
      { label: 'GitHub',      href: 'https://github.com',     external: true },
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
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polygon points="16,3 29,16 16,29 3,16" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="16,8 24,16 16,24 8,16" fill="white" />
            </svg>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              Apex Studio Utilities
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 180, marginBottom: 16 }}>
            The premier utility suite.<br />Every tool, free forever.
          </p>
          <p style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.5 }}>
            170+ tools · 100% client-side<br />No account · No limits
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.heading} className="footer-col">
            <h4>{col.heading}</h4>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Apex Studio Utilities. All rights reserved.</p>
        <p>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          {' · '}
          <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
        </p>
      </div>
    </footer>
  );
}
