import Link from 'next/link';

/**
 * Button — primary or ghost variant.
 *
 * Props:
 *   variant: 'primary' | 'ghost'  (default: 'primary')
 *   href:    string                (renders as <Link> if provided)
 *   onClick: function
 *   disabled: bool
 *   type:    'button' | 'submit'  (default: 'button')
 *   className: string             (extra classes, use sparingly)
 *   children: ReactNode
 */
export default function Button({
  variant = 'primary',
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const cls = `${variant === 'ghost' ? 'btn-ghost' : 'btn-primary'} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
