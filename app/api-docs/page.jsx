import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { TOOLS } from '@/lib/tools-catalog';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

export const metadata = {
  title: 'API & Developer Reference',
  description:
    'Developer reference for Apex Studio Utilities. Learn how to link directly to any tool, pass query parameters, and integrate our 170+ tools into your workflow.',
  alternates: { canonical: '/api-docs' },
};

const BASE = 'https://apexstudioutilities.com';

const URL_PARAMS = [
  { param: 'cat',   type: 'string',  example: '?cat=image-tools',  desc: 'Pre-select a category on the /tools index page.' },
  { param: 'q',     type: 'string',  example: '?q=pdf',            desc: 'Pre-populate the search bar on /tools.' },
];

const CODE_EXAMPLES = [
  {
    label: 'Link directly to a tool',
    code: `<!-- Every tool has a permanent URL -->
<a href="${BASE}/tools/image-compressor">
  Compress an image
</a>`,
  },
  {
    label: 'Open tools filtered by category',
    code: `<!-- Filter the /tools index to a category -->
<a href="${BASE}/tools?cat=developer">
  Developer tools
</a>`,
  },
  {
    label: 'Open tools with a pre-filled search',
    code: `<!-- Open /tools with a search term active -->
<a href="${BASE}/tools?q=pdf+converter">
  Search results
</a>`,
  },
];

export default function ApiDocsPage() {
  const liveTools = TOOLS.filter((t) => t.status === 'live');

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 96px' }}>

      {/* Hero */}
      <div style={{ marginBottom: 64 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: 'var(--accent-dim)',
          border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100,
          fontSize: 12, color: 'var(--accent)', fontWeight: 700,
          letterSpacing: '0.08em', marginBottom: 24,
        }}>
          <Icon icon={ICON_MAP.Code2} size={12} />
          DEVELOPER REFERENCE
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
          color: 'var(--text)', lineHeight: 1.1, marginBottom: 16,
        }}>
          API & Integration Guide
        </h1>

        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 620 }}>
          All {liveTools.length} tools are accessible via permanent, shareable URLs.
          Every tool page accepts query parameters for pre-configuration. No API key required.
        </p>
      </div>

      {/* Architecture note */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12, marginBottom: 56,
      }}>
        {[
          { icon: 'Globe',       title: 'URL-based',      desc: 'Every tool is a permanent URL. Link directly to any tool or category.' },
          { icon: 'ShieldCheck', title: 'Client-side',    desc: 'All processing runs in the browser. No server API, no upload endpoints.' },
          { icon: 'Lock',        title: 'No auth needed', desc: 'Every tool is publicly accessible. No API keys, no CORS headers to set.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            padding: '20px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          }}>
            <Icon icon={ICON_MAP[icon]} size={18} style={{ color: 'var(--accent)', marginBottom: 10, display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* URL structure */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          URL Structure
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Each tool lives at a predictable, permanent URL:
        </p>

        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 16,
          fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.02em',
        }}>
          <span style={{ color: 'var(--faint)' }}>{BASE}</span>
          <span style={{ color: 'var(--accent)' }}>/tools/</span>
          <span style={{ color: '#4ADE80' }}>[tool-slug]</span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Tool slugs are lowercase, hyphenated identifiers. For example: <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>image-compressor</code>, <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>pdf-to-word</code>, <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>base64-encoder</code>.
        </p>
      </section>

      {/* Query parameters */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Query Parameters
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          The /tools index page supports the following parameters:
        </p>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '120px 80px 1fr 1fr',
            padding: '12px 20px', background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}>
            {['Parameter', 'Type', 'Example', 'Description'].map((h) => (
              <span key={h} style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</span>
            ))}
          </div>
          {URL_PARAMS.map(({ param, type, example, desc }, i) => (
            <div key={param} style={{
              display: 'grid', gridTemplateColumns: '120px 80px 1fr 1fr',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: i < URL_PARAMS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)' }}>{param}</code>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{type}</span>
              <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ADE80' }}>{example}</code>
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Code examples */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
          Code Examples
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CODE_EXAMPLES.map(({ label, code }) => (
            <div key={label} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 16px', background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em',
                textTransform: 'uppercase', fontWeight: 700,
              }}>{label}</div>
              <pre style={{
                margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: 13,
                color: 'var(--text-dim)', lineHeight: 1.7, overflowX: 'auto',
              }}>{code}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* Tool slug directory */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Tool Slug Directory
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
          {liveTools.length} live tools across {CATEGORIES.length} categories.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {CATEGORIES.map((cat) => {
            const catTools = liveTools.filter((t) => t.category === cat.id);
            if (catTools.length === 0) return null;
            return (
              <div key={cat.id}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 12, paddingBottom: 10,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <Icon icon={ICON_MAP[cat.iconName]} size={14} style={{ color: 'var(--muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 4 }}>{catTools.length} tools</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {catTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)',
                        fontSize: 12, color: 'var(--muted)', textDecoration: 'none',
                        fontFamily: 'monospace', transition: 'color 0.15s, border-color 0.15s',
                      }}
                    >
                      {tool.slug}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Planned API */}
      <div style={{
        padding: '28px', background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            padding: '4px 10px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 100,
            fontSize: 10, color: 'var(--faint)', letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>Coming soon</div>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Programmatic API
        </h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
          We&apos;re working on a REST API that exposes our conversion and processing tools programmatically — for use in CI/CD pipelines, scripts, and application integrations. It will be free for reasonable usage.
        </p>
        <Link href="/contact" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', background: 'var(--surface)',
          border: '1px solid var(--border)', color: 'var(--text)',
          borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          <Icon icon={ICON_MAP.Mail} size={14} />
          Request early access
        </Link>
      </div>

    </main>
  );
}
