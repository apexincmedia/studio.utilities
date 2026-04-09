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
import { normalizeDomainInput } from '@/lib/security-network-utils';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'];

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
      <div style={{ fontSize: 13 }}>Querying DNS records…</div>
    </div>
  );
}

export default function DnsLookup() {
  const [domain, setDomain] = useState('');
  const [activeType, setActiveType] = useState('all');
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
      const responses = await Promise.all(
        RECORD_TYPES.map(async (type) => {
          const response = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(normalizedDomain)}&type=${type}`,
            { cache: 'no-store' }
          );
          const data = await response.json();
          return [type, data.Answer ?? []];
        })
      );

      setResult(Object.fromEntries(responses));
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to query DNS records for that domain.');
    } finally {
      setLoading(false);
    }
  };

  const visibleTypes = activeType === 'all' ? RECORD_TYPES : [activeType];
  const visibleRecords = visibleTypes.flatMap((type) =>
    (result?.[type] ?? []).map((record) => ({
      type,
      name: record.name,
      data: record.data,
      ttl: record.TTL,
    }))
  );

  const report = visibleRecords
    .map((record) => `${record.type}\t${record.ttl}s\t${record.name}\t${record.data}`)
    .join('\n');

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
            {loading ? 'Querying…' : 'Look Up'}
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
                  label: 'Record Types',
                  value: String(RECORD_TYPES.filter((type) => (result[type] ?? []).length > 0).length),
                  description: 'Record families with at least one answer',
                  iconName: 'Layers',
                },
                {
                  label: 'Visible',
                  value: String(visibleRecords.length),
                  description: activeType === 'all' ? 'Records across all common types' : `Records for ${activeType}`,
                  iconName: 'Database',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {visibleTypes.map((type) => (
                <div
                  key={type}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>{type} Records</div>
                  {(result[type] ?? []).length ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {result[type].map((record) => (
                        <div key={`${type}-${record.name}-${record.data}`} style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--text)' }}>{record.data}</strong>
                          <br />
                          TTL: {record.TTL}s
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>No records found.</div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Database"
            title="Query common DNS records from Google DoH"
            message="Enter a domain to fetch A, AAAA, MX, TXT, CNAME, NS, and SOA records and inspect their TTL values."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Visible Type</div>
        <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          <button type="button" className={`mode-btn${activeType === 'all' ? ' active' : ''}`} onClick={() => setActiveType('all')}>
            All
          </button>
          {RECORD_TYPES.map((type) => (
            <button key={type} type="button" className={`mode-btn${activeType === type ? ' active' : ''}`} onClick={() => setActiveType(type)}>
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Records'}
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
          onClick={() => downloadText(report, 'dns-records.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
