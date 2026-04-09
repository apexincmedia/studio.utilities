/**
 * Tag — mini uppercase pill badge.
 *
 * Props:
 *   children: ReactNode
 *   className: string
 */
export default function Tag({ children, className = '' }) {
  return (
    <span className={`tag ${className}`.trim()}>
      {children}
    </span>
  );
}
