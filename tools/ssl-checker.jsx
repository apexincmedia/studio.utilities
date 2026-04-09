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
      <div style={{ fontSize: 13 }}>Checking HTTPS reachability and recent certificates…</div>
    </div>
  );
}

export default function SslChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopyState();

  const lookup = async () => {
    const normalizedDomain = normalizeDomainInput(domain);
    if (!normalizedDomain) {
      setError('Enter a valid domain name to inspect.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let httpsReachable = false;

      try {
        await fetchViaCorsProxy(`https://${normalizedDomain}`);
        httpsReachable = true;
      } catch {
        httpsReachable = false;
      }

      const certResponse = await fetchViaCorsProxy(`https://crt.sh/?q=${normalizedDomain}&output=json`);
      const certs = await certResponse.json();
      const recentCerts = Array.from(
        new Map(
          (certs ?? [])
            .map((item) => [
              `${item.common_name}-${item.issuer_name}-${item.not_after}`,
              {
                commonName: item.common_name,
                issuer: item.issuer_name,
                notBefore: item.not_before,
                notAfter: item.not_after,
              },
            ])
            .sort((left, right) => new Date(right[1].notAfter).getTime() - new Date(left[1].notAfter).getTime())
        ).values()
      ).slice(0, 5);

      setResult({
        domain: normalizedDomain,
        httpsReachable,
        recentCerts,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to inspect SSL information for that domain.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `Domain: ${result.domain}`,
        `HTTPS Reachable: ${result.httpsReachable ? 'Yes' : 'No'}`,
        '',
        ...result.recentCerts.map(
          (cert) =>
            `${cert.commonName} | ${cert.issuer} | ${cert.notBefore} -> ${cert.notAfter}`
        ),
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
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.ShieldCheck} size={14} className={loading ? 'spin' : ''} />
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
                  label: 'HTTPS',
                  value: result.httpsReachable ? 'Reachable' : 'No response',
                  description: 'Browser-accessible HTTPS reachability check',
                  tone: result.httpsReachable ? 'success' : 'warning',
                  iconName: 'ShieldCheck',
                },
                {
                  label: 'Certificates',
                  value: String(result.recentCerts.length),
                  description: 'Recent certs from crt.sh transparency logs',
                  iconName: 'FileCode',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {result.recentCerts.map((cert) => (
                <div
                  key={`${cert.commonName}-${cert.notAfter}`}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>{cert.commonName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Issuer: {cert.issuer}
                    <br />
                    Valid: {cert.notBefore} to {cert.notAfter}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="ShieldCheck"
            title="Inspect HTTPS reachability and recent certificates"
            message="Enter a domain to test whether it responds over HTTPS and to inspect recent certificate transparency entries."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Browsers cannot read live certificate details directly, so this tool combines an HTTPS reachability check with recent `crt.sh` transparency log entries.
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
          onClick={() => downloadText(report, 'ssl-summary.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
