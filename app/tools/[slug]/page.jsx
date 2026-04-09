import { notFound } from 'next/navigation';
import { getToolBySlug, TOOLS } from '@/lib/tools-catalog';
import { getToolComponent } from '@/lib/tools-registry';
import ToolPageShell from '@/components/tool/ToolPageShell';
import ComingSoonTool from '@/components/tool/ComingSoonTool';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apexstudioutilities.com';

// Pre-render every tool page at build time
export async function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

// Rich per-tool SEO metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: 'Tool Not Found' };

  const url = `${BASE_URL}/tools/${slug}`;
  const title = `${tool.name} — Free Online ${tool.tag} Tool`;

  return {
    title:       tool.name,
    description: tool.longDescription || tool.description,
    keywords:    [...(tool.keywords ?? []), 'free online tool', 'browser tool', 'no signup', tool.tag.toLowerCase()],

    alternates: { canonical: url },

    openGraph: {
      type:        'website',
      url,
      siteName:    'Apex Studio Utilities',
      title,
      description: tool.description,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },

    twitter: {
      card:        'summary_large_image',
      title,
      description: tool.description,
      images:      ['/opengraph-image'],
    },
  };
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const ToolComponent = getToolComponent(slug);

  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'SoftwareApplication',
    name:          tool.name,
    url:          `${BASE_URL}/tools/${slug}`,
    description:   tool.longDescription || tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem:     'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: tool.keywords?.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolPageShell tool={tool}>
        {tool.status === 'live' && ToolComponent ? (
          <ToolComponent />
        ) : (
          <ComingSoonTool name={tool.name} />
        )}
      </ToolPageShell>
    </>
  );
}
