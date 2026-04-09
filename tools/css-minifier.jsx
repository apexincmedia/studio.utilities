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
  beautifyCss,
  getByteSize,
  getSavingsPercent,
  minifyCss,
} from '@/lib/developer-tool-utils';

export default function CssMinifier() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('minify');
  const [preserveImportantComments, setPreserveImportantComments] = useState(true);
  const debouncedInput = useDebounce(input, 150);

  const output = useMemo(() => {
    if (!debouncedInput.trim()) return '';
    return mode === 'minify'
      ? minifyCss(debouncedInput, { preserveImportantComments })
      : beautifyCss(debouncedInput, { preserveImportantComments, indentSize: 2 });
  }, [debouncedInput, mode, preserveImportantComments]);

  const savings = mode === 'minify' ? getSavingsPercent(input, output) : null;

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="CSS Input"
      inputPlaceholder=".card { padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'minify' ? 'Minified CSS' : 'Beautified CSS'}
      output={output}
      outputLabel="CSS Output"
      outputPlaceholder="Formatted CSS will appear here..."
      outputStats={
        output ? (
          <TextStatLine
            items={[
              `${output.length} characters`,
              `${getByteSize(output)} bytes`,
              ...(savings !== null ? [`${savings}% saved`] : []),
            ]}
            marginBottom={0}
          />
        ) : null
      }
      extraActions={
        output && savings !== null ? (
          <MetricGrid
            items={[
              {
                label: 'Size Change',
                value: `${savings}%`,
                description: 'Compared to the original CSS size',
                tone: savings > 0 ? 'success' : 'warning',
                iconName: 'FileCode',
              },
            ]}
            columns="1fr"
            marginBottom={8}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Minify or beautify CSS instantly"
          message="Paste any stylesheet to collapse it for production or expand it back into a readable rule-by-rule layout."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['minify', 'Minify'],
              ['beautify', 'Beautify'],
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

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={preserveImportantComments}
              onChange={(event) => setPreserveImportantComments(event.target.checked)}
            />
            <span className="checkbox-label">Preserve important `/*! ... */` comments</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('minify');
        setPreserveImportantComments(true);
      }}
      downloadConfig={{
        filename: mode === 'minify' ? 'styles.min.css' : 'styles.css',
        mimeType: 'text/css;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
