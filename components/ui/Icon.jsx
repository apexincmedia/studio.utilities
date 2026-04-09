/**
 * Icon — thin wrapper around Lucide React icons.
 *
 * Usage:
 *   import Icon from '@/components/ui/Icon';
 *   import { ICON_MAP } from '@/lib/icons';
 *   <Icon icon={ICON_MAP.Download} size={20} />
 *
 * Props:
 *   icon:        Lucide component (required)
 *   size:        number (default 18)
 *   color:       string (default 'currentColor')
 *   strokeWidth: number (default 1.75)
 *   className:   string
 */
export default function Icon({
  icon: LucideIcon,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.75,
  className = '',
  style,
}) {
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}
