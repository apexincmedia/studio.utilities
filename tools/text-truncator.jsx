'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { getSentences, getWords } from '@/lib/text-tool-utils';

function truncateText(text, { limit, unit, boundary, suffix }) {
  const safeLimit = Number.parseInt(limit, 10);
  if (!Number.isFinite(safeLimit) || safeLimit <= 0) {
    return { output: '', error: 'Enter a limit greater than zero.', detail: null };
  }

  if (unit === 'characters') {
    if (text.length <= safeLimit) {
      return {
        output: text,
        error: null,
        detail: `${safeLimit - text.length} characters remaining`,
      };
    }

    let base = text.slice(0, safeLimit);
    if (boundary === 'word') {
      base = base.replace(/\s+\S*$/, '').trimEnd() || text.slice(0, safeLimit);
    }

    const output = `${base}${suffix}`;
    return {
      output,
      error: null,
      detail: `Shortened by ${text.length - base.length} characters`,
    };
  }

  if (unit === 'words') {
    const words = getWords(text);
    if (words.length <= safeLimit) {
      return {
        output: text,
        error: null,
        detail: `${safeLimit - words.length} words remaining`,
      };
    }

    const base = words.slice(0, safeLimit).join(' ');
    return {
      output: `${base}${suffix}`,
      error: null,
      detail: `Shortened by ${words.length - safeLimit} words`,
    };
  }

  const sentences = getSentences(text);
  if (sentences.length <= safeLimit) {
    return {
      output: text,
      error: null,
      detail: `${safeLimit - sentences.length} sentences remaining`,
    };
  }

  const base = sentences.slice(0, safeLimit).join(' ');
  return {
    output: `${base}${suffix}`,
    error: null,
    detail: `Shortened by ${sentences.length - safeLimit} sentences`,
  };
}

export default function TextTruncator() {
  const [input, setInput] = useState('');
  const [limit, setLimit] = useState('140');
  const [unit, setUnit] = useState('characters');
  const [boundary, setBoundary] = useState('exact');
  const [suffix, setSuffix] = useState('…');

  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? truncateText(debouncedInput, { limit, unit, boundary, suffix })
    : { output: '', error: null, detail: null };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Original Text"
      inputPlaceholder="Paste text to shorten for social posts, previews, or summaries…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${getWords(input).length} words`]}
          />
        ) : null
      }
      dividerLabel="Truncated Output"
      error={result.error}
      output={result.output}
      outputLabel="Shortened Text"
      outputPlaceholder="Shortened output will appear here…"
      outputStats={
        result.output ? (
          <TextStatLine items={[result.detail]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Scissors"
          title="Trim text to an exact limit"
          message="Choose characters, words, or sentences, then keep the text within your target length with a custom suffix."
        />
      }
      options={
        <>
          <div className="options-label">Limit</div>
          <input
            type="number"
            className="textarea"
            value={limit}
            min="1"
            onChange={(event) => setLimit(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />

          <div className="options-label">Unit</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['characters', 'Characters'],
              ['words', 'Words'],
              ['sentences', 'Sentences'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${unit === value ? ' active' : ''}`}
                onClick={() => setUnit(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Boundary</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['exact', 'Exact'],
              ['word', 'Word'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${boundary === value ? ' active' : ''}`}
                onClick={() => setBoundary(value)}
                disabled={unit !== 'characters' && value === 'word'}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Suffix</div>
          <input
            type="text"
            className="textarea"
            value={suffix}
            onChange={(event) => setSuffix(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'truncated-text.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
