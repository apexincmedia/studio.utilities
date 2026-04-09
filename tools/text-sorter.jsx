'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { normalizeLineBreaks, splitLines } from '@/lib/text-tool-utils';

function sortText(text, { direction, sortBy, caseSensitive, trimBeforeSort }) {
  const preparedLines = splitLines(text)
    .map((line) => (trimBeforeSort ? line.trim() : line))
    .filter((line) => line.length > 0);

  const sensitivity = caseSensitive ? 'variant' : 'base';

  preparedLines.sort((left, right) => {
    if (sortBy === 'numeric') {
      const leftValue = Number.parseFloat(left);
      const rightValue = Number.parseFloat(right);
      const leftFinite = Number.isFinite(leftValue);
      const rightFinite = Number.isFinite(rightValue);

      if (leftFinite && rightFinite) {
        return leftValue - rightValue;
      }

      if (leftFinite) return -1;
      if (rightFinite) return 1;
    }

    if (sortBy === 'length') {
      return left.length - right.length || left.localeCompare(right, undefined, { sensitivity });
    }

    return left.localeCompare(right, undefined, { sensitivity, numeric: sortBy === 'numeric' });
  });

  if (direction === 'desc') {
    preparedLines.reverse();
  }

  return preparedLines.join('\n');
}

export default function TextSorter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState('asc');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimBeforeSort, setTrimBeforeSort] = useState(true);

  const debouncedInput = useDebounce(input, 150);
  const output = debouncedInput
    ? sortText(debouncedInput, {
        direction,
        sortBy,
        caseSensitive,
        trimBeforeSort,
      })
    : '';

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Unsorted Lines"
      inputPlaceholder="Paste one line per item…"
      inputStats={
        input ? (
          <TextStatLine
            items={[`${normalizeLineBreaks(input).split('\n').length} lines`]}
          />
        ) : null
      }
      output={output}
      outputLabel="Sorted Result"
      outputPlaceholder="Sorted lines will appear here…"
      outputStats={
        output ? (
          <TextStatLine
            items={[`Mode: ${sortBy}`, direction === 'asc' ? 'A to Z' : 'Z to A']}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Layers"
          title="Sort any line-based list"
          message="Sort alphabetically, numerically, or by length, then copy or download the cleaned list."
        />
      }
      options={
        <>
          <div className="options-label">Direction</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['asc', 'A to Z'],
              ['desc', 'Z to A'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${direction === value ? ' active' : ''}`}
                onClick={() => setDirection(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Sort By</div>
          <select
            className="textarea"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="numeric">Numeric</option>
            <option value="length">Length</option>
          </select>

          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(event) => setCaseSensitive(event.target.checked)}
              />
              <span className="checkbox-label">Case sensitive sort</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={trimBeforeSort}
                onChange={(event) => setTrimBeforeSort(event.target.checked)}
              />
              <span className="checkbox-label">Trim each line before sorting</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'sorted-text.txt',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
