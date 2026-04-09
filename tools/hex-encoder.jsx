'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { decodeHexText, encodeHexText } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function convertHexValue(input, { mode, format }) {
  try {
    if (mode === 'encode') {
      const separator = format === 'none' ? 'none' : 'space';
      const prefix = format === '0x' ? '0x' : format === '\\x' ? '\\x' : 'plain';
      return { output: encodeHexText(input, { separator, prefix }), error: null };
    }

    return { output: decodeHexText(input), error: null };
  } catch (error) {
    return { output: '', error: error.message };
  }
}

export default function HexEncoder() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode');
  const [format, setFormat] = useState('space');
  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? convertHexValue(debouncedInput, { mode, format })
    : { output: '', error: null };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'encode' ? 'Text Input' : 'Hex Input'}
      inputPlaceholder={
        mode === 'encode'
          ? 'Paste text to convert into hexadecimal bytes...'
          : 'Paste hex input using spaces, 0x prefixes, or \\x prefixes...'
      }
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel={mode === 'encode' ? 'Hex Output' : 'Decoded Text'}
      error={result.error}
      output={result.output}
      outputLabel={mode === 'encode' ? 'Encoded Hex' : 'Decoded Text'}
      outputPlaceholder="Converted output will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[`${result.output.length} characters`, mode === 'encode' ? format : 'decoded']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Hash"
          title="Encode or decode hexadecimal bytes"
          message="Convert UTF-8 text into hex bytes or decode hex strings back to readable text."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['encode', 'Encode'],
              ['decode', 'Decode'],
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

          <div className="options-label">Separator Format</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {[
              ['space', 'Space'],
              ['none', 'No Spaces'],
              ['0x', '0x'],
              ['\\x', '\\x'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${format === value ? ' active' : ''}`}
                onClick={() => setFormat(value)}
                disabled={mode === 'decode'}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'hex-output.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
