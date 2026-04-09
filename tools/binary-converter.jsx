'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { convertAnyInput } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  ErrorCallout,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function OutputBlock({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        marginBottom: 12,
      }}
    >
      <div className="panel-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: value ? 'var(--text)' : 'var(--faint)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

export default function BinaryConverter() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 150);
  const result = convertAnyInput(debouncedInput);

  const report = input
    ? [
        `Detected: ${result.detectedType}`,
        `Text: ${result.text || '-'}`,
        `Binary: ${result.binary || '-'}`,
        `Decimal: ${result.decimal || '-'}`,
        `Hex: ${result.hex || '-'}`,
        `Octal: ${result.octal || '-'}`,
      ].join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text, Binary, Decimal, Hex, or Octal"
      inputPlaceholder="Paste text, binary bytes, a decimal number, hex bytes, or an octal value..."
      inputStats={
        input ? (
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 16 }}>
            Detected input type: {result.detectedType}
          </div>
        ) : null
      }
      dividerLabel="All Conversions"
      error={result.error}
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Cpu"
          title="Convert across common bases"
          message="Enter a value in text, binary, decimal, hex, or octal form and see every other representation at once."
        />
      }
      outputRenderer={
        input.trim() && !result.error ? (
          <>
            <div className="panel-label">Detected: {result.detectedType}</div>
            <OutputBlock label="Text" value={result.text} />
            <OutputBlock label="Binary" value={result.binary} />
            <OutputBlock label="Decimal" value={result.decimal} />
            <OutputBlock label="Hex" value={result.hex} />
            <OutputBlock label="Octal" value={result.octal} />
          </>
        ) : null
      }
      options={
        <>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 12,
              color: 'var(--muted)',
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            Binary input should be complete 8-bit groups. Octal input can be prefixed with <code>0o</code>.
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      copyValue={report}
      copyLabel="Copy Report"
      downloadConfig={{
        filename: 'base-conversions.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(report),
      }}
    />
  );
}
