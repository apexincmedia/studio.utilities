import Link from 'next/link';

/**
 * Card — standard or accent variant.
 *
 * Props:
 *   variant:  'standard' | 'accent'  (default: 'standard')
 *   href:     string                  (renders as <Link> if provided)
 *   featured: bool                    (adds extra padding for featured cards)
 *   className: string
 *   children: ReactNode
 */
export default function Card({
  variant = 'standard',
  href,
  featured = false,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'card',
    variant === 'accent' ? 'card-accent' : '',
    featured ? 'card-featured' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
