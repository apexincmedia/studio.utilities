'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import {
  extractErrorLocation,
  getByteSize,
} from '@/lib/developer-tool-utils';

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
      <div style={{ fontSize: 13 }}>Formatting GraphQL…</div>
    </div>
  );
}

export default function GraphqlFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('format');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ output: '', error: null, status: null });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null, status: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const graphqlModule = await import('graphql');
        const parsed = graphqlModule.parse(debouncedInput);
        const output = graphqlModule.print(parsed);

        if (!cancelled) {
          setResult({
            output: mode === 'format' ? output : '',
            error: null,
            status: 'valid',
          });
        }
      } catch (error) {
        if (!cancelled) {
          const details = extractErrorLocation(debouncedInput, error);
          setResult({
            output: '',
            status: 'invalid',
            error:
              details.line && details.column
                ? `${details.message} (line ${details.line}, column ${details.column})`
                : details.message,
          });
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
  }, [debouncedInput, mode]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="GraphQL Input"
      inputPlaceholder="query GetTools { tools { slug name } }"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'format' ? 'Formatted GraphQL' : 'Validation'}
      error={result.error}
      output={result.output}
      outputLabel="Formatted GraphQL"
      outputPlaceholder="Formatted GraphQL will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.split('\n').length} lines`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : mode === 'validate' && debouncedInput.trim() ? (
          result.status === 'valid' ? (
            <MetricGrid
              items={[
                {
                  label: 'Validation',
                  value: 'Valid GraphQL',
                  description: 'The query or schema parsed successfully.',
                  tone: 'success',
                  iconName: 'CheckCircle2',
                },
              ]}
              columns="1fr"
            />
          ) : undefined
        ) : undefined
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Format or validate GraphQL documents"
          message="Paste a query, mutation, subscription, or schema definition to normalize whitespace or catch syntax issues before shipping."
        />
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['format', 'Format'],
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

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('format');
      }}
      downloadConfig={{
        filename: 'query.graphql',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
