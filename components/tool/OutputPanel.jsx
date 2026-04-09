/**
 * OutputPanel — left column container for tool input/output area.
 *
 * Props:
 *   children:  ReactNode
 *   className: string
 */
export default function OutputPanel({ children, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {children}
    </section>
  );
}
