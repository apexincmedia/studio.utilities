export const metadata = {
  title: 'Terms of Service',
  description:
    'Terms of service for Apex Studio Utilities. Free to use, no warranty. All tools are provided as-is for personal and commercial use.',
  alternates: { canonical: '/terms' },
};

const LAST_UPDATED = 'April 9, 2026';

const sections = [
  {
    heading: 'Acceptance of terms',
    body: `By accessing or using Apex Studio Utilities ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.`,
  },
  {
    heading: 'Description of service',
    body: `Apex Studio Utilities provides browser-based utility tools for file conversion, image processing, text manipulation, encoding/decoding, and related tasks. All tools are provided free of charge. Processing occurs client-side in your browser; we do not receive or store your files.`,
  },
  {
    heading: 'Permitted use',
    body: `You may use the Service for any lawful personal or commercial purpose. You may not: (a) use the Service to process unlawful content; (b) attempt to reverse-engineer, scrape at scale, or interfere with the Service; (c) use automated scripts to abuse the Service in a way that degrades performance for other users.`,
  },
  {
    heading: 'Intellectual property',
    body: `The Apex Studio Utilities interface, branding, and code are the property of Apex Studio. The tools are provided for your use but may not be reproduced or resold as a standalone product. Output files you generate using the tools belong to you.`,
  },
  {
    heading: 'No warranty',
    body: `The Service is provided "as is" without warranty of any kind. We do not guarantee that every tool will produce perfect results for every input, or that the Service will be available without interruption. Use the output of any tool at your own discretion and verify critical conversions independently.`,
  },
  {
    heading: 'Limitation of liability',
    body: `To the maximum extent permitted by law, Apex Studio shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to data loss, file corruption, or errors in converted output.`,
  },
  {
    heading: 'Third-party services',
    body: `Some tools query free third-party APIs (exchange rates, DNS, IP geolocation, etc.). We are not responsible for the accuracy, availability, or uptime of these external services. Results returned by third-party APIs are outside our control.`,
  },
  {
    heading: 'Changes to terms',
    body: `We reserve the right to modify these terms at any time. Changes will be reflected by updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance.`,
  },
  {
    heading: 'Governing law',
    body: `These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved in the appropriate courts of jurisdiction.`,
  },
  {
    heading: 'Contact',
    body: `Questions about these terms? Use the contact form at /contact.`,
  },
];

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>

      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Last updated: {LAST_UPDATED}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, marginBottom: 16 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7 }}>
          Plain-language terms for using Apex Studio Utilities. We've kept them short and readable.
        </p>
      </div>

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
