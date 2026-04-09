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
import { fetchViaCorsProxy } from '@/lib/seo-web-utils';
import { normalizeDomainInput } from '@/lib/security-network-utils';

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
      <div style={{ fontSize: 13 }}>Querying RDAP records…</div>
    </div>
  );
}

function findEntity(entities = [], role) {
  return entities.find((entity) => entity.roles?.includes(role)) ?? null;
}

function findEvent(events = [], action) {
  return events.find((event) => event.eventAction === action)?.eventDate ?? '';
}

export default function WhoisLookup() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopyState();

  const lookup = async () => {
    const normalizedDomain = normalizeDomainInput(domain);
    if (!normalizedDomain) {
      setError('Enter a valid domain name to query.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchViaCorsProxy(`https://rdap.org/domain/${normalizedDomain}`);
      const data = await response.json();

      setResult({
        registrar: findEntity(data.entities, 'registrar')?.vcardArray?.[1]?.[1]?.[3] || 'Not available',
        registrant: findEntity(data.entities, 'registrant')?.vcardArray?.[1]?.[1]?.[3] || 'Not public',
        created: findEvent(data.events, 'registration'),
        expires: findEvent(data.events, 'expiration'),
        updated: findEvent(data.events, 'last changed'),
        status: data.status ?? [],
        nameservers: (data.nameservers ?? []).map((item) => item.ldhName),
        raw: data,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to query RDAP data for that domain.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `Registrar: ${result.registrar}`,
        `Registrant: ${result.registrant}`,
        `Created: ${result.created || 'Not available'}`,
        `Expires: ${result.expires || 'Not available'}`,
        `Updated: ${result.updated || 'Not available'}`,
        `Nameservers: ${result.nameservers.join(', ') || 'Not available'}`,
        `Status: ${result.status.join(', ') || 'Not available'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Domain</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="textarea"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="example.com"
            style={{ minHeight: 'auto', padding: '12px 14px', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={lookup}
            disabled={!domain.trim() || loading}
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
                  label: 'Registrar',
                  value: result.registrar,
                  description: 'RDAP registrar entity',
                  iconName: 'Server',
                },
                {
                  label: 'Created',
                  value: result.created || 'Unknown',
                  description: 'Registration date',
                  iconName: 'Calendar',
                },
                {
                  label: 'Expires',
                  value: result.expires || 'Unknown',
                  description: 'Expiration date',
                  iconName: 'Calendar',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['Registrant', result.registrant],
                ['Name Servers', result.nameservers.join(', ') || 'Not available'],
                ['Status', result.status.join(', ') || 'Not available'],
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
            iconName="Server"
            title="Query RDAP ownership and registration data"
            message="Enter a domain to inspect registrar details, creation and expiry dates, nameservers, and public RDAP status information."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Uses the public `rdap.org` endpoint through a proxy to read standardized WHOIS-style data in JSON form.
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
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDomain('example.com')}>
            Example
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
          onClick={() => downloadText(report, 'whois-summary.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
