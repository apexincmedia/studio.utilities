import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import TrustBadges from '@/components/tool/TrustBadges';

/**
 * ToolHeader — centered tool page hero with icon, category tag, title,
 * description, and trust badges.
 */
export default function ToolHeader({ tool }) {
  const icon = ICON_MAP[tool.iconName] ?? ICON_MAP.Zap;

  return (
    <header className="tool-header">
      {/* Icon — elevated with glow */}
      <div className="tool-header-icon">
        <Icon icon={icon} size={28} />
      </div>

      {/* Category tag + breadcrumb-style label */}
      <div className="tool-header-meta">
        <span className="tag">{tool.tag}</span>
      </div>

      {/* Title */}
      <h1 className="tool-header-title">{tool.name}</h1>

      {/* Long description when available, fallback to short */}
      <p className="tool-header-desc">
        {tool.longDescription || tool.description}
      </p>

      {/* Trust badges */}
      <TrustBadges />
    </header>
  );
}
