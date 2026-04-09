'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import { parseCsvToJson } from '@/lib/data-format-utils';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';

const DELIMITER_OPTIONS = [
  ['auto', 'Auto'],
  ['comma', 'Comma'],
  ['semicolon', 'Semicolon'],
  ['tab', 'Tab'],
];

function getDelimiterLabel(delimiter) {
  if (delimiter === '\t') return 'Tab';
  if (delimiter === ';') return 'Semicolon';
  if (delimiter === ',') return 'Comma';
  if (delimiter === '|') return 'Pipe';
  return delimiter || 'Unknown';
}

function getCsvToJsonResult(input, options) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
      meta: null,
    };
  }

  try {
    const parsed = parseCsvToJson(input, options);
    return {
      output: JSON.stringify(parsed.rows, null, 2),
      error: null,
      meta: {
        rows: parsed.rows.length,
        columns: parsed.headers.length,
        delimiter: getDelimiterLabel(parsed.delimiter),
      },
    };
  } catch (error) {
    return {
      output: '',
      error: error.message || 'Unable to convert that CSV input.',
      meta: null,
    };
  }
}

export default function CsvToJson() {
  const [input, setInput] = useState('');
  const [delimiter, setDelimiter] = useState('auto');
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getCsvToJsonResult(debouncedInput, { delimiter, trimWhitespace }),
    [debouncedInput, delimiter, trimWhitespace]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="CSV Input"
      inputPlaceholder={'name,email\nApex,team@apex.studio'}
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${input.split(/\r?\n/).filter(Boolean).length} lines`]} />
        ) : null
      }
      dividerLabel="JSON Output"
      error={result.error}
      output={result.output}
      outputLabel="Converted JSON"
      outputPlaceholder="Converted JSON will appear here..."
      outputStats={
        result.meta ? (
          <TextStatLine
            items={[
              `${result.meta.rows} rows`,
              `${result.meta.columns} columns`,
              `${result.meta.delimiter} delimiter`,
            ]}
            marginBottom={0}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileSpreadsheet"
          title="Convert RFC 4180 CSV into clean JSON"
          message="Paste CSV data to auto-detect its delimiter, parse quoted cells correctly, and export a prettified JSON array."
        />
      }
      options={
        <>
          <div className="options-label">Delimiter</div>
          <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {DELIMITER_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${delimiter === value ? ' active' : ''}`}
                onClick={() => setDelimiter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={(event) => setTrimWhitespace(event.target.checked)}
            />
            <span className="checkbox-label">Trim whitespace around cells</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setDelimiter('auto');
        setTrimWhitespace(true);
      }}
      downloadConfig={{
        filename: 'converted.json',
        mimeType: 'application/json;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
      privacyNote="CSV parsing runs entirely in the browser, including quoted-field handling and delimiter detection."
    />
  );
}
