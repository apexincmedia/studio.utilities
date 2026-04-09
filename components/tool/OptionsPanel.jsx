/**
 * OptionsPanel — right column container for tool settings.
 *
 * Props:
 *   children:  ReactNode
 *   className: string
 */
export default function OptionsPanel({ children, className = '' }) {
  return (
    <aside className={`panel ${className}`.trim()}>
      {children}
    </aside>
  );
}
