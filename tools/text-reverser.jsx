'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { getWords, splitLines } from '@/lib/text-tool-utils';

const REVERSE_MODES = {
  characters: (text) => [...text].reverse().join(''),
  words: (text) => getWords(text).reverse().join(' '),
  lines: (text) => splitLines(text).reverse().join('\n'),
};

export default function TextReverser() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('characters');
  const debouncedInput = useDebounce(input, 150);
  const output = debouncedInput ? REVERSE_MODES[mode](debouncedInput) : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Original Text"
      inputPlaceholder="Paste text to reverse by characters, words, or lines…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${getWords(input).length} words`]}
          />
        ) : null
      }
      output={output}
      outputLabel="Reversed Output"
      outputPlaceholder="Reversed text will appear here…"
      outputStats={
        output ? (
          <TextStatLine items={[`Mode: ${mode}`]} marginBottom={0} />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="RefreshCw"
          title="Reverse text any way you want"
          message="Flip the full string, reverse word order, or invert line order with a single click."
        />
      }
      options={
        <>
          <div className="options-label">Reverse Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['characters', 'Characters'],
              ['words', 'Words'],
              ['lines', 'Lines'],
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
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: `reversed-${mode}.txt`,
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
