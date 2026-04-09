'use client';

import { useEffect, useState } from 'react';
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
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';

function LoadingState({ label }) {
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
      <div style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

export default function YamlJsonTool({ defaultMode = 'yaml-to-json' }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState(defaultMode);
  const [result, setResult] = useState({ output: '', error: null, stats: null });
  const [loading, setLoading] = useState(false);
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function runConversion() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null, stats: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const yamlModule = await import('js-yaml');
        let output = '';
        let stats = null;

        if (mode === 'yaml-to-json') {
          const documents = [];
          yamlModule.loadAll(debouncedInput, (document) => {
            documents.push(document);
          });
          const parsed = documents.length > 1 ? documents : (documents[0] ?? null);
          output = JSON.stringify(parsed, null, 2);
          stats = getJsonStructureStats(parsed);
        } else {
          const parsed = JSON.parse(debouncedInput);
          output = yamlModule.dump(parsed, { indent: 2, lineWidth: 120 });
          stats = getJsonStructureStats(parsed);
        }

        if (!cancelled) {
          setResult({ output, error: null, stats });
        }
      } catch (error) {
        if (!cancelled) {
          const details = extractErrorLocation(debouncedInput, error);
          setResult({
            output: '',
            error:
              details.line && details.column
                ? `${details.message} (line ${details.line}, column ${details.column})`
                : details.message,
            stats: null,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runConversion();
    return () => {
      cancelled = true;
    };
  }, [debouncedInput, mode]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel={mode === 'yaml-to-json' ? 'YAML Input' : 'JSON Input'}
      inputPlaceholder={
        mode === 'yaml-to-json'
          ? 'Paste YAML here...'
          : 'Paste JSON here...'
      }
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'yaml-to-json' ? 'JSON Output' : 'YAML Output'}
      error={result.error}
      output={result.output}
      outputLabel={mode === 'yaml-to-json' ? 'Converted JSON' : 'Converted YAML'}
      outputPlaceholder="Converted output will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${result.output.length} characters`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={
        loading ? (
          <LoadingState
            label={mode === 'yaml-to-json' ? 'Converting YAML to JSON…' : 'Converting JSON to YAML…'}
          />
        ) : undefined
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Convert between YAML and JSON"
          message="Switch directions at any time to parse configuration files into JSON or emit clean YAML from JSON objects."
        />
      }
      options={
        <>
          <div className="options-label">Direction</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['yaml-to-json', 'YAML -> JSON'],
              ['json-to-yaml', 'JSON -> YAML'],
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

          {result.stats ? (
            <>
              <MetricGrid
                items={[
                  {
                    label: 'Keys',
                    value: String(result.stats.keys),
                    description: 'Object properties parsed',
                  },
                  {
                    label: 'Arrays / Objects',
                    value: `${result.stats.arrays} / ${result.stats.objects}`,
                    description: 'Structured containers',
                  },
                ]}
                columns="repeat(2, minmax(0, 1fr))"
                marginBottom={20}
              />
            </>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode(defaultMode);
      }}
      downloadConfig={{
        filename: mode === 'yaml-to-json' ? 'converted.json' : 'converted.yaml',
        mimeType:
          mode === 'yaml-to-json'
            ? 'application/json;charset=utf-8'
            : 'text/yaml;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
