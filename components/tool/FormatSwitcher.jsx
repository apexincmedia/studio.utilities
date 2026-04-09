'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';

/**
 * FormatSwitcher — conversion bar showing [INPUT] → [OUTPUT OPTIONS].
 * Sits between ToolHeader and ToolLayout on conversion tool pages.
 *
 * - Input format: non-interactive label (fixed by current slug)
 * - Output format: clickable pills; active pill highlighted
 * - Switching updates URL via router.replace() — preserving individual slugs for SEO
 *
 * Only renders when tool.outputFormats has 2+ entries.
 *
 * Props:
 *   tool:        full tool object (needs slug, outputFormats, inputFormat)
 *   currentSlug: the slug for the current page
 *   allTools:    full TOOLS array (used to verify sibling slugs exist)
 */
export default function FormatSwitcher({ tool, currentSlug, allTools }) {
  const router = useRouter();

  if (!tool.outputFormats || tool.outputFormats.length < 2) return null;

  // Derive the input format: prefer explicit field, fall back to slug prefix
  const inputFmt = (tool.inputFormat ?? currentSlug.split('-to-')[0] ?? '').toUpperCase();

  // The currently active output format (from the current slug)
  const activeOutput = (currentSlug.split('-to-')[1] ?? '').toLowerCase();

  // Build output options from outputFormats in catalog
  const input = inputFmt.toLowerCase();
  const options = tool.outputFormats.map((fmt) => {
    const targetSlug = `${input}-to-${fmt.toLowerCase()}`;
    const exists     = allTools?.some((t) => t.slug === targetSlug) ?? true;
    return { fmt: fmt.toLowerCase(), label: fmt.toUpperCase(), slug: targetSlug, exists };
  }).filter((o) => o.exists);

  if (options.length < 2) return null;

  return (
    <div className="format-switcher-bar">
      <div className="format-switcher-inner">
        {/* Input format — non-interactive */}
        <div className="format-switcher-from">
          <span className="format-switcher-from-label">Convert</span>
          <span className="format-pill format-pill--from">{inputFmt}</span>
        </div>

        {/* Arrow */}
        <div className="format-switcher-arrow">
          <Icon icon={ICON_MAP.ArrowRight} size={16} />
        </div>

        {/* Output options */}
        <div className="format-switcher-to">
          <span className="format-switcher-to-label">To</span>
          <div className="format-switcher-options">
            {options.map(({ fmt, label, slug }) => {
              const isActive = fmt === activeOutput;
              return (
                <button
                  key={fmt}
                  className={`format-pill${isActive ? ' format-pill--active' : ''}`}
                  onClick={() => {
                    if (!isActive) router.replace(`/tools/${slug}`);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Convert ${inputFmt} to ${label}`}
                >
                  {isActive && (
                    <Icon icon={ICON_MAP.Check} size={11} />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
