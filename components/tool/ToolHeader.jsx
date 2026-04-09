import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';
import TrustBadges from '@/components/tool/TrustBadges';

/**
 * ToolHeader — centered tool page hero with icon, category tag, title,
 * description, and trust badges. Consistent with original centered layout.
 *
 * Props:
 *   tool:  full tool object from tools-catalog
 */
export default function ToolHeader({ tool }) {
  const icon = ICON_MAP[tool.iconName] ?? ICON_MAP.Zap;

  return (
    <header className="tool-header">
      {/* Icon */}
      <div className="tool-header-icon">
        <Icon icon={icon} size={28} />
      </div>

      {/* Category tag */}
      <div className="tool-header-meta">
        <span className="tag">{tool.tag}</span>
      </div>

      {/* Title */}
      <h1 className="tool-header-title">{tool.name}</h1>

      {/* Description */}
      <p className="tool-header-desc">{tool.description}</p>

      {/* Trust badges */}
      <TrustBadges />
    </header>
  );
}
