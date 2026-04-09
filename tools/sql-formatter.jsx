'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { getByteSize } from '@/lib/developer-tool-utils';

const DIALECTS = [
  ['sql', 'Standard SQL'],
  ['mysql', 'MySQL'],
  ['postgresql', 'PostgreSQL'],
  ['sqlite', 'SQLite'],
  ['bigquery', 'BigQuery'],
];

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--muted)',
      }}
    >
      <Icon icon={ICON_MAP.Loader2} size={26} className="spin" />
      <div style={{ fontSize: 13 }}>Formatting SQL…</div>
    </div>
  );
}

export default function SqlFormatter() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState('sql');
  const [indent, setIndent] = useState('2');
  const [uppercaseKeywords, setUppercaseKeywords] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ output: '', error: null });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const formatterModule = await import('sql-formatter');
        const output = formatterModule.format(debouncedInput, {
          language: dialect,
          tabWidth: Number.parseInt(indent, 10),
          keywordCase: uppercaseKeywords ? 'upper' : 'preserve',
        });

        if (!cancelled) {
          setResult({ output, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ output: '', error: error.message || 'Could not format SQL.' });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedInput, dialect, indent, uppercaseKeywords]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="SQL Input"
      inputPlaceholder="select id,name from users where active = 1 order by created_at desc;"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="Formatted SQL"
      error={result.error}
      output={result.output}
      outputLabel="Beautified Query"
      outputPlaceholder="Formatted SQL will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.split('\n').length} lines`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={loading ? <LoadingState /> : undefined}
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="Database"
          title="Beautify SQL across major dialects"
          message="Paste a query to normalize indentation, keyword casing, and clause spacing for MySQL, PostgreSQL, SQLite, BigQuery, and standard SQL."
        />
      }
      options={
        <>
          <div className="options-label">Dialect</div>
          <select
            className="textarea"
            value={dialect}
            onChange={(event) => setDialect(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          >
            {DIALECTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <div className="options-label">Indent</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            {['2', '4'].map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${indent === value ? ' active' : ''}`}
                onClick={() => setIndent(value)}
              >
                {value} spaces
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={uppercaseKeywords}
              onChange={(event) => setUppercaseKeywords(event.target.checked)}
            />
            <span className="checkbox-label">Uppercase SQL keywords</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setDialect('sql');
        setIndent('2');
        setUppercaseKeywords(true);
      }}
      downloadConfig={{
        filename: 'formatted.sql',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
