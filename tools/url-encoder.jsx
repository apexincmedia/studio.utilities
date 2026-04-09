'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { encodeUrlValue } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

export default function UrlEncoder() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode');
  const [scope, setScope] = useState('component');
  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? encodeUrlValue(debouncedInput, { mode, scope })
    : { output: '', error: null };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'encode' ? 'Original URL Value' : 'Encoded URL Value'}
      inputPlaceholder={
        mode === 'encode'
          ? scope === 'component'
            ? 'Paste a query value like hello world & more...'
            : 'Paste a full URL like https://example.com/search?q=hello world'
          : 'Paste an encoded URL value to decode...'
      }
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel={mode === 'encode' ? 'Encoded Output' : 'Decoded Output'}
      error={result.error}
      output={result.output}
      outputLabel={mode === 'encode' ? 'Encoded Result' : 'Decoded Result'}
      outputPlaceholder="Converted URL value will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[`${result.output.length} characters`, scope === 'component' ? 'Component mode' : 'Full URL mode']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Link2"
          title="Encode or decode URL values"
          message="Switch between component mode and full URL mode to safely transform query strings, paths, or complete URLs."
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

          <div className="options-label">Scope</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['component', 'Component'],
              ['full-url', 'Full URL'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${scope === value ? ' active' : ''}`}
                onClick={() => setScope(value)}
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
        filename: 'url-output.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
