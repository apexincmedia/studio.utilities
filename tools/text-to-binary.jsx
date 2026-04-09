'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { decodeBinaryText, encodeBinaryText } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function transformBinaryValue(input, { mode, separator, grouped }) {
  try {
    if (mode === 'encode') {
      return {
        output: encodeBinaryText(input, { separator, grouped }),
        error: null,
      };
    }

    return {
      output: decodeBinaryText(input),
      error: null,
    };
  } catch (error) {
    return { output: '', error: error.message };
  }
}

export default function TextToBinary() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode');
  const [separator, setSeparator] = useState('space');
  const [grouped, setGrouped] = useState(true);
  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? transformBinaryValue(debouncedInput, { mode, separator, grouped })
    : { output: '', error: null };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'encode' ? 'Text Input' : 'Binary Input'}
      inputPlaceholder={
        mode === 'encode'
          ? 'Paste text to convert into binary bytes...'
          : 'Paste binary groups to decode back into text...'
      }
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel={mode === 'encode' ? 'Binary Output' : 'Decoded Text'}
      error={result.error}
      output={result.output}
      outputLabel={mode === 'encode' ? 'Binary Bytes' : 'Decoded Text'}
      outputPlaceholder="Converted output will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[`${result.output.length} characters`, mode === 'encode' ? separator : 'decoded']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Cpu"
          title="Convert text and binary in both directions"
          message="Encode text into 8-bit binary groups or decode binary bytes back into readable UTF-8 text."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['encode', 'Text -> Binary'],
              ['decode', 'Binary -> Text'],
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

          <div className="options-label">Separator</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['space', 'Space'],
              ['none', 'No Spaces'],
              ['newline', 'Newline'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${separator === value ? ' active' : ''}`}
                onClick={() => setSeparator(value)}
                disabled={mode === 'decode'}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={grouped}
              onChange={(event) => setGrouped(event.target.checked)}
              disabled={mode === 'decode'}
            />
            <span className="checkbox-label">Show 8-bit byte grouping</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'binary-output.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
