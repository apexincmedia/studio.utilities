'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatBytes, readAsArrayBuffer } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import {
  EmptyState,
  ErrorCallout,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import { generateHashes } from '@/lib/hash-utils';
import { downloadText, useCopyState } from '@/lib/tool-utils';

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--muted)',
      }}
    >
      <Icon icon={ICON_MAP.Loader2} size={26} className="spin" />
      <div style={{ fontSize: 13 }}>Hashing file…</div>
    </div>
  );
}

export default function FileHashChecker() {
  const [file, setFile] = useState(null);
  const [compareHash, setCompareHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!file) {
        setResult(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);

      try {
        const bytes = new Uint8Array(await readAsArrayBuffer(file));
        const hashes = await generateHashes(bytes);

        if (!cancelled) {
          setResult({
            ...hashes,
            sizeLabel: formatBytes(file.size),
            fileName: file.name,
          });
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setResult(null);
          setError(nextError.message || 'Unable to hash that file.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const comparison = useMemo(() => {
    if (!compareHash.trim() || !result) return null;
    const normalized = compareHash.trim().toLowerCase();
    const match =
      Object.entries(result).find(([key, value]) =>
        ['md5', 'sha1', 'sha256', 'sha512'].includes(key) && value === normalized
      ) ?? null;

    return match
      ? { matched: true, algorithm: match[0].toUpperCase() }
      : { matched: false, algorithm: 'No matching digest' };
  }, [compareHash, result]);

  const report = result
    ? [
        `File: ${result.fileName}`,
        `Size: ${result.sizeLabel}`,
        '',
        `MD5: ${result.md5}`,
        `SHA-1: ${result.sha1}`,
        `SHA-256: ${result.sha256}`,
        `SHA-512: ${result.sha512}`,
        '',
        `Compare Result: ${comparison ? (comparison.matched ? `Match (${comparison.algorithm})` : 'Mismatch') : 'Not provided'}`,
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
                  label: 'File',
                  value: result.fileName,
                  description: result.sizeLabel,
                  iconName: 'FileCode',
                },
                {
                  label: 'Compare',
                  value: comparison ? (comparison.matched ? 'Match' : 'Mismatch') : 'Not set',
                  description: comparison ? comparison.algorithm : 'Paste a known hash to verify',
                  tone: comparison ? (comparison.matched ? 'success' : 'error') : 'default',
                  iconName: comparison ? (comparison.matched ? 'CheckCircle2' : 'AlertCircle') : 'Hash',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                ['MD5', result.md5],
                ['SHA-1', result.sha1],
                ['SHA-256', result.sha256],
                ['SHA-512', result.sha512],
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
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 12,
                      color: 'var(--text)',
                      lineHeight: 1.7,
                      wordBreak: 'break-all',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            iconName="Hash"
            title="Hash a file and verify its integrity"
            message="Choose any local file to generate MD5, SHA-1, SHA-256, and SHA-512 fingerprints, then compare them against a known digest."
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">File</div>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          style={{ width: '100%', marginBottom: 16, color: 'var(--muted)' }}
        />

        <div className="options-label">Compare Hash (Optional)</div>
        <textarea
          className="textarea"
          value={compareHash}
          onChange={(event) => setCompareHash(event.target.value)}
          placeholder="Paste a known MD5, SHA-1, SHA-256, or SHA-512 digest"
          style={{ minHeight: 100, marginBottom: 20 }}
        />

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(report)}
          disabled={!report}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Report'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setFile(null);
              setResult(null);
              setError(null);
            }}
          >
            Clear File
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setCompareHash('')}
          >
            Clear Compare
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'file-hash-report.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Hashes are computed locally with Web Crypto plus in-browser MD5</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
