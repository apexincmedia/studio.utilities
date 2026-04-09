'use client';

import { useState } from 'react';
import { lookupUnicodeValue } from '@/lib/encoding-tool-utils';
import {
  EmptyState,
  MetricGrid,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

export default function UnicodeLookup() {
  const [input, setInput] = useState('');
  const result = input.trim() ? lookupUnicodeValue(input) : null;
  const report = result
    ? [
        `Character: ${result.character}`,
        `Code point: ${result.hex}`,
        `Name: ${result.name}`,
        `Block: ${result.block}`,
        `Category: ${result.category}`,
        `HTML entity: ${result.htmlEntity}`,
        `CSS escape: ${result.cssEscape}`,
        `UTF-8 bytes: ${result.utf8Bytes}`,
      ].join('\n')
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputRenderer={
        <>
          <div className="panel-label">Character or Code Point</div>
          <input
            type="text"
            className="textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a character, U+1F600, or 1F600"
            style={{ minHeight: 'auto', padding: '14px 16px', marginBottom: 8 }}
          />
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 16 }}>
            Search by character or hexadecimal code point.
          </div>
        </>
      }
      dividerLabel="Lookup Result"
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Search"
          title="Inspect any Unicode character"
          message="Look up the code point, block, category, HTML entity, CSS escape, and UTF-8 bytes for a character or U+ code."
        />
      }
      outputRenderer={
        result ? (
          <>
            <div className="panel-label">Unicode Details</div>
            <MetricGrid
              items={[
                { label: 'Character', value: result.character || '(none)', iconName: 'Type' },
                { label: 'Code Point', value: result.hex, iconName: 'Hash' },
                { label: 'Name', value: result.name, description: result.block, iconName: 'FileText' },
                { label: 'Category', value: result.category, iconName: 'Layers' },
                { label: 'HTML Entity', value: result.htmlEntity, iconName: 'FileCode' },
                { label: 'CSS Escape', value: result.cssEscape, iconName: 'Code2' },
                { label: 'UTF-8 Bytes', value: result.utf8Bytes, iconName: 'Cpu' },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
            />
          </>
        ) : null
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
            This lookup gives a practical browser-side view of the code point, block, category, escapes, and byte representation.
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      copyValue={report}
      copyLabel="Copy Report"
      downloadConfig={{
        filename: 'unicode-lookup.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: report,
        enabled: Boolean(report),
      }}
    />
  );
}
