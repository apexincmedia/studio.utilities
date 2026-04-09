'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { getWords, slugifyText } from '@/lib/text-tool-utils';

export default function SlugGenerator() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [maxLength, setMaxLength] = useState('80');
  const debouncedInput = useDebounce(input, 150);
  const output = debouncedInput
    ? slugifyText(debouncedInput, {
        separator,
        lowercase,
        maxLength: Number.parseInt(maxLength, 10) || 0,
      })
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Source Text"
      inputPlaceholder="Paste a title, headline, or phrase to turn into a slug…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${getWords(input).length} words`]}
          />
        ) : null
      }
      output={output}
      outputLabel="URL Slug"
      outputPlaceholder="slug-output"
      outputStats={
        output ? (
          <TextStatLine
            items={[`${output.length} characters`, `Separator: ${separator}`]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Link2"
          title="Turn text into a clean slug"
          message="This tool removes special characters, normalizes accents, and builds a URL-friendly slug instantly."
        />
      }
      options={
        <>
          <div className="options-label">Separator</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['-', 'Hyphen'],
              ['_', 'Underscore'],
              ['.', 'Dot'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${separator === value ? ' active' : ''}`}
                onClick={() => setSeparator(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Length</div>
          <input
            type="number"
            className="textarea"
            value={maxLength}
            min="0"
            max="200"
            onChange={(event) => setMaxLength(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(event) => setLowercase(event.target.checked)}
            />
            <span className="checkbox-label">Force lowercase output</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'slug.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
