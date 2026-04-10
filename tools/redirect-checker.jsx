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
      <div style={{ fontSize: 13 }}>Tracing redirect behavior…</div>
    </div>
  );
}

export default function RedirectChecker() {
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
      const finalUrlHeader =
        response.headers.get('x-final-url') ||
        response.headers.get('x-request-url') ||
        normalizedUrl;
      const finalUrl = ensureUrlProtocol(finalUrlHeader) || normalizedUrl;
      const redirected = normalizeComparableUrl(finalUrl) !== normalizeComparableUrl(normalizedUrl);
      const hops = redirected ? [normalizedUrl, finalUrl] : [normalizedUrl];

      setResult({
        inputUrl: normalizedUrl,
        finalUrl,
        status: response.status,
        redirected,
        hops,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to inspect redirect behavior for that page.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `Input URL: ${result.inputUrl}`,
        `Final URL: ${result.finalUrl}`,
        `Status: ${result.status}`,
        `Redirected: ${result.redirected ? 'Yes' : 'No'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">URL</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="textarea"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleLookup}
            disabled={!url.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.ArrowRight} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Checking…' : 'Trace'}
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
                  label: 'Redirected',
                  value: result.redirected ? 'Yes' : 'No',
                  description: 'Whether the final URL differs from the input',
                  tone: result.redirected ? 'warning' : 'success',
                  iconName: 'ArrowRight',
                },
                {
                  label: 'Final Status',
                  value: String(result.status),
                  description: 'HTTP status returned after proxy resolution',
                  iconName: 'Globe',
                },
                {
                  label: 'Visible Hops',
                  value: String(result.hops.length),
                  description: 'Proxy-visible steps in the chain',
                  iconName: 'Layers',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {result.hops.map((hop, index) => (
                <div
                  key={`${hop}-${index}`}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    {index === 0 ? 'Requested URL' : 'Final URL'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-word', lineHeight: 1.6 }}>
                    {hop}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="ArrowRight"
            title="Trace where a URL resolves"
            message="Enter a public URL to compare the requested address with the proxy&apos;s final destination and surface a simplified redirect chain."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          The internal `/api/proxy` route may still collapse intermediate hops, so this tool shows the final destination and a simplified chain when full headers are unavailable.
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
          onClick={() => downloadText(report, 'redirect-report.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
