'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { convertJsonToCsv } from '@/lib/data-format-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

function getJsonToCsvResult(input, options) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
      meta: null,
    };
  }

  try {
    const converted = convertJsonToCsv(input, options);
    return {
      output: converted.output,
      error: null,
      meta: {
        rows: converted.rowCount,
        columns: converted.columnCount,
      },
    };
  } catch (error) {
    return {
      output: '',
      error: error.message || 'Unable to convert that JSON input.',
      meta: null,
    };
  }
}

export default function JsonToCsv() {
  const [input, setInput] = useState('');
  const [flattenNested, setFlattenNested] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getJsonToCsvResult(debouncedInput, { flattenNested, includeHeader }),
    [debouncedInput, flattenNested, includeHeader]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JSON Input"
      inputPlaceholder='[{"name":"Apex","address":{"city":"Chicago"}}]'
      inputStats={
        input ? <TextStatLine items={[`${input.length} characters`]} /> : null
      }
      dividerLabel="CSV Output"
      error={result.error}
      output={result.output}
      outputLabel="Converted CSV"
      outputPlaceholder="Converted CSV will appear here..."
      outputStats={
        result.meta ? (
          <TextStatLine
            items={[
              `${result.meta.rows} rows`,
              `${result.meta.columns} columns`,
              includeHeader ? 'Header row included' : 'Header row omitted',
            ]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Braces"
          title="Flatten JSON objects into a spreadsheet-friendly CSV"
          message="Paste a JSON object or array to collect all keys, flatten nested values with dot notation, and export clean CSV rows."
        />
      }
      options={
        <>
          <div className="options-label">Options</div>
          <div className="options-row" style={{ marginBottom: 20 }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={flattenNested}
                onChange={(event) => setFlattenNested(event.target.checked)}
              />
              <span className="checkbox-label">Flatten nested values</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(event) => setIncludeHeader(event.target.checked)}
              />
              <span className="checkbox-label">Include header row</span>
            </label>
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setFlattenNested(true);
        setIncludeHeader(true);
      }}
      downloadConfig={{
        filename: 'converted.csv',
        mimeType: 'text/csv;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
      privacyNote="Nested keys can be flattened into `dot.notation` automatically so the output is easier to open in spreadsheets."
    />
  );
}
