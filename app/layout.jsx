import '@/styles/globals.css';
import PageShell from '@/components/layout/PageShell';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexstudioutilities.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default:  'Apex Studio Utilities — 170+ Free Online Tools',
    template: '%s | Apex Studio Utilities',
  },

  description:
    'Convert files, compress images, encode/decode text, generate QR codes, format JSON, check passwords — 170+ free browser tools. No account, no upload limit, no watermarks. Files never leave your device.',

  keywords: [
    'free online tools', 'file converter', 'pdf converter', 'image compressor',
    'base64 encoder', 'json formatter', 'qr code generator', 'password generator',
    'image resizer', 'pdf to png', 'compress image', 'word to pdf', 'url encoder',
    'hash generator', 'uuid generator', 'unit converter', 'text tools', 'developer tools',
    'heic to jpg', 'ocr tool', 'mp4 to gif', 'youtube to mp3', 'regex tester',
    'css gradient generator', 'color contrast checker', 'jwt decoder', 'slug generator',
  ],

  authors:  [{ name: 'Apex Studio', url: BASE_URL }],
  creator:  'Apex Studio',
  publisher:'Apex Studio',

  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  openGraph: {
    type:        'website',
    siteName:    'Apex Studio Utilities',
    url:          BASE_URL,
    title:       'Apex Studio Utilities — 170+ Free Online Tools',
    description: 'Convert, compress, encode, decode, generate. 170+ free browser tools. No account required. Files never leave your device.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Apex Studio Utilities' }],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Apex Studio Utilities — 170+ Free Online Tools',
    description: 'Convert, compress, encode, decode. 170+ free tools. No signup ever.',
    images:      ['/opengraph-image'],
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
    icon:  [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
  },
};

const jsonLd = {
  '@context':   'https://schema.org',
  '@type':      'WebSite',
  name:         'Apex Studio Utilities',
  url:           BASE_URL,
  description:  'Convert, compress, encode, decode, transform — 170+ free browser tools.',
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${BASE_URL}/tools?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#08080D" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
