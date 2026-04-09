'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearchClient() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    const q = query.trim();
    if (q) router.push(`/tools?q=${encodeURIComponent(q)}`);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="search-wrap" style={{ maxWidth: 560, margin: '0 auto 20px' }}>
      <input
        type="text"
        className="input"
        placeholder="Search 150+ tools — try 'PDF to PNG' or 'Base64'..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        style={{ paddingRight: 100 }}
      />
      <button className="btn-primary search-btn" type="button" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}
