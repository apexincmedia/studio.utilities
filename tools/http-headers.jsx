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
import { fetchViaCorsProxy, ensureUrlProtocol } from '@/lib/seo-web-utils';

const SECURITY_HEADER_KEYS = new Set([
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
]);

function parseProxyHeaderDump(headerValue = '') {
  return headerValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        return null;
      }

      return {
        key: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter(Boolean);
}

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
      <div style={{ fontSize: 13 }}>Fetching response headers…</div>
    </div>
  );
}

export default function HttpHeaders() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [copied, copy] = useCopyState();

  const lookup = async () => {
    const normalizedUrl = ensureUrlProtocol(url);
    if (!normalizedUrl) {
      setError('Enter a valid URL to inspect.');
      setHeaders([]);
      return;
    }

    setLoading(true);
    setError(null);
    setHeaders([]);

    try {
      const response = await fetchViaCorsProxy(normalizedUrl);
      const proxyDump = response.headers.get('x-response-headers') ?? '';
      const parsedFromDump = parseProxyHeaderDump(proxyDump);
      const fallbackHeaders = Array.from(response.headers.entries()).map(([key, value]) => ({
        key,
        value,
      }));
      const mergedHeaders = (parsedFromDump.length ? parsedFromDump : fallbackHeaders)
        .filter((header) => header.key.toLowerCase() !== 'x-response-headers')
        .sort((left, right) => left.key.localeCompare(right.key));

      setHeaders(mergedHeaders);
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to fetch response headers for that URL.');
    } finally {
      setLoading(false);
    }
  };

  const securityHeaders = headers.filter((header) => SECURITY_HEADER_KEYS.has(header.key.toLowerCase()));
  const report = headers.map((header) => `${header.key}: ${header.value}`).join('\n');

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
            onClick={lookup}
            disabled={!url.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.Search} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Fetching…' : 'Fetch'}
          </button>
        </div>

        <ErrorCallout message={error} />

        {loading ? (
          <LoadingState />
        ) : headers.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Headers',
                  value: String(headers.length),
                  description: 'Total response headers surfaced by the proxy',
                  iconName: 'Server',
                },
                {
                  label: 'Security',
                  value: String(securityHeaders.length),
                  description: 'Common security headers currently present',
                  tone: securityHeaders.length ? 'success' : 'warning',
                  iconName: 'ShieldCheck',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {headers.map((header) => {
                const isSecurityHeader = SECURITY_HEADER_KEYS.has(header.key.toLowerCase());

                return (
                  <div
                    key={`${header.key}-${header.value}`}
                    style={{
                      border: `1px solid ${isSecurityHeader ? 'var(--success)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: isSecurityHeader ? 'var(--success-bg)' : 'var(--surface)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                      {header.key}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {header.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Server"
            title="Inspect public response headers through the proxy"
            message="Enter a public URL to fetch response headers, highlight common security headers, and export the full header list."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Uses the internal `/api/proxy` route because browsers cannot normally read arbitrary cross-origin response headers.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Headers'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setUrl('https://example.com')}
          >
            Example
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setHeaders([]);
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
          onClick={() => downloadText(report, 'http-headers.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
