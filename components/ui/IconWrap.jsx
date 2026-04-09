/**
 * IconWrap — 40×40 icon container with surface background.
 *
 * Props:
 *   children: ReactNode  (emoji or SVG)
 *   className: string
 */
export default function IconWrap({ children, className = '' }) {
  return (
    <div className={`icon-wrap ${className}`.trim()}>
      {children}
    </div>
  );
}
