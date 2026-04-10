'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import {
  ensureUrlProtocol,
  extractLinksFromHtml,
  fetchViaCorsProxy,
  rowsToCsv,
} from '@/lib/seo-web-utils';

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--muted)',
      }}
    >
      <Icon icon={ICON_MAP.Loader2} size={26} className="spin" />
      <div style={{ fontSize: 13 }}>Extracting links…</div>
    </div>
  );
}

export default function LinkExtractor() {
  const [mode, setMode] = useState('html');
  const [input, setInput] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedHtml, setFetchedHtml] = useState('');
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    if (mode === 'html') {
      setFetchedHtml('');
      setLoading(false);
      setError(null);
    }
  }, [mode]);

  const activeHtml = mode === 'html' ? debouncedInput : fetchedHtml;
  const activeBaseUrl = mode === 'html' ? baseUrl : input;

  const links = useMemo(() => {
    if (!activeHtml.trim()) return [];
    try {
      return extractLinksFromHtml(activeHtml, activeBaseUrl);
    } catch {
      return [];
    }
  }, [activeBaseUrl, activeHtml]);

  const filteredLinks = useMemo(
    () =>
      links.filter((link) => {
        if (filter === 'all') return true;
        return link.type === filter;
      }),
    [filter, links]
  );

  const csv = rowsToCsv(filteredLinks, [
    { key: 'url', label: 'URL' },
    { key: 'text', label: 'Link Text' },
    { key: 'type', label: 'Type' },
  ]);

  const handleFetch = async () => {
    const normalizedUrl = ensureUrlProtocol(input);
    if (!normalizedUrl) {
      setError('Enter a valid URL to fetch and extract links from.');
      return;
    }

    setLoading(true);
    setError(null);
    setFetchedHtml('');

    try {
      const response = await fetchViaCorsProxy(normalizedUrl);
      const html = await response.text();
      setFetchedHtml(html);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to fetch that page.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'html' ? 'HTML Input' : 'Page URL'}
      inputPlaceholder={
        mode === 'html'
          ? '<a href="/pricing">Pricing</a>'
          : 'https://example.com'
      }
      dividerLabel="Extracted Links"
      error={mode === 'html' ? null : error}
      output={csv}
      showEmptyState={!input.trim() && mode === 'html'}
      emptyState={
        <EmptyState
          iconName="Link2"
          title="Extract links from HTML or a live page"
          message="Paste HTML for instant extraction or switch to URL mode to fetch a page through the proxy and collect anchor links."
        />
      }
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : mode === 'url' && !fetchedHtml ? (
          <EmptyState
            iconName="Link2"
            title="Fetch a page to inspect its links"
            message="Enter a public URL and use the extract action to fetch the page through the proxy before parsing its anchors."
          />
        ) : filteredLinks.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Visible',
                  value: String(filteredLinks.length),
                  description: 'Links matching the current filter',
                  iconName: 'Link2',
                },
                {
                  label: 'Internal',
                  value: String(links.filter((link) => link.type === 'internal').length),
                  description: 'Links pointing to the same origin',
                  iconName: 'Globe',
                },
                {
                  label: 'External',
                  value: String(links.filter((link) => link.type === 'external').length),
                  description: 'Links pointing away from the page',
                  iconName: 'ArrowRight',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 8 }}>
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    {link.type}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, wordBreak: 'break-word' }}>
                    {link.url}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{link.text}</div>
                </div>
              ))}
            </div>
          </>
        ) : activeHtml.trim() ? (
          <EmptyState
            iconName="Link2"
            title="No matching links found"
            message="Try a different filter or provide HTML that contains anchor tags with href values."
          />
        ) : (
          <EmptyState
            iconName="Link2"
            title="No fetched content yet"
            message="Use the fetch action to load a page and extract its links."
          />
        )
      }
      options={
        <>
          <div className="options-label">Source</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            <button type="button" className={`mode-btn${mode === 'html' ? ' active' : ''}`} onClick={() => setMode('html')}>
              HTML Paste
            </button>
            <button type="button" className={`mode-btn${mode === 'url' ? ' active' : ''}`} onClick={() => setMode('url')}>
              URL Fetch
            </button>
          </div>

          {mode === 'html' ? (
            <>
              <div className="options-label">Base URL (Optional)</div>
              <input
                type="text"
                className="textarea"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://example.com"
                style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
              />
            </>
          ) : null}

          <div className="options-label">Filter</div>
          <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              ['all', 'All'],
              ['internal', 'Internal'],
              ['external', 'External'],
              ['relative', 'Relative'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${filter === value ? ' active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-divider" />
        </>
      }
      primaryAction={
        mode === 'url'
          ? {
              label: loading ? 'Fetching…' : 'Fetch & Extract',
              iconName: loading ? 'Loader2' : 'Search',
              onClick: handleFetch,
              disabled: !input.trim() || loading,
            }
          : undefined
      }
      onClear={() => {
        setInput('');
        setBaseUrl('');
        setFilter('all');
        setFetchedHtml('');
        setLoading(false);
        setError(null);
        setMode('html');
      }}
      copyValue={filteredLinks.map((link) => link.url).join('\n')}
      copyLabel="Copy URLs"
      downloadConfig={{
        filename: 'links.csv',
        mimeType: 'text/csv;charset=utf-8',
        text: csv,
        enabled: Boolean(filteredLinks.length),
        label: 'Download CSV',
      }}
      privacyNote={
        mode === 'url'
          ? 'Uses the internal /api/proxy route to fetch public HTML before extracting links locally'
          : 'Parsing happens locally in your browser'
      }
    />
  );
}
