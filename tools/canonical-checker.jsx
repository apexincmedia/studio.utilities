'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import {
  EmptyState,
  ErrorCallout,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import {
  ensureUrlProtocol,
  extractCanonicalFromHeader,
  extractCanonicalFromHtml,
  fetchViaCorsProxy,
  normalizeComparableUrl,
} from '@/lib/seo-web-utils';

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--muted)',
      }}
    >
      <Icon icon={ICON_MAP.Loader2} size={26} className="spin" />
      <div style={{ fontSize: 13 }}>Checking canonical signals…</div>
    </div>
  );
}

export default function CanonicalChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const handleLookup = async () => {
    const normalizedUrl = ensureUrlProtocol(url);
    if (!normalizedUrl) {
      setError('Enter a valid public URL to inspect.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchViaCorsProxy(normalizedUrl);
      const html = await response.text();
      const headerCanonicalRaw = extractCanonicalFromHeader(response.headers.get('link') ?? '');
      const htmlCanonicalRaw = extractCanonicalFromHtml(html);
      const resolvedHeaderCanonical = headerCanonicalRaw
        ? new URL(headerCanonicalRaw, normalizedUrl).toString()
        : '';
      const resolvedHtmlCanonical = htmlCanonicalRaw
        ? new URL(htmlCanonicalRaw, normalizedUrl).toString()
        : '';
      const canonicalUrl = resolvedHeaderCanonical || resolvedHtmlCanonical;
      const finalComparable = normalizeComparableUrl(normalizedUrl);
      const canonicalComparable = normalizeComparableUrl(canonicalUrl);

      setResult({
        inputUrl: normalizedUrl,
        canonicalUrl,
        htmlCanonical: resolvedHtmlCanonical,
        headerCanonical: resolvedHeaderCanonical,
        source: resolvedHeaderCanonical ? 'HTTP Header' : resolvedHtmlCanonical ? 'HTML' : 'None',
        isSelfReferencing: Boolean(canonicalComparable && canonicalComparable === finalComparable),
        matchesInput: Boolean(canonicalComparable && canonicalComparable === normalizeComparableUrl(normalizedUrl)),
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to inspect that page.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `Input URL: ${result.inputUrl}`,
        `Canonical URL: ${result.canonicalUrl || 'Not found'}`,
        `Source: ${result.source}`,
        `Self-referencing: ${result.isSelfReferencing ? 'Yes' : 'No'}`,
        `Matches input: ${result.matchesInput ? 'Yes' : 'No'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Page URL</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="textarea"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/page"
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleLookup}
            disabled={!url.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.Search} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        <ErrorCallout message={error} />

        {loading ? (
          <LoadingState />
        ) : result ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Canonical',
                  value: result.canonicalUrl ? 'Found' : 'Missing',
                  description: 'Whether a canonical signal was detected',
                  tone: result.canonicalUrl ? 'success' : 'warning',
                  iconName: 'Search',
                },
                {
                  label: 'Source',
                  value: result.source,
                  description: 'Header canonicals override HTML canonicals here',
                  iconName: 'FileCode',
                },
                {
                  label: 'Self-Ref',
                  value: result.isSelfReferencing ? 'Yes' : 'No',
                  description: 'Whether the canonical points back to the same URL',
                  tone: result.isSelfReferencing ? 'success' : 'warning',
                  iconName: 'CheckCircle2',
                },
                {
                  label: 'Matches Input',
                  value: result.matchesInput ? 'Yes' : 'No',
                  description: 'Normalized canonical compared with your input URL',
                  tone: result.matchesInput ? 'success' : 'warning',
                  iconName: 'Globe',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Canonical URL', result.canonicalUrl || 'No canonical tag or header found'],
                ['HTML Canonical', result.htmlCanonical || 'Not present'],
                ['Header Canonical', result.headerCanonical || 'Not present'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-word', lineHeight: 1.6 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Search"
            title="Inspect a page&apos;s canonical signals"
            message="Enter a public URL to check for rel=canonical tags and header canonicals without leaving the workspace."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Uses the internal `/api/proxy` route to fetch public HTML and headers before analyzing the canonical signals locally.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(report)}
            disabled={!report}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy Report'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setUrl('');
              setResult(null);
              setError(null);
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'canonical-report.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
