/**
 * Input — text or search variant.
 *
 * Props:
 *   variant:     'text' | 'search'  (default: 'text')
 *   onSearch:    function           (search variant only — called on btn click or Enter)
 *   searchLabel: string             (search button label, default: 'Search')
 *   All standard <input> props (value, onChange, placeholder, etc.)
 */
export default function Input({
  variant = 'text',
  onSearch,
  searchLabel = 'Search',
  className = '',
  onKeyDown,
  ...props
}) {
  if (variant === 'search') {
    const handleKey = (e) => {
      if (e.key === 'Enter' && onSearch) onSearch(e.target.value);
      onKeyDown?.(e);
    };

    return (
      <div className="search-wrap">
        <input
          type="text"
          className={`input ${className}`.trim()}
          onKeyDown={handleKey}
          {...props}
        />
        <button
          className="btn-primary search-btn"
          type="button"
          onClick={() => onSearch?.(props.value ?? '')}
        >
          {searchLabel}
        </button>
      </div>
    );
  }

  return (
    <input
      type="text"
      className={`input ${className}`.trim()}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
}
