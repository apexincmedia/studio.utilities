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

const COMMON_PORTS = [21, 22, 25, 80, 443, 3306, 5432, 6379, 8080, 27017];

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
      <div style={{ fontSize: 13 }}>Probing the selected port…</div>
    </div>
  );
}

async function probePort(host, port) {
  const scheme = String(port) === '443' ? 'https' : 'http';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);

  try {
    await fetch(`${scheme}://${host}:${port}/`, {
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    });

    return {
      state: 'likely-open',
      detail: 'The browser reached the host and got an opaque response.',
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        state: 'timed-out',
        detail: 'The connection timed out before a response came back.',
      };
    }

    return {
      state: 'likely-closed',
      detail: 'The browser could not complete a connection to that port.',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function OpenPortChecker() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, copy] = useCopyState();

  const checkPort = async () => {
    if (!host.trim()) {
      setError('Enter a hostname or IP address to probe.');
      setResult(null);
      return;
    }

    if (!port.trim()) {
      setError('Enter a port number to probe.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const outcome = await probePort(host.trim(), port.trim());
      setResult({
        host: host.trim(),
        port: port.trim(),
        ...outcome,
      });
    } catch (lookupError) {
      setError(lookupError.message || 'Unable to test that port.');
    } finally {
      setLoading(false);
    }
  };

  const report = result
    ? [
        `Host: ${result.host}`,
        `Port: ${result.port}`,
        `State: ${result.state}`,
        `Detail: ${result.detail}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Host & Port</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px auto', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="textarea"
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="example.com"
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
          <input
            type="number"
            className="textarea"
            value={port}
            onChange={(event) => setPort(event.target.value)}
            placeholder="443"
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={checkPort}
            disabled={!host.trim() || !port.trim() || loading}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
          >
            <Icon icon={loading ? ICON_MAP.Loader2 : ICON_MAP.Search} size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Checking…' : 'Probe'}
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
                  label: 'Host',
                  value: result.host,
                  description: `Port ${result.port}`,
                  iconName: 'Server',
                },
                {
                  label: 'Result',
                  value: result.state === 'likely-open' ? 'Likely Open' : result.state === 'timed-out' ? 'Timed Out' : 'Likely Closed',
                  description: result.detail,
                  tone:
                    result.state === 'likely-open'
                      ? 'success'
                      : result.state === 'timed-out'
                        ? 'warning'
                        : 'error',
                  iconName:
                    result.state === 'likely-open'
                      ? 'CheckCircle2'
                      : result.state === 'timed-out'
                        ? 'AlertCircle'
                        : 'X',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                padding: '16px',
                fontSize: 13,
                color: 'var(--text)',
                lineHeight: 1.7,
              }}
            >
              {result.detail}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Server"
            title="Probe whether a common port appears reachable"
            message="Enter a host and port to run a browser-safe connectivity probe. The result is approximate because browsers cannot perform true TCP scans."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Common Ports</div>
        <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          {COMMON_PORTS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${port === String(value) ? ' active' : ''}`}
              onClick={() => setPort(String(value))}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Results are approximate. Browsers cannot do raw TCP scans, so this tool only checks whether a fetch probe appears to reach the target port.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Result'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setHost('');
              setPort('443');
            }}
          >
            Reset
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
          onClick={() => downloadText(report, 'open-port-result.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
