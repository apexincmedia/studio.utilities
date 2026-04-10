import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { TOOLS } from '@/lib/tools-catalog';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

export const metadata = {
  title: 'Documentation',
  description:
    'Documentation for Apex Studio Utilities. Learn how to use the 170+ tools, understand how client-side processing works, and get answers to common questions.',
  alternates: { canonical: '/docs' },
};

const QUICK_LINKS = [
  { icon: 'Zap',        label: 'Getting started',    href: '#getting-started' },
  { icon: 'Layers',     label: 'Tool categories',    href: '#categories' },
  { icon: 'ShieldCheck','label': 'How privacy works', href: '#privacy' },
  { icon: 'HelpCircle', label: 'FAQ',                href: '#faq' },
  { icon: 'Code2',      label: 'Developer guide',    href: '/api-docs' },
];

const FAQ_ITEMS = [
  {
    q: 'Do my files get uploaded to a server?',
    a: 'No. Every tool runs entirely inside your browser using built-in Web APIs — Canvas, FileReader, SubtleCrypto, WebAssembly, and others. Your files are loaded into browser memory and never leave your device.',
  },
  {
    q: 'Why is there no file size limit?',
    a: 'Because there\'s no server processing your files, there\'s no reason to impose a limit. The practical ceiling is your device\'s available RAM — typically several gigabytes. Very large files may be slow on older hardware.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No account is required for any tool, now or ever. There are no paywalls, no rate limits, and no sign-up prompts.',
  },
  {
    q: 'How do I convert between two formats not listed?',
    a: 'If a direct conversion isn\'t listed, try a two-step approach: convert to an intermediate format first, then convert again. For example, HEIC → JPG → PDF.',
  },
  {
    q: 'Why does a tool show a "coming soon" page?',
    a: 'We\'re actively shipping tools. "Coming soon" pages appear when a tool is planned but not yet implemented. Check back — the suite grows regularly.',
  },
  {
    q: 'How do I report a bug or request a feature?',
    a: 'Use the contact form at /contact. Select "Bug report" or "Missing tool / feature request" from the topic selector.',
  },
  {
    q: 'Do you use cookies or analytics?',
    a: 'We use a single preference cookie (dark mode, etc.) that contains no personal data. If we ever add analytics, it will be privacy-respecting and cookieless. See the Privacy Policy for full details.',
  },
];

export default function DocsPage() {
  const liveCount = TOOLS.filter((t) => t.status === 'live').length;

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 96px' }}>

      {/* Hero */}
      <div style={{ marginBottom: 56 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: 'var(--accent-dim)',
          border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100,
          fontSize: 12, color: 'var(--accent)', fontWeight: 700,
          letterSpacing: '0.08em', marginBottom: 24,
        }}>
          <Icon icon={ICON_MAP.BookOpen} size={12} />
          DOCUMENTATION
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
          color: 'var(--text)', lineHeight: 1.1, marginBottom: 16,
        }}>
          How to use Apex Studio Utilities
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 600 }}>
          Everything you need to know about the {liveCount}+ tools — how they work, how your data is protected, and how to get the best results.
        </p>
      </div>

      {/* Quick nav */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 64,
      }}>
        {QUICK_LINKS.map(({ icon, label, href }) => (
          <Link key={label} href={href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)',
            fontSize: 12, color: 'var(--muted)', textDecoration: 'none',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            <Icon icon={ICON_MAP[icon]} size={13} />
            {label}
          </Link>
        ))}
      </div>

      {/* Getting started */}
      <section id="getting-started" style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          Getting Started
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            {
              step: '01',
              title: 'Find a tool',
              body: 'Browse all tools at /tools or use the search bar to find what you need. Tools are grouped by category — File Conversion, Image Tools, Developer Tools, and more.',
              link: '/tools',
              linkLabel: 'Browse tools →',
            },
            {
              step: '02',
              title: 'Upload, paste, or enter input',
              body: 'Depending on the tool archetype, you\'ll either drag and drop a file, paste text, or enter a value. File tools show a drop zone — just drag your file in from your desktop or click to browse.',
            },
            {
              step: '03',
              title: 'Adjust options (optional)',
              body: 'The right panel shows tool options: quality settings, format selection, output options, and more. Changes take effect immediately or on clicking the action button.',
            },
            {
              step: '04',
              title: 'Download or copy the result',
              body: 'Results appear in the left panel. Use the Download button to save the file, or the Copy button for text output. For batch tools, "Download All" bundles everything.',
            },
          ].map(({ step, title, body, link, linkLabel }) => (
            <div key={step} style={{
              display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20,
              padding: '24px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--faint)',
                letterSpacing: '0.04em', flexShrink: 0,
              }}>{step}</div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{body}</p>
                {link && (
                  <Link href={link} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 13, color: 'var(--accent)', marginTop: 10,
                    textDecoration: 'none',
                  }}>{linkLabel}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tool categories */}
      <section id="categories" style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          Tool Categories
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          {liveCount} tools across {CATEGORIES.length} categories.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {CATEGORIES.map((cat) => {
            const count = TOOLS.filter((t) => t.status === 'live' && t.category === cat.id).length;
            return (
              <Link key={cat.id} href={`/tools?cat=${cat.id}`} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '18px', background: 'var(--card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-dim)',
                }}>
                  <Icon icon={ICON_MAP[cat.iconName]} size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{cat.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{count} live</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How privacy works */}
      <section id="privacy" style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          How Privacy Works
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
          Privacy isn&apos;t a feature we added after the fact — it&apos;s a consequence of how the app is built.
        </p>

        <div style={{
          padding: '20px 24px', background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)',
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.8, margin: 0 }}>
            When you drop a file into an Apex Studio tool, it&apos;s read into your browser&apos;s memory using the <strong>FileReader API</strong> or a <strong>Blob URL</strong>. The processing (compression, conversion, etc.) runs using browser-native APIs like <strong>Canvas</strong>, <strong>SubtleCrypto</strong>, or <strong>WebAssembly</strong>. The result is written back into memory and offered as a download. At no point does any data leave your browser tab.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { icon: 'Server',  label: 'No server upload',   desc: 'Files are never sent over the network.' },
            { icon: 'Database', label: 'No storage',         desc: 'We store nothing. No database, no file system.' },
            { icon: 'Eye',      label: 'No logging',         desc: 'No request logs capture your file contents.' },
            { icon: 'Trash2',   label: 'Cleared on close',   desc: 'Memory is released when you close the tab.' },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{
              padding: '16px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            }}>
              <Icon icon={ICON_MAP[icon]} size={16} style={{ color: 'var(--muted)', marginBottom: 10, display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} style={{
              padding: '20px 24px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{q}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Still need help */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20, padding: '28px 32px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Still need help?</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>We read every message and respond within 2 business days.</p>
        </div>
        <Link href="/contact" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 20px', background: 'var(--pill-bg)',
          color: 'var(--pill-text)', borderRadius: 'var(--radius-md)',
          fontWeight: 700, fontSize: 13, textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          <Icon icon={ICON_MAP.Mail} size={14} />
          Contact us
        </Link>
      </div>

    </main>
  );
}
