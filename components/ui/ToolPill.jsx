import Link from 'next/link';

/**
 * ToolPill — quick-access clickable pill that links to a tool page.
 *
 * Props:
 *   slug:  string   e.g. 'base64-encoder'
 *   label: string   e.g. 'Base64 Encoder'
 */
export default function ToolPill({ slug, label }) {
  return (
    <Link href={`/tools/${slug}`} className="tool-pill">
      {label}
    </Link>
  );
}
