'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { caesarShift } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function buildBruteForceRows(input) {
  return Array.from({ length: 25 }, (_, index) => {
    const shift = index + 1;
    return {
      shift,
      output: caesarShift(input, -shift),
    };
  });
}

export default function CaesarCipher() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encrypt');
  const [shift, setShift] = useState(3);
  const debouncedInput = useDebounce(input, 150);

  const output =
    debouncedInput && mode !== 'brute-force'
      ? caesarShift(debouncedInput, mode === 'encrypt' ? shift : -shift)
      : '';
  const bruteForceRows = debouncedInput && mode === 'brute-force' ? buildBruteForceRows(debouncedInput) : [];
  const report =
    mode === 'brute-force'
      ? bruteForceRows.map((row) => `Shift ${row.shift}: ${row.output}`).join('\n\n')
      : output;

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Plain or Cipher Text"
      inputPlaceholder="Paste text to encrypt, decrypt, or brute-force..."
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`, `Shift ${shift}`]} /> : null
      }
      dividerLabel={mode === 'brute-force' ? 'All Shift Variants' : 'Cipher Output'}
      output={output}
      outputLabel="Transformed Text"
      outputPlaceholder="Cipher output will appear here..."
      outputStats={
        output ? <TextStatLine items={[`${output.length} characters`]} marginBottom={0} /> : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Lock"
          title="Shift letters with a Caesar cipher"
          message="Encrypt, decrypt, or brute-force all 25 shifts to inspect every possible plaintext."
        />
      }
      outputRenderer={
        mode === 'brute-force' && bruteForceRows.length ? (
          <>
            <div className="panel-label">All 25 Shifts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
              {bruteForceRows.map((row) => (
                <div
                  key={row.shift}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Shift {row.shift}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {row.output}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : undefined
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['encrypt', 'Encrypt'],
              ['decrypt', 'Decrypt'],
              ['brute-force', 'Brute Force'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${mode === value ? ' active' : ''}`}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Shift</div>
          <div className="range-wrap" style={{ marginBottom: 20 }}>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={shift}
              onChange={(event) => setShift(Number(event.target.value))}
              disabled={mode === 'brute-force'}
            />
            <span className="range-value">{shift}</span>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      copyValue={report}
      copyLabel={mode === 'brute-force' ? 'Copy All' : 'Copy'}
      downloadConfig={{
        filename: 'caesar-cipher.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(report),
      }}
    />
  );
}
