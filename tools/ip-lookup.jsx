'use client';

import { useEffect, useState } from 'react';
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
import { fetchViaCorsProxy } from '@/lib/seo-web-utils';

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
      <div style={{ fontSize: 13 }}>Looking up IP information…</div>
    </div>
  );
}

export default function IpLookup() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setIp(data.ip || ''))
      .catch(() => {});
  }, []);

  const lookup = async () => {
    if (!ip.trim()) {
      setError('Enter an IP address to look up.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchViaCorsProxy(
        `http://ip-api.com/json/${encodeURIComponent(ip.trim())}?fields=66846719`
      );
      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'IP lookup failed.');
      }

      setResult(data);
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to look up that IP address.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `IP: ${result.query}`,
        `Country: ${result.country}`,
        `Region: ${result.regionName}`,
        `City: ${result.city}`,
        `ISP: ${result.isp}`,
        `Org: ${result.org}`,
        `ASN: ${result.as}`,
        `Timezone: ${result.timezone}`,
        `Proxy: ${result.proxy ? 'Yes' : 'No'}`,
        `Hosting: ${result.hosting ? 'Yes' : 'No'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">IP Address</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="textarea"
            value={ip}
            onChange={(event) => setIp(event.target.value)}
            placeholder="8.8.8.8"
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={lookup}
            disabled={!ip.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.Search} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Looking up…' : 'Look Up'}
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
                  label: 'Location',
                  value: `${result.city || 'Unknown'}, ${result.country || 'Unknown'}`,
                  description: result.regionName || 'Region not available',
                  iconName: 'Globe',
                },
                {
                  label: 'Network',
                  value: result.isp || 'Unknown ISP',
                  description: result.org || 'Organization not available',
                  iconName: 'Server',
                },
                {
                  label: 'Risk Flags',
                  value: `${result.proxy ? 'Proxy' : 'No Proxy'} / ${result.hosting ? 'Hosting' : 'Residential'}`,
                  description: result.as || 'ASN not available',
                  iconName: 'ShieldCheck',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Timezone', result.timezone || 'Not available'],
                ['Coordinates', `${result.lat}, ${result.lon}`],
                ['ZIP', result.zip || 'Not available'],
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
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Globe"
            title="Look up IP geolocation and network details"
            message="Enter any public IPv4 address to inspect country, city, ISP, ASN, timezone, and basic proxy or hosting indicators."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Uses the free `ip-api.com` endpoint through a CORS proxy because the free tier is HTTP-only.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Summary'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIp('8.8.8.8')}>
            Use 8.8.8.8
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
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
          onClick={() => downloadText(report, 'ip-lookup.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
