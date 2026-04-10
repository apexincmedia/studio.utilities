import Link from 'next/link';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import { TOOLS } from '@/lib/tools-catalog';

export const metadata = {
  title: 'Pricing',
  description:
    'Apex Studio Utilities is completely free — all 170+ tools, unlimited use, no account required. No ads, no watermarks, no hidden fees. Free forever.',
  alternates: { canonical: '/pricing' },
};

const FREE_FEATURES = [
  { icon: 'Zap',         text: 'All 170+ tools, fully unlocked' },
  { icon: 'Infinity',    text: 'Unlimited conversions, no rate limits' },
  { icon: 'Lock',        text: 'No account or sign-up, ever' },
  { icon: 'ShieldCheck', text: 'Files never leave your device' },
  { icon: 'Eye',         text: 'No ads, no tracking pixels' },
  { icon: 'Download',    text: 'No watermarks on downloads' },
  { icon: 'Globe',       text: 'Works in any modern browser' },
  { icon: 'RefreshCw',   text: 'New tools added regularly' },
];

const COMPARISONS = [
  { feature: 'Cost',              apex: 'Free forever',    typical: '$9–49 / month' },
  { feature: 'Account required',  apex: 'Never',           typical: 'Always' },
  { feature: 'File size limits',  apex: 'None (RAM-bound)', typical: '5–25 MB cap' },
  { feature: 'Conversions/day',   apex: 'Unlimited',       typical: '5–50 / day' },
  { feature: 'Watermarks',        apex: 'None',            typical: 'On free tier' },
  { feature: 'Privacy',           apex: 'Client-side only', typical: 'Server upload' },
  { feature: 'Ads',               apex: 'None',            typical: 'Often yes' },
];

export default function PricingPage() {
  const liveCount = TOOLS.filter((t) => t.status === 'live').length;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px 96px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 80 }}>
        {/* Label pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: 'var(--success-bg)',
          border: '1px solid rgba(74,222,128,0.2)', borderRadius: 100,
          fontSize: 12, color: '#4ADE80', fontWeight: 700,
          letterSpacing: '0.08em', marginBottom: 32,
        }}>
          <Icon icon={ICON_MAP.Check} size={12} />
          100% FREE
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700,
          color: 'var(--text)', lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em',
        }}>
          One plan.<br />
          <span style={{ color: 'var(--muted)' }}>It&apos;s called free.</span>
        </h1>

        <p style={{
          fontSize: 18, color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: 520, margin: '0 auto 40px',
        }}>
          Every tool, unlimited, forever. No credit card. No free trial that expires.
          No &ldquo;premium&rdquo; tier hiding the features you actually need.
        </p>

        <Link href="/tools" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px', background: 'var(--pill-bg)',
          color: 'var(--pill-text)', borderRadius: 'var(--radius-md)',
          fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}>
          Start using {liveCount} tools
          <Icon icon={ICON_MAP.ArrowRight} size={16} />
        </Link>
      </div>

      {/* Big price card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '48px 40px',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240,
          background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#4ADE80',
                background: 'var(--success-bg)', padding: '4px 12px',
                borderRadius: 100, border: '1px solid rgba(74,222,128,0.2)',
              }}>Forever plan</span>
            </div>
            <div style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              $0
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>per month · always</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{liveCount}+</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>tools included</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {FREE_FEATURES.map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, flexShrink: 0, borderRadius: 'var(--radius-sm)',
                background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon icon={ICON_MAP[icon]} size={14} style={{ color: '#4ADE80' }} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How we sustain — honest note */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '16px 20px',
        marginBottom: 64, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Icon icon={ICON_MAP.Info} size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-dim)' }}>How is this free?</strong> All processing happens in your browser — we have no servers running your files, which means near-zero operating cost. We believe utilities should be utilities: fast, reliable, and accessible to everyone.
        </p>
      </div>

      {/* Comparison table */}
      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          How we compare
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
          Typical conversion tools offer a limited free tier and charge for the features you actually use.
        </p>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '14px 24px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Feature</span>
            <span style={{ fontSize: 11, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Apex Studio</span>
            <span style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Typical SaaS</span>
          </div>
          {COMPARISONS.map(({ feature, apex, typical }, i) => (
            <div
              key={feature}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < COMPARISONS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{feature}</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>{apex}</span>
              <span style={{ fontSize: 13, color: 'var(--faint)' }}>{typical}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 28 }}>
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              q: 'Is there really no catch?',
              a: 'No catch. All processing happens locally in your browser — we have no backend infrastructure to pay for, so we have no reason to charge you.',
            },
            {
              q: 'Will you add a paid tier later?',
              a: 'The core utility suite will remain free forever. If we ever add a premium tier, it will only include add-ons (like team collaboration or a cloud sync feature) — never paywalling existing tools.',
            },
            {
              q: 'Is there a file size limit?',
              a: 'There is no enforced limit. The practical limit is your device\'s RAM, which is typically several GB. Large files (500 MB+) may be slow depending on your hardware.',
            },
            {
              q: 'Do you store my files?',
              a: 'Never. Files are loaded into your browser\'s memory and discarded when you close the tab. We have no server that receives or stores your data.',
            },
          ].map(({ q, a }) => (
            <div key={q} style={{
              padding: '20px 24px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{q}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center', padding: '48px 40px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>
          No sign-up. No credit card. Just pick a tool.
        </p>
        <Link href="/tools" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', background: 'var(--pill-bg)',
          color: 'var(--pill-text)', borderRadius: 'var(--radius-md)',
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>
          Browse all tools
          <Icon icon={ICON_MAP.ArrowRight} size={14} />
        </Link>
      </div>

    </main>
  );
}
