'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { normalizeLineBreaks, splitLines } from '@/lib/text-tool-utils';

function removeDuplicateLines(
  text,
  { caseSensitive, trimWhitespace, sortResult }
) {
  const lines = splitLines(text);
  const seen = new Set();
  const unique = [];
  let removedCount = 0;

  lines.forEach((line) => {
    const preparedLine = trimWhitespace ? line.trim() : line;
    const key = caseSensitive ? preparedLine : preparedLine.toLowerCase();

    if (seen.has(key)) {
      removedCount += 1;
      return;
    }

    seen.add(key);
    unique.push(preparedLine);
  });

  if (sortResult) {
    unique.sort((left, right) =>
      left.localeCompare(right, undefined, {
        sensitivity: caseSensitive ? 'variant' : 'base',
      })
    );
  }

  return {
    output: unique.join('\n'),
    removedCount,
    keptCount: unique.length,
  };
}

export default function DuplicateLineRemover() {
  const [input, setInput] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [sortResult, setSortResult] = useState(false);

  const debouncedInput = useDebounce(input, 150);
  const result = debouncedInput
    ? removeDuplicateLines(debouncedInput, {
        caseSensitive,
        trimWhitespace,
        sortResult,
      })
    : { output: '', removedCount: 0, keptCount: 0 };

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Original Lines"
      inputPlaceholder="Paste one item per line…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${normalizeLineBreaks(input).split('\n').length} lines`]}
          />
        ) : null
      }
      output={result.output}
      outputLabel="Deduplicated Lines"
      outputPlaceholder="Unique lines will appear here…"
      outputStats={
        result.output ? (
          <TextStatLine
            items={[
              `${result.keptCount} kept`,
              `${result.removedCount} removed`,
            ]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Layers"
          title="Remove duplicate lines"
          message="Paste a list and this tool will keep the first occurrence of each line while preserving order."
        />
      }
      options={
        <>
          <div className="options-label">Comparison Rules</div>
          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(event) => setCaseSensitive(event.target.checked)}
              />
              <span className="checkbox-label">Case sensitive compare</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={trimWhitespace}
                onChange={(event) => setTrimWhitespace(event.target.checked)}
              />
              <span className="checkbox-label">Trim whitespace before compare</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={sortResult}
                onChange={(event) => setSortResult(event.target.checked)}
              />
              <span className="checkbox-label">Sort unique lines after cleanup</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'unique-lines.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
