'use client';

import { useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { rot13Transform } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

export default function Rot13() {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 150);
  const output = debouncedInput ? rot13Transform(debouncedInput) : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Text Input"
      inputPlaceholder="Paste text to apply the ROT13 substitution cipher..."
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="ROT13 Output"
      output={output}
      outputLabel="Transformed Text"
      outputPlaceholder="ROT13 output will appear here..."
      outputStats={
        output ? <TextStatLine items={[`${output.length} characters`, 'ROT13 is reversible']} marginBottom={0} /> : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="RefreshCw"
          title="Apply ROT13 instantly"
          message="ROT13 uses the same operation for encoding and decoding, so one input is all you need."
        />
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
            ROT13 rotates each letter by 13 positions. Running the tool twice returns the original text.
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'rot13-output.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
