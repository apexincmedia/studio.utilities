/**
 * Badge — status indicator.
 *
 * Props:
 *   variant: 'success' | 'error' | 'pending' | 'coming-soon'
 *   children: ReactNode  (defaults to the variant label if not provided)
 */
const LABELS = {
  success:      'Success',
  error:        'Error',
  pending:      'Processing',
  'coming-soon': 'Coming Soon',
};

export default function Badge({ variant = 'pending', children }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children ?? LABELS[variant] ?? variant}
    </span>
  );
}
