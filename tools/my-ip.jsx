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
      <div style={{ fontSize: 13 }}>Looking up your IP information…</div>
    </div>
  );
}

export default function MyIp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopyState();

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ipv4Response, ipv6Response, locationResponse] = await Promise.allSettled([
        fetch('https://api.ipify.org?format=json', { cache: 'no-store' }).then((response) => response.json()),
        fetch('https://api64.ipify.org?format=json', { cache: 'no-store' }).then((response) => response.json()),
        fetch('https://ipapi.co/json/', { cache: 'no-store' }).then((response) => response.json()),
      ]);

      const ipv4 = ipv4Response.status === 'fulfilled' ? ipv4Response.value.ip : '';
      const ipv6 = ipv6Response.status === 'fulfilled' ? ipv6Response.value.ip : '';
      const location = locationResponse.status === 'fulfilled' ? locationResponse.value : null;

      if (!ipv4 && !ipv6 && !location) {
        throw new Error('Unable to resolve IP information from the public endpoints.');
      }

      setResult({
        ipv4,
        ipv6,
        location,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to look up IP details.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const report = result
    ? [
        `IPv4: ${result.ipv4 || 'Not available'}`,
        `IPv6: ${result.ipv6 || 'Not available'}`,
        `City: ${result.location?.city || 'Not available'}`,
        `Region: ${result.location?.region || 'Not available'}`,
        `Country: ${result.location?.country_name || 'Not available'}`,
        `Org: ${result.location?.org || 'Not available'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <ErrorCallout message={error} />

        {loading ? (
          <LoadingState />
        ) : result ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'IPv4',
                  value: result.ipv4 || 'Unavailable',
                  description: 'Primary IPv4 address from ipify',
                  iconName: 'Globe',
                },
                {
                  label: 'IPv6',
                  value: result.ipv6 || 'Unavailable',
                  description: 'IPv6 address from api64.ipify',
                  iconName: 'Globe',
                },
                {
                  label: 'Location',
                  value: result.location?.country_name || 'Unknown',
                  description: `${result.location?.city || 'Unknown city'}, ${result.location?.region || 'Unknown region'}`,
                  iconName: 'Globe',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Organization', result.location?.org || 'Not available'],
                ['Timezone', result.location?.timezone || 'Not available'],
                ['Coordinates', result.location?.latitude && result.location?.longitude ? `${result.location.latitude}, ${result.location.longitude}` : 'Not available'],
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
            title="Resolve your public IP and location"
            message="This tool checks public endpoints for your IPv4, IPv6, and a lightweight location summary without asking for any manual input."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Uses public IP lookup endpoints directly from the browser. The data shown reflects what those services can infer from your connection.
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
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={load}
            disabled={loading}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.RefreshCw} size={13} className={loading ? 'spin' : ''} />
            Refresh
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
          onClick={() => downloadText(report, 'my-ip-summary.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
