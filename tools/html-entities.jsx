'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { decodeHtmlEntities, encodeHtmlEntities } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

export default function HtmlEntities() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('encode');
  const [entityStyle, setEntityStyle] = useState('named');
  const debouncedInput = useDebounce(input, 150);

  const output = debouncedInput
    ? mode === 'encode'
      ? encodeHtmlEntities(debouncedInput, entityStyle)
      : decodeHtmlEntities(debouncedInput)
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'encode' ? 'Raw HTML Text' : 'HTML Entities'}
      inputPlaceholder={
        mode === 'encode'
          ? 'Paste text with special characters like <, >, &, quotes, or accented letters...'
          : 'Paste encoded HTML entities like &amp;, &#38;, or &#x26;...'
      }
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      output={output}
      outputLabel={mode === 'encode' ? 'Encoded Entities' : 'Decoded Text'}
      outputPlaceholder="Converted output will appear here..."
      outputStats={
        output ? (
          <TextStatLine
            items={[`${output.length} characters`, mode === 'encode' ? `${entityStyle} entities` : 'Decoded text']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Escape or decode HTML safely"
          message="Convert special characters into HTML entities or turn entity strings back into readable text."
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

          <div className="options-label">Entity Style</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['named', 'Named'],
              ['decimal', 'Decimal'],
              ['hex', 'Hex'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${entityStyle === value ? ' active' : ''}`}
                onClick={() => setEntityStyle(value)}
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
        filename: 'html-entities.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
