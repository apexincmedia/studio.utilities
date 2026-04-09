import Link from 'next/link';
import { getRelatedTools } from '@/lib/tools-catalog';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

/**
 * RelatedTools — "More tools like this" grid at bottom of every tool page.
 *
 * Props:
 *   slugs: string[] — relatedTo array from tool catalog entry
 */
export default function RelatedTools({ slugs }) {
  if (!slugs || slugs.length === 0) return null;

  const tools = getRelatedTools(slugs);
  if (tools.length === 0) return null;

  return (
    <section className="related-tools">
      <div className="related-tools-header">
        <span className="related-tools-title">More tools like this</span>
        <Link href="/tools" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Browse all
        </Link>
      </div>

      <div className="related-tools-grid">
        {tools.map((tool) => {
          const icon = ICON_MAP[tool.iconName] ?? ICON_MAP.Zap;
          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="related-tool-card">
              <div className="related-tool-icon">
                <Icon icon={icon} size={20} />
              </div>
              <div className="related-tool-name">{tool.name}</div>
              <div className="related-tool-category">{tool.tag}</div>
              <div className="related-tool-arrow">
                Try it
                <Icon icon={ICON_MAP.ArrowRight} size={11} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
