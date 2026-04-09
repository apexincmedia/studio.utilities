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
  getJsonStructureStats,
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
      <div style={{ fontSize: 13 }}>Parsing TOML…</div>
    </div>
  );
}

export default function TomlToJson() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ output: '', error: null, stats: null });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null, stats: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const tomlModule = await import('@iarna/toml');
        const parsed = tomlModule.parse(debouncedInput);
        if (!cancelled) {
          setResult({
            output: JSON.stringify(parsed, null, 2),
            error: null,
            stats: getJsonStructureStats(parsed),
          });
        }
      } catch (error) {
        if (!cancelled) {
          const details = extractErrorLocation(debouncedInput, error);
          setResult({
            output: '',
            stats: null,
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
  }, [debouncedInput]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="TOML Input"
      inputPlaceholder='title = "Apex Studio"&#10;[tool]&#10;slug = "toml-to-json"'
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="JSON Output"
      error={result.error}
      output={result.output}
      outputLabel="Converted JSON"
      outputPlaceholder="Converted JSON will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.length} characters`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={loading ? <LoadingState /> : undefined}
      extraActions={
        result.stats ? (
          <MetricGrid
            items={[
              {
                label: 'Keys',
                value: String(result.stats.keys),
                description: 'Object properties parsed from TOML',
              },
              {
                label: 'Arrays / Objects',
                value: `${result.stats.arrays} / ${result.stats.objects}`,
                description: 'Structured containers in the result',
              },
            ]}
            columns="repeat(2, minmax(0, 1fr))"
            marginBottom={8}
          />
        ) : null
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Parse TOML into structured JSON"
          message="Paste configuration from Cargo, Hugo, or any TOML file to get a validated JSON version instantly."
        />
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
              color: 'var(--text-dim)',
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            Supports standard TOML tables, arrays, booleans, dates, and nested configuration blocks.
          </div>
          <div className="panel-divider" />
        </>
      }
      onClear={() => setInput('')}
      downloadConfig={{
        filename: 'converted.json',
        mimeType: 'application/json;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
