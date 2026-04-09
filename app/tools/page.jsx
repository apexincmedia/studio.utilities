'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TOOLS, searchTools } from '@/lib/tools-catalog';
import { CATEGORIES } from '@/lib/categories';
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

// ── Inner component — must be inside <Suspense> because it uses useSearchParams ──
function ToolsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Sync URL params on load
  useEffect(() => {
    const q   = searchParams.get('q')   || '';
    const cat = searchParams.get('cat') || 'all';
    setQuery(q);
    setActiveCategory(cat);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let results = query ? searchTools(query) : TOOLS;
    if (activeCategory !== 'all') {
      results = results.filter((t) => t.category === activeCategory);
    }
    return results;
  }, [query, activeCategory]);

  // Group by category (preserve CATEGORIES order)
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((tool) => {
      if (!map[tool.category]) map[tool.category] = [];
      map[tool.category].push(tool);
    });
    return map;
  }, [filtered]);

  const totalLive = TOOLS.filter((t) => t.status === 'live').length;

  // Scroll sidebar category into view when active changes
  const handleSidebarClick = (id) => {
    setActiveCategory(id);
    setQuery('');
    // Smooth scroll to section
    if (id !== 'all') {
      const el = document.getElementById(`cat-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="tools-index">
      {/* PAGE HEADER */}
      <div style={{ padding: '60px 0 40px', textAlign: 'center' }}>
        <div className="hero-tag" style={{ display: 'inline-block', marginBottom: 20 }}>
          {TOOLS.length}+ Tools
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', marginBottom: 12 }}>
          All Tools
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 440, margin: '0 auto' }}>
          {totalLive} live · {TOOLS.length - totalLive} coming soon.
          Every tool is free, no account needed.
        </p>
      </div>

      {/* SEARCH */}
      <div className="tools-search-wrap">
        <div className="search-wrap">
          <input
            type="text"
            className="input"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveCategory('all'); }}
          />
          {query && (
            <button
              className="btn-primary search-btn"
              type="button"
              onClick={() => setQuery('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* RESULTS COUNT */}
      {query && (
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24, letterSpacing: '0.04em' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* LAYOUT: sidebar + content */}
      <div className="tools-layout">

        {/* STICKY SIDEBAR — desktop only */}
        <aside className="tools-sidebar">
          <div className="tools-sidebar-label">Categories</div>

          <button
            type="button"
            className={`tools-sidebar-btn${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => handleSidebarClick('all')}
          >
            <Icon icon={ICON_MAP.Layers} size={15} />
            All Tools
            <span className="tools-sidebar-count">{TOOLS.length}</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`tools-sidebar-btn${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => handleSidebarClick(cat.id)}
            >
              <Icon icon={ICON_MAP[cat.iconName]} size={15} />
              {cat.name}
              <span className="tools-sidebar-count">{cat.count}</span>
            </button>
          ))}
        </aside>

        {/* TOOL GROUPS */}
        <div>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontSize: 14 }}>
              No tools found for &ldquo;{query}&rdquo;. Try a different search.
            </div>
          ) : (
            CATEGORIES.filter((cat) => grouped[cat.id]?.length > 0).map((cat) => (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <div className="tools-category-header">
                  <Icon icon={ICON_MAP[cat.iconName]} size={18} color="var(--text-dim)" />
                  <h2>{cat.name}</h2>
                  <span className="cat-count">{grouped[cat.id].length} tools</span>
                </div>

                <div className="tool-grid" style={{ marginBottom: 8 }}>
                  {grouped[cat.id].map((tool) => {
                    const isLive = tool.status === 'live';
                    const icon   = ICON_MAP[tool.iconName] ?? ICON_MAP.Zap;

                    return (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className={`tool-card${isLive ? '' : ' coming-soon'}`}
                        aria-disabled={!isLive}
                        tabIndex={isLive ? undefined : -1}
                      >
                        <div className="tool-card-header">
                          <div className="tool-card-icon">
                            <Icon icon={icon} size={18} />
                          </div>
                          {isLive ? (
                            <span className="badge badge-live" style={{ fontSize: 10, padding: '2px 8px' }}>Live</span>
                          ) : (
                            <span className="badge badge-coming-soon" style={{ fontSize: 10, padding: '2px 8px' }}>Soon</span>
                          )}
                        </div>
                        <div className="tool-card-name">{tool.name}</div>
                        <div className="tool-card-desc">{tool.description}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Outer page wraps content in Suspense (required by Next.js for useSearchParams) ──
export default function ToolsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--muted)' }}>
        Loading tools...
      </div>
    }>
      <ToolsContent />
    </Suspense>
  );
}
