'use client';

import { useState } from 'react';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { useDebounce } from '@/lib/tool-utils';
import { extractNumbersFromText } from '@/lib/text-tool-utils';

export default function NumberExtractor() {
  const [input, setInput] = useState('');
  const [includeDecimals, setIncludeDecimals] = useState(true);
  const [includeNegatives, setIncludeNegatives] = useState(true);
  const [deduplicate, setDeduplicate] = useState(true);
  const [sort, setSort] = useState('none');

  const debouncedInput = useDebounce(input, 150);
  const values = debouncedInput
    ? extractNumbersFromText(debouncedInput, {
        includeDecimals,
        includeNegatives,
        deduplicate,
        sort,
      })
    : [];
  const numericValues = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  const output = values.join('\n');

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Source Text"
      inputPlaceholder="Paste text with prices, IDs, or measurements to extract every number…"
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="Extracted Numbers"
      error={input.trim() && !values.length ? 'No numbers found with the current filters.' : null}
      output={output}
      outputLabel="Numbers List"
      outputPlaceholder="Extracted numbers will appear here…"
      outputStats={
        values.length ? (
          <TextStatLine
            items={[
              `${values.length} found`,
              numericValues.length ? `Min ${Math.min(...numericValues)}` : 'Min -',
              numericValues.length ? `Max ${Math.max(...numericValues)}` : 'Max -',
            ]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Hash"
          title="Extract numbers from any block of text"
          message="Pull out integers, decimals, negatives, or sorted values, then copy or download the cleaned list."
        />
      }
      options={
        <>
          <div className="options-label">Filters</div>
          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeDecimals}
                onChange={(event) => setIncludeDecimals(event.target.checked)}
              />
              <span className="checkbox-label">Include decimal values</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeNegatives}
                onChange={(event) => setIncludeNegatives(event.target.checked)}
              />
              <span className="checkbox-label">Include negative values</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(event) => setDeduplicate(event.target.checked)}
              />
              <span className="checkbox-label">Deduplicate results</span>
            </label>
          </div>

          <div className="options-label">Sort</div>
          <select
            className="textarea"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          >
            <option value="none">Keep original order</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'numbers.csv',
        mimeType: 'text/csv;charset=utf-8',
        text: values.join('\n'),
        enabled: Boolean(values.length),
      }}
    />
  );
}
