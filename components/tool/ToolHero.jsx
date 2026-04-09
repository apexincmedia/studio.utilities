import Tag from '@/components/ui/Tag';

/**
 * ToolHero — tag + title + description block shown at top of every tool page.
 *
 * Props:
 *   tag:         string  e.g. 'Encoding'
 *   title:       string  e.g. 'Base64 Encoder / Decoder'
 *   description: string  1–2 sentence description
 */
export default function ToolHero({ tag, title, description }) {
  return (
    <div className="tool-hero">
      {tag && <Tag>{tag}</Tag>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
