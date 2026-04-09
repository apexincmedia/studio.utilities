import { notFound } from 'next/navigation';
import { getToolBySlug, TOOLS } from '@/lib/tools-catalog';
import { getToolComponent } from '@/lib/tools-registry';
import ToolPageShell from '@/components/tool/ToolPageShell';
import ComingSoonTool from '@/components/tool/ComingSoonTool';

// Generate static params for all tools at build time
export async function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

// Per-tool SEO metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: 'Tool Not Found' };

  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
    openGraph: {
      title: `${tool.name} | Apex Studio Utilities`,
      description: tool.description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${tool.name} | Apex Studio Utilities`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  const ToolComponent = getToolComponent(slug);

  return (
    <ToolPageShell tool={tool}>
      {tool.status === 'live' && ToolComponent ? (
        <ToolComponent />
      ) : (
        <ComingSoonTool name={tool.name} />
      )}
    </ToolPageShell>
  );
}
