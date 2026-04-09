'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatBytes, readAsArrayBuffer, useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { generateHashes } from '@/lib/hash-utils';

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
      <div style={{ fontSize: 13 }}>Generating hashes…</div>
    </div>
  );
}

function buildHashReport(result, sourceLabel, sizeLabel) {
  if (!result) return '';
  return [
    `Source: ${sourceLabel}`,
    `Size: ${sizeLabel}`,
    '',
    `MD5: ${result.md5}`,
    `SHA-1: ${result.sha1}`,
    `SHA-256: ${result.sha256}`,
    `SHA-512: ${result.sha512}`,
  ].join('\n');
}

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedFile && !debouncedInput.trim()) {
        setResult(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const bytes = selectedFile
          ? new Uint8Array(await readAsArrayBuffer(selectedFile))
          : new TextEncoder().encode(debouncedInput);
        const hashes = await generateHashes(bytes);

        if (!cancelled) {
          setResult({
            ...hashes,
            byteLength: bytes.byteLength,
          });
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setResult(null);
          setError(nextError.message || 'Could not generate hashes.');
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
  }, [debouncedInput, selectedFile]);

  const sourceLabel = selectedFile ? selectedFile.name : 'Text input';
  const sizeLabel = result ? formatBytes(result.byteLength) : '0 B';
  const report = useMemo(
    () => buildHashReport(result, sourceLabel, sizeLabel),
    [result, sizeLabel, sourceLabel]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={(value) => {
        setSelectedFile(null);
        setInput(value);
      }}
      inputLabel="Text Input"
      inputPlaceholder="Paste text to hash, or choose a file from the options panel…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, formatBytes(new TextEncoder().encode(input).length)]}
          />
        ) : null
      }
      dividerLabel="Hash Output"
      error={error}
      output={report}
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : !selectedFile && !input.trim() ? (
          <EmptyState
            iconName="Hash"
            title="Generate file or text hashes locally"
            message="Paste text or select a file to compute MD5, SHA-1, SHA-256, and SHA-512 fingerprints without uploading anything."
          />
        ) : result ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: selectedFile ? 'File' : 'Text',
                  description: sourceLabel,
                  iconName: 'FileCode',
                },
                {
                  label: 'Input Size',
                  value: sizeLabel,
                  description: 'Total bytes hashed in this run',
                  iconName: 'Package',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['MD5', result.md5],
                ['SHA-1', result.sha1],
                ['SHA-256', result.sha256],
                ['SHA-512', result.sha512],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: 'var(--text)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : undefined
      }
      showEmptyState={false}
      options={
        <>
          <div className="options-label">Hash a File</div>
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
            style={{
              width: '100%',
              marginBottom: 16,
              color: 'var(--muted)',
            }}
          />

          {selectedFile ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: 12,
                color: 'var(--text-dim)',
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {selectedFile.name}
              <br />
              {formatBytes(selectedFile.size)}
            </div>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setSelectedFile(null);
        setResult(null);
        setError(null);
      }}
      copyValue={report}
      downloadConfig={{
        filename: 'hash-report.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(result),
      }}
      privacyNote="Files are hashed locally with Web Crypto and in-browser MD5 logic"
    />
  );
}
