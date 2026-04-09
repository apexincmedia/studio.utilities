'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import {
  extractErrorLocation,
  getByteSize,
  getJsonStructureStats,
} from '@/lib/developer-tool-utils';

function formatIndent(indent) {
  if (indent === 'tab') return '\t';
  return ' '.repeat(Number.parseInt(indent, 10));
}

function getJsonFormatterResult(input, mode, indent) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
      parsed: null,
      stats: null,
      status: null,
    };
  }

  try {
    const parsed = JSON.parse(input);
    const stats = getJsonStructureStats(parsed);

    return {
      output:
        mode === 'minify'
          ? JSON.stringify(parsed)
          : mode === 'beautify'
            ? JSON.stringify(parsed, null, formatIndent(indent))
            : '',
      error: null,
      parsed,
      stats,
      status: 'valid',
    };
  } catch (error) {
    const details = extractErrorLocation(input, error);
    return {
      output: '',
      error:
        details.line && details.column
          ? `${details.message} (line ${details.line}, column ${details.column})`
          : details.message,
      parsed: null,
      stats: null,
      status: 'invalid',
    };
  }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('beautify');
  const [indent, setIndent] = useState('2');
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getJsonFormatterResult(debouncedInput, mode, indent),
    [debouncedInput, mode, indent]
  );

  const inputBytes = getByteSize(input);
  const outputBytes = getByteSize(result.output);
  const downloadEnabled = Boolean(result.output);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JSON Input"
      inputPlaceholder='Paste JSON here, for example: {"name":"Apex","tools":55}'
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${inputBytes} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'validate' ? 'Validation' : 'Formatted Output'}
      error={result.error}
      output={result.output}
      outputLabel={mode === 'minify' ? 'Minified JSON' : 'Beautified JSON'}
      outputPlaceholder="Formatted JSON will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.length} characters`, `${outputBytes} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={
        mode === 'validate' && debouncedInput.trim() ? (
          result.status === 'valid' ? (
            <>
              <MetricGrid
                items={[
                  {
                    label: 'Validation',
                    value: 'Valid JSON',
                    description: 'The document parsed successfully.',
                    tone: 'success',
                    iconName: 'CheckCircle2',
                  },
                  {
                    label: 'Keys',
                    value: String(result.stats?.keys ?? 0),
                    description: 'Object properties discovered',
                    iconName: 'Braces',
                  },
                  {
                    label: 'Values',
                    value: String(result.stats?.primitives ?? 0),
                    description: 'Primitive values found',
                    iconName: 'FileJson',
                  },
                  {
                    label: 'Arrays / Objects',
                    value: `${result.stats?.arrays ?? 0} / ${result.stats?.objects ?? 0}`,
                    description: 'Container nodes in the document',
                    iconName: 'Layers',
                  },
                ]}
              />
            </>
          ) : null
        ) : undefined
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Braces"
          title="Beautify, minify, or validate JSON instantly"
          message="Paste a JSON document to reformat it, compress it, or validate it with exact parse feedback and structure stats."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['beautify', 'Beautify'],
              ['minify', 'Minify'],
              ['validate', 'Validate'],
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

          <div className="options-label">Indent</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['2', '2 spaces'],
              ['4', '4 spaces'],
              ['tab', 'Tab'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${indent === value ? ' active' : ''}`}
                onClick={() => setIndent(value)}
                disabled={mode !== 'beautify'}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('beautify');
        setIndent('2');
      }}
      downloadConfig={{
        filename: mode === 'minify' ? 'formatted.json' : 'beautified.json',
        mimeType: 'application/json;charset=utf-8',
        text: result.output,
        enabled: downloadEnabled,
      }}
    />
  );
}
