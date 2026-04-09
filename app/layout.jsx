import '@/styles/globals.css';
import PageShell from '@/components/layout/PageShell';

export const metadata = {
  title: {
    default: 'Apex Studio Utilities — 150+ Free Web Tools',
    template: '%s | Apex Studio Utilities',
  },
  description:
    'Convert, compress, encode, decode, transform, and generate. 150+ free tools. No account required. Files never leave your device.',
  keywords: ['free online tools', 'file converter', 'pdf converter', 'image compressor', 'base64 encoder', 'json formatter'],
  authors: [{ name: 'Apex' }],
  openGraph: {
    title: 'Apex Studio Utilities — 150+ Free Web Tools',
    description: 'Convert, compress, encode, decode, transform, and generate. 150+ free tools. No account required. Files never leave your device.',
    type: 'website',
    siteName: 'Apex Studio Utilities',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apex Studio Utilities — 150+ Free Web Tools',
    description: 'Convert, compress, encode, decode, transform, and generate. 150+ free tools. No signup ever.',
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
      </head>
      <body>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
