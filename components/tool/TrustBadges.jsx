import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

const BADGES = [
  { iconName: 'ShieldCheck', label: 'Client-side' },
  { iconName: 'Zap',         label: 'Instant' },
  { iconName: 'Lock',        label: 'No signup' },
  { iconName: 'Check',       label: 'Free forever' },
];

export default function TrustBadges() {
  return (
    <div className="trust-badges">
      {BADGES.map(({ iconName, label }) => (
        <span key={label} className="trust-badge">
          <Icon icon={ICON_MAP[iconName]} size={13} />
          {label}
        </span>
      ))}
    </div>
  );
}
