/**
 * ─────────────────────────────────────────────────────────────────────
 * [TOOL NAME] — VIEWER / REFERENCE ARCHETYPE TEMPLATE
 * ─────────────────────────────────────────────────────────────────────
 *
 * ARCHETYPE: Viewer / Reference / Network (E)
 * Use for: reference tables (ASCII, HTTP status codes), network tools
 * (IP lookup, DNS lookup, WHOIS), metadata viewers (image EXIF),
 * and generators that produce structured output (meta tags, sitemaps).
 *
 * Two sub-variants:
 *   E1 — Static reference (no user input required, searchable table)
 *   E2 — Network/lookup (user enters a domain/IP/URL, tool fetches data)
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every [PLACEHOLDER] with real values.
 * 2. For E1: Replace REFERENCE_DATA with your static dataset.
 * 3. For E2: Implement fetchData() to call your external API.
 * 4. Remove whichever sub-variant you don't need.
 * 5. Remove this comment block before shipping.
 *
 * DO NOT
 * ──────
 * ✗ Hardcode any hex colors — use CSS custom properties
 * ✗ Import icons directly from lucide-react — use ICON_MAP
 * ✗ Use Tailwind — use the CSS classes from styles/globals.css
 * ✗ Call paid/key-gated APIs — use only free, keyless public APIs
 *
 * See docs/CODEX_PLAYBOOK.md for the full guide.
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import ToolLayout  from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon        from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { useCopyState } from '@/lib/tool-utils';

// ─────────────────────────────────────────────────────────────────────
// E1 — STATIC REFERENCE VARIANT
// Use this when the tool displays a searchable/filterable static table.
// DELETE this section if you are building an E2 (network) tool.
// ─────────────────────────────────────────────────────────────────────

// TODO: Replace with your actual reference data
const REFERENCE_DATA = [
  { code: 200, name: 'OK', description: 'The request succeeded.' },
  { code: 404, name: 'Not Found', description: 'The server cannot find the requested resource.' },
  // ... add all entries
];

export function StaticReferenceViewer() {  // TODO: rename or delete
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');  // TODO: adjust filter options

  const filtered = useMemo(() => {
    let results = REFERENCE_DATA;
    if (filter !== 'all') {
      results = results.filter((item) => /* TODO: filter logic */ true);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (item) =>
          String(item.code).includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    return results;
  }, [query, filter]);

  return (
    <ToolLayout>
      <OutputPanel>

        {/* Search input */}
        <div className="panel-label">Search</div>
        <input
          type="text"
          className="textarea"
          placeholder="Search by code, name, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
        />

        {/* Results count */}
        {query && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Reference table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item) => (
            <div
              key={item.code}
              style={{
                padding: '14px 16px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: 15 }}>
                  {item.code}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-dim)', fontSize: 14 }}>
                  {item.name}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--faint)' }}>
            <Icon icon={ICON_MAP.Search} size={28} />
            <div style={{ marginTop: 12, fontSize: 13 }}>No results for "{query}"</div>
          </div>
        )}

      </OutputPanel>

      <OptionsPanel>

        {/* Filter tabs (TODO: replace with your categories) */}
        <div className="options-label">Category</div>
        <div className="mode-toggle" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', '2xx', '3xx', '4xx', '5xx'].map((f) => (
            <button
              key={f}
              type="button"
              className={`mode-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="privacy-note">
          100% client-side · your data never leaves this device
        </div>

      </OptionsPanel>
    </ToolLayout>
  );
}


// ─────────────────────────────────────────────────────────────────────
// E2 — NETWORK / LOOKUP VARIANT
// Use this when the tool takes user input (domain/IP/URL) and fetches
// data from a public API. DELETE this section if building E1.
// ─────────────────────────────────────────────────────────────────────

// TODO: Implement this function. Call a free public API. Return result object.
async function fetchData(query) {
  // Example: DNS lookup via Google DoH
  // const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=A`);
  // if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // return await res.json();
  throw new Error('Not implemented — replace this with your API call');
}

export default function NetworkLookupTool() {  // TODO: rename component
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [copied, copy]        = useCopyState();

  const handleLookup = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await fetchData(query.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <ToolLayout>
      <OutputPanel>

        {/* Query input */}
        <div className="panel-label">
          Domain / IP / URL  {/* TODO: contextual label */}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            className="textarea"
            placeholder="example.com"  {/* TODO: contextual placeholder */}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleLookup}
            disabled={!query.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            {loading ? (
              <Icon icon={ICON_MAP.Loader2} size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Icon icon={ICON_MAP.Search} size={14} />
            )}
            {loading ? 'Looking up…' : 'Look Up'}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16 }}>
            <Icon icon={ICON_MAP.AlertCircle} size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Result — customize this section for your tool's data shape */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Result header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <Icon icon={ICON_MAP.CheckCircle2} size={16} color="var(--success)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Results for {query}
              </span>
            </div>

            {/* Data rows — add one per piece of info you want to show */}
            {/* EXAMPLE pattern for a row:
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 120 }}>IP Address</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', textAlign: 'right' }}>{result.ip}</span>
            </div>
            */}

            {/* Catch-all: show raw JSON for debugging (remove before shipping) */}
            <pre style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-md)', overflow: 'auto', maxHeight: 300 }}>
              {JSON.stringify(result, null, 2)}
            </pre>

          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <Icon icon={ICON_MAP.Globe} size={32} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Enter a domain or IP to look up</div>
          </div>
        )}

      </OutputPanel>

      <OptionsPanel>

        {/* Tool-specific filters or options */}
        {/* EXAMPLE: record type selector for DNS
        <div className="options-label">Record Type</div>
        <div className="mode-toggle" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
          {['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'].map((t) => (
            <button key={t} type="button" className={`mode-btn${recordType === t ? ' active' : ''}`} onClick={() => setRecordType(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="panel-divider" />
        */}

        {/* Copy result */}
        {result && (
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 }}
            onClick={() => copy(JSON.stringify(result, null, 2))}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        )}

        {/* Network note */}
        <div className="privacy-note">
          Queries are sent directly from your browser · no data stored on our servers
        </div>

      </OptionsPanel>
    </ToolLayout>
  );
}
