import Link from 'next/link';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import ToolHeader from '@/components/tool/ToolHeader';
import FormatSwitcher from '@/components/tool/FormatSwitcher';
import RelatedTools from '@/components/tool/RelatedTools';
import { TOOLS } from '@/lib/tools-catalog';

/**
 * ToolPageShell — wraps every tool page with:
 *   breadcrumb → ToolHeader → optional FormatSwitcher → children → RelatedTools
 *
 * Props:
 *   tool:     full tool object from tools-catalog (required)
 *   children: ReactNode (ToolLayout + panels)
 */
export default function ToolPageShell({ tool, children }) {
  return (
    <>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 40px 0' }}>
        <Link href="/tools" className="tool-breadcrumb">
          <Icon icon={ICON_MAP.ArrowLeft} size={14} />
          All Tools
        </Link>
      </div>

      {/* Tool header — icon, title, category tag, trust badges, description */}
      <ToolHeader tool={tool} />

      {/* Format switcher — only rendered when outputFormats is defined */}
      {tool.outputFormats && tool.outputFormats.length > 1 && (
        <FormatSwitcher tool={tool} currentSlug={tool.slug} allTools={TOOLS} />
      )}

      {/* Tool content (ToolLayout + panels) */}
      {children}

      {/* Related tools grid */}
      <RelatedTools slugs={tool.relatedTo} />
    </>
  );
}
