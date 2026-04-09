import React from 'react';

/**
 * StatRow — wraps multiple StatBlocks with dividers between them.
 *
 * Usage:
 *   <StatRow>
 *     <StatBlock value="150+" label="Tools" />
 *     <StatBlock value="100%" label="Free" />
 *   </StatRow>
 */
export function StatRow({ children }) {
  const items = React.Children.toArray(children);
  const withDividers = items.flatMap((child, i) =>
    i < items.length - 1
      ? [child, <div key={`div-${i}`} className="stat-divider" />]
      : [child]
  );

  return <div className="stat-row">{withDividers}</div>;
}

/**
 * StatBlock — a number + label pair.
 *
 * Props:
 *   value: string | number   e.g. '150+'
 *   label: string            e.g. 'Tools'
 */
export default function StatBlock({ value, label }) {
  return (
    <div className="stat">
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
