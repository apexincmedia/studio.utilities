/**
 * SectionLabel — uppercase muted section heading.
 *
 * Props:
 *   children: ReactNode
 *   className: string
 */
export default function SectionLabel({ children, className = '' }) {
  return (
    <p className={`section-label ${className}`.trim()}>
      {children}
    </p>
  );
}
