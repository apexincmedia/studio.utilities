const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexstudioutilities.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      // Block AI training crawlers
      { userAgent: 'GPTBot',       disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'Claude-Web',   disallow: '/' },
      { userAgent: 'CCBot',        disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Bytespider',   disallow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host:    BASE_URL,
  };
}
