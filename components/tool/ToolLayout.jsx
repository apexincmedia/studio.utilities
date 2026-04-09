/**
 * ToolLayout — 65/35 two-column grid.
 * Left: OutputPanel (input + results).  Right: OptionsPanel (settings).
 * Stacks vertically below 900px, options on top.
 *
 * Props:
 *   children: [OutputPanel, OptionsPanel]  (order matters — first is left)
 */
export default function ToolLayout({ children }) {
  return (
    <div className="tool-layout">
      {children}
    </div>
  );
}
