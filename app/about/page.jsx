import Link from 'next/link';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import { TOOLS } from '@/lib/tools-catalog';
import { CATEGORIES } from '@/lib/categories';

export const metadata = {
  title: 'About',
  description:
    'Apex Studio Utilities is a free, client-side utility suite — 170+ tools for converting, compressing, encoding, and transforming files and text. No account required. Your files never leave your device.',
  alternates: { canonical: '/about' },
};

const STATS = [
  { value: '170+',   label: 'Free tools',        icon: 'Zap' },
  { value: '9',      label: 'Categories',         icon: 'Layers' },
  { value: '0',      label: 'Account required',   icon: 'Lock' },
  { value: '100%',   label: 'Client-side',        icon: 'ShieldCheck' },
];

const PRINCIPLES = [
  {
    icon: 'ShieldCheck',
    heading: 'Privacy first',
    body: 'Every tool runs entirely in your browser. Files, text, and data are processed locally using Web APIs — nothing is ever uploaded to a server. We have no servers to upload to.',
  },
  {
    icon: 'Zap',
    heading: 'Instant results',
    body: 'No queues, no waiting for a server to process your file. Results are computed on your device, so speed scales with your hardware — not our infrastructure.',
  },
  {
    icon: 'Lock',
    heading: 'No account, ever',
    body: "We don't want your email. There are no paywalls, no rate limits, and no watermarks. Every tool in the suite is free, forever.",
  },
  {
    icon: 'Globe',
    heading: 'Industry-grade quality',
    body: 'Each tool is designed to the standard you\'d expect from a paid SaaS product — clean UI, comprehensive options, proper error handling, and results you can trust.',
  },
];

export default function AboutPage() {
  const liveCount = TOOLS.filter((t) => t.status === 'live').length;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px 96px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 72 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 24 }}>
          <Icon icon={ICON_MAP.Zap} size={12} />
          ABOUT
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 20 }}>
          The utility suite built for everyone
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 32px' }}>
          Apex Studio Utilities is a free, browser-based tool suite covering file conversion,
          image editing, developer utilities, text tools, and more — all running locally in your browser.
        </p>
        <Link
          href="/tools"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--pill-bg)', color: 'var(--pill-text)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Explore all {liveCount} tools
          <Icon icon={ICON_MAP.ArrowRight} size={14} />
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 72 }}>
        {STATS.map(({ value, label, icon }) => (
          <div
            key={label}
            style={{ padding: '24px 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}
          >
            <Icon icon={ICON_MAP[icon]} size={20} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Our principles */}
      <div style={{ marginBottom: 72 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 32 }}>
          What we believe
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {PRINCIPLES.map(({ icon, heading, body }) => (
            <div
              key={heading}
              style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon icon={ICON_MAP[icon]} size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{heading}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: 72 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          What's included
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 32 }}>
          {CATEGORIES.length} categories covering every common conversion and utility task.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/tools?cat=${cat.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', transition: 'border-color 0.15s',
              }}
            >
              <Icon icon={ICON_MAP[cat.iconName]} size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cat.count} tools</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          Questions or feedback?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 24 }}>
          We're always looking to improve. If a tool is missing something or you've found a bug, let us know.
        </p>
        <Link
          href="/contact"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          <Icon icon={ICON_MAP.Mail} size={14} />
          Get in touch
        </Link>
      </div>

    </main>
  );
}
