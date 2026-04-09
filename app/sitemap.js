import { TOOLS } from '@/lib/tools-catalog';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexstudioutilities.com';

export default function sitemap() {
  const now = new Date().toISOString();

  // Static pages
  const staticPages = [
    { url: BASE_URL,              lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/tools`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/about`,   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
  ];

  // One entry per live tool
  const toolPages = TOOLS
    .filter((t) => t.status === 'live')
    .map((tool) => ({
      url:             `${BASE_URL}/tools/${tool.slug}`,
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        tool.featured ? 0.85 : 0.7,
    }));

  return [...staticPages, ...toolPages];
}
