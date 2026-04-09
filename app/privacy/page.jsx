export const metadata = {
  title: 'Privacy Policy',
  description:
    'Apex Studio Utilities processes all files and data entirely in your browser. We collect no personal information, store no files, and use no tracking cookies.',
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = 'April 9, 2026';

const sections = [
  {
    heading: 'The short version',
    body: `Apex Studio Utilities is a client-side web application. All file processing, text transformation, and data computation happens locally in your browser using Web APIs (Canvas, FileReader, SubtleCrypto, WebAssembly, etc.). We do not receive, store, or transmit your files or data to any server — because we don't process them on a server at all.`,
  },
  {
    heading: 'What we collect',
    body: `We collect nothing. No name, no email, no account details, no payment information. Using any tool on this site requires zero personal information from you.`,
  },
  {
    heading: 'Cookies and tracking',
    body: `We do not use tracking cookies, advertising pixels, or fingerprinting scripts. We may use a single session-preference cookie (e.g., to remember UI settings like dark mode) that contains no personal data and is never shared with third parties.`,
  },
  {
    heading: 'Analytics',
    body: `If we use analytics in the future, it will be privacy-respecting, cookieless analytics (such as Plausible or Fathom) that collects only aggregate page view counts — no individual user data, no IP addresses stored, no cross-site tracking.`,
  },
  {
    heading: 'Your files',
    body: `Files you upload are processed entirely within your browser's memory. They are never sent to our servers, never logged, and never stored. When you close the browser tab, they are gone. This applies to every tool: PDF converters, image compressors, OCR, audio converters, and all others.`,
  },
  {
    heading: 'Third-party services',
    body: `Some tools make requests to free public APIs on your behalf to provide their functionality (for example, the Currency Converter fetches exchange rates from frankfurter.app, the DNS Lookup queries dns.google, and the IP Lookup queries ip-api.com). These requests are made directly from your browser, not via our servers, and are subject to those services' own privacy policies. No personal information is included in these requests.`,
  },
  {
    heading: 'External links',
    body: `This site may link to external resources. We are not responsible for the privacy practices of those sites.`,
  },
  {
    heading: 'Children',
    body: `This service is not directed at children under 13. We do not knowingly collect information from children.`,
  },
  {
    heading: 'Changes to this policy',
    body: `If we make material changes to this policy, we will update the "Last updated" date at the top of this page. Continued use of the site after changes constitutes acceptance of the updated policy.`,
  },
  {
    heading: 'Contact',
    body: `If you have any questions about this privacy policy, please use the contact form at /contact.`,
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>

      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Last updated: {LAST_UPDATED}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 16 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7 }}>
          Your privacy is fundamental to how Apex Studio Utilities is built — not as an afterthought, but as an architectural decision. Here's everything you need to know.
        </p>
      </div>

      {/* TL;DR card */}
      <div style={{ padding: '20px 24px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-lg)', marginBottom: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 8 }}>TL;DR</div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          <li>All processing happens in your browser — files never leave your device</li>
          <li>We collect zero personal information</li>
          <li>No tracking cookies, no ad pixels, no fingerprinting</li>
          <li>No account required for any tool</li>
        </ul>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {sections.map(({ heading, body }) => (
          <div key={heading}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              {heading}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
              {body}
            </p>
          </div>
        ))}
      </div>

    </main>
  );
}
