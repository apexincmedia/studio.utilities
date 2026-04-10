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
import { ensureUrlProtocol } from '@/lib/seo-web-utils';

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
      <div style={{ fontSize: 13 }}>Running PageSpeed Insights…</div>
    </div>
  );
}

function getScoreTone(score) {
  if (score >= 90) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

function getMetricTone(metric, value) {
  const thresholds = {
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    tbt: [200, 600],
    tti: [3800, 7300],
  };

  const [good, caution] = thresholds[metric] ?? [0, 0];
  if (value <= good) return 'success';
  if (value <= caution) return 'warning';
  return 'error';
}

function getAuditValue(audits, key) {
  return audits[key]?.displayValue ?? 'Not available';
}

export default function PageSpeedInsights() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [strategy, setStrategy] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const handleLookup = async () => {
    const normalizedUrl = ensureUrlProtocol(url);
    if (!normalizedUrl) {
      setError('Enter a valid public URL to audit.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=${strategy}${apiKey.trim() ? `&key=${encodeURIComponent(apiKey.trim())}` : ''}`;
      const response = await fetch(endpoint, { cache: 'no-store' });

      if (!response.ok) {
        if (response.status === 429 && !apiKey.trim()) {
          throw new Error('Google rate-limited this request. Add a free PageSpeed API key to raise the quota.');
        }

        throw new Error(`PageSpeed request failed with HTTP ${response.status}.`);
      }

      const data = await response.json();
      const lighthouse = data.lighthouseResult;
      const audits = lighthouse.audits;
      const score = Math.round((lighthouse.categories.performance.score ?? 0) * 100);
      const failingAudits = Object.values(audits)
        .filter(
          (audit) =>
            audit.score !== null &&
            audit.scoreDisplayMode !== 'notApplicable' &&
            audit.score !== 1 &&
            audit.title &&
            audit.description
        )
        .sort((left, right) => (left.score ?? 1) - (right.score ?? 1))
        .slice(0, 6)
        .map((audit) => ({
          title: audit.title,
          description: audit.description,
          displayValue: audit.displayValue ?? '',
          score: Math.round((audit.score ?? 0) * 100),
        }));

      setResult({
        url: normalizedUrl,
        score,
        strategy,
        metrics: {
          fcp: audits['first-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
          lcp: audits['largest-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
          cls: audits['cumulative-layout-shift']?.numericValue ?? Number.POSITIVE_INFINITY,
          tbt: audits['total-blocking-time']?.numericValue ?? Number.POSITIVE_INFINITY,
          tti: audits['interactive']?.numericValue ?? Number.POSITIVE_INFINITY,
        },
        displayValues: {
          fcp: getAuditValue(audits, 'first-contentful-paint'),
          lcp: getAuditValue(audits, 'largest-contentful-paint'),
          cls: getAuditValue(audits, 'cumulative-layout-shift'),
          tbt: getAuditValue(audits, 'total-blocking-time'),
          tti: getAuditValue(audits, 'interactive'),
        },
        audits: failingAudits,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to run PageSpeed Insights.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `URL: ${result.url}`,
        `Strategy: ${result.strategy}`,
        `Performance Score: ${result.score}`,
        `FCP: ${result.displayValues.fcp}`,
        `LCP: ${result.displayValues.lcp}`,
        `CLS: ${result.displayValues.cls}`,
        `TBT: ${result.displayValues.tbt}`,
        `TTI: ${result.displayValues.tti}`,
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
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Running…' : 'Audit'}
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
                  label: 'Performance',
                  value: `${result.score}`,
                  description: `${result.strategy} Lighthouse performance score`,
                  tone: getScoreTone(result.score),
                  iconName: 'Zap',
                },
                {
                  label: 'FCP',
                  value: result.displayValues.fcp,
                  description: 'First Contentful Paint',
                  tone: getMetricTone('fcp', result.metrics.fcp),
                  iconName: 'Clock',
                },
                {
                  label: 'LCP',
                  value: result.displayValues.lcp,
                  description: 'Largest Contentful Paint',
                  tone: getMetricTone('lcp', result.metrics.lcp),
                  iconName: 'Clock',
                },
                {
                  label: 'CLS',
                  value: result.displayValues.cls,
                  description: 'Cumulative Layout Shift',
                  tone: getMetricTone('cls', result.metrics.cls),
                  iconName: 'Layers',
                },
                {
                  label: 'TBT',
                  value: result.displayValues.tbt,
                  description: 'Total Blocking Time',
                  tone: getMetricTone('tbt', result.metrics.tbt),
                  iconName: 'Cpu',
                },
                {
                  label: 'TTI',
                  value: result.displayValues.tti,
                  description: 'Time to Interactive',
                  tone: getMetricTone('tti', result.metrics.tti),
                  iconName: 'TrendingUp',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div className="panel-label">Top Opportunities</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.audits.map((audit) => (
                <div
                  key={audit.title}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)' }}>{audit.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{audit.score}</div>
                  </div>
                  {audit.displayValue ? (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                      {audit.displayValue}
                    </div>
                  ) : null}
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {audit.description}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Zap"
            title="Run a PageSpeed audit on any public URL"
            message="Choose mobile or desktop strategy and fetch performance metrics plus top opportunities from Google PageSpeed Insights."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">
          API Key <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
        </div>
        <input
          className="input"
          type="password"
          placeholder="Google API key — removes rate limits"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          style={{ marginBottom: 6 }}
        />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Without a key, Google limits requests to roughly 25 per day per IP.{' '}
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-dim)' }}
          >
            Get a free key →
          </a>
        </div>

        <div className="options-label">Strategy</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            ['mobile', 'Mobile'],
            ['desktop', 'Desktop'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${strategy === value ? ' active' : ''}`}
              onClick={() => setStrategy(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Fetches the public Google PageSpeed Insights API directly from the browser. Large pages may take a few seconds.
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
            {copied ? 'Copied' : 'Copy Summary'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setUrl('');
              setApiKey('');
              setResult(null);
              setError(null);
              setStrategy('mobile');
            }}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'pagespeed-summary.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
