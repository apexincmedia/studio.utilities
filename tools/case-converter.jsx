'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { CASE_TRANSFORMS, getWords } from '@/lib/text-tool-utils';

const CASE_OPTIONS = [
  ['uppercase', 'UPPER'],
  ['lowercase', 'lower'],
  ['title', 'Title'],
  ['sentence', 'Sentence'],
  ['camel', 'camelCase'],
  ['pascal', 'PascalCase'],
  ['snake', 'snake_case'],
  ['kebab', 'kebab-case'],
  ['constant', 'CONSTANT'],
];

export default function CaseConverter() {
  const [input, setInput] = useState('');
  const [selectedCase, setSelectedCase] = useState('title');
  const debouncedInput = useDebounce(input, 150);
  const transform = CASE_TRANSFORMS[selectedCase] ?? CASE_TRANSFORMS.title;
  const output = debouncedInput ? transform(debouncedInput) : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Source Text"
      inputPlaceholder="Paste text to convert into a different case style…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${input.length} characters`, `${getWords(input).length} words`]}
          />
        ) : null
      }
      output={output}
      outputLabel="Converted Text"
      outputPlaceholder="Converted text will appear here…"
      outputStats={
        output ? (
          <TextStatLine
            items={[`${output.length} characters`, `Style: ${selectedCase}`]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Type"
          title="Choose a case style"
          message="Paste text, then click any style on the right to instantly convert it without retyping."
        />
      }
      options={
        <>
          <div className="options-label">Case Styles</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {CASE_OPTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`mode-btn${selectedCase === key ? ' active' : ''}`}
                style={{ flex: 'unset' }}
                onClick={() => setSelectedCase(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-divider" />
          <div className="options-label">Current Style</div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
              {CASE_OPTIONS.find(([key]) => key === selectedCase)?.[1]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              Switch between all nine casing styles without changing the original input.
            </div>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: `${selectedCase}-case.txt`,
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
