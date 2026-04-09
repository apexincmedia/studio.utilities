'use client';

import { startTransition, useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import {
  formatGeneratedId,
  generateIdentifier,
} from '@/lib/uuid-utils';

const FORMAT_LABELS = {
  'uuid-v4': 'UUID v4',
  'uuid-v1': 'UUID v1',
  ulid: 'ULID',
  nanoid: 'NanoID',
};

export default function UuidGenerator() {
  const [format, setFormat] = useState('uuid-v4');
  const [count, setCount] = useState(8);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [values, setValues] = useState([]);

  const output = useMemo(() => values.join('\n'), [values]);

  function handleGenerate() {
    startTransition(() => {
      const nextValues = Array.from({ length: count }, () =>
        formatGeneratedId(generateIdentifier(format), { uppercase, hyphens })
      );
      setValues(nextValues);
    });
  }

  const averageLength = values.length
    ? Math.round(values.reduce((total, value) => total + value.length, 0) / values.length)
    : 0;

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!values.length}
      emptyState={
        <EmptyState
          iconName="Hash"
          title="Generate identifiers in bulk"
          message="Choose a format, pick how many values you want, then generate clean UUIDs, ULIDs, or NanoIDs right in the browser."
        />
      }
      outputRenderer={
        values.length ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Format',
                  value: FORMAT_LABELS[format],
                  description: 'Identifier family used for this batch',
                  iconName: 'Hash',
                },
                {
                  label: 'Generated',
                  value: String(values.length),
                  description: 'Identifiers in the current batch',
                  iconName: 'Layers',
                },
                {
                  label: 'Avg Length',
                  value: String(averageLength),
                  description: 'Average characters per identifier',
                  iconName: 'Type',
                },
              ]}
              marginBottom={16}
            />

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                maxHeight: 440,
                overflow: 'auto',
                display: 'grid',
                gap: 10,
              }}
            >
              {values.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    padding: '12px 14px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 13,
                    color: 'var(--text)',
                    wordBreak: 'break-all',
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </>
        ) : null
      }
      options={
        <>
          <div className="options-label">Format</div>
          <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${format === value ? ' active' : ''}`}
                onClick={() => setFormat(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Count</div>
          <div className="range-wrap" style={{ marginBottom: 18 }}>
            <input
              type="range"
              min="1"
              max="1000"
              step="1"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
            <span className="range-value">{count}</span>
          </div>

          <label className="checkbox-row" style={{ marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(event) => setUppercase(event.target.checked)}
            />
            <span className="checkbox-label">Uppercase output</span>
          </label>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(event) => setHyphens(event.target.checked)}
              disabled={format === 'ulid' || format === 'nanoid'}
            />
            <span className="checkbox-label">Keep hyphens for UUID formats</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      primaryAction={{
        label: 'Generate',
        iconName: 'Zap',
        onClick: handleGenerate,
      }}
      onClear={() => {
        setFormat('uuid-v4');
        setCount(8);
        setUppercase(false);
        setHyphens(true);
        setValues([]);
      }}
      copyValue={output}
      copyLabel="Copy All"
      downloadConfig={{
        filename: `${format}-batch.txt`,
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(values.length),
      }}
      privacyNote="Identifier generation is fully local using browser crypto APIs"
    />
  );
}
