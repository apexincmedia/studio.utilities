'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { getByteSize } from '@/lib/developer-tool-utils';
import { convertCurlCommand } from '@/lib/curl-to-code-utils';

const TARGETS = {
  'js-fetch': { label: 'JS Fetch' },
  'js-axios': { label: 'JS Axios' },
  python: { label: 'Python' },
  php: { label: 'PHP' },
  ruby: { label: 'Ruby' },
  go: { label: 'Go' },
  rust: { label: 'Rust' },
};

function getConversionResult(input, target) {
  if (!input.trim()) {
    return {
      output: '',
      error: null,
      warnings: [],
      parsed: null,
    };
  }

  try {
    const converted = convertCurlCommand(input, target);
    return {
      output: converted.output,
      error: null,
      warnings: converted.warnings,
      parsed: converted.parsed,
    };
  } catch (error) {
    return {
      output: '',
      error: error.message || 'Could not convert the cURL command.',
      warnings: [],
      parsed: null,
    };
  }
}

export default function CurlToCode() {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState('js-fetch');
  const debouncedInput = useDebounce(input, 150);

  const result = useMemo(
    () => getConversionResult(debouncedInput, target),
    [debouncedInput, target]
  );

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="cURL Command"
      inputPlaceholder="curl https://api.example.com/tools -H 'Authorization: Bearer token'"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="Converted Code"
      error={result.error}
      output={result.output}
      outputLabel="Generated Snippet"
      outputPlaceholder="Converted code will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[
              `${result.output.split('\n').length} lines`,
              `${result.output.length} characters`,
              `${getByteSize(result.output)} bytes`,
            ]}
            marginBottom={0}
          />
        ) : null
      }
      extraActions={
        result.parsed ? (
          <MetricGrid
            items={[
              {
                label: 'Target',
                value: TARGETS[target].label,
                description: 'Current generated language target',
                iconName: 'Terminal',
              },
              {
                label: 'Method',
                value: result.parsed.method,
                description: result.parsed.hasBody
                  ? `Body type: ${result.parsed.bodyKind}`
                  : 'No request body detected',
                iconName: 'Send',
              },
              {
                label: 'Headers',
                value: String(result.parsed.headerCount),
                description: 'Headers translated from the cURL command',
                iconName: 'List',
              },
              {
                label: 'Warnings',
                value: String(result.warnings.length),
                description:
                  result.warnings.length > 0
                    ? 'Review the notes before using the snippet'
                    : 'No translation caveats detected',
                tone: result.warnings.length > 0 ? 'warning' : 'success',
                iconName: result.warnings.length > 0 ? 'AlertCircle' : 'CheckCircle2',
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
          iconName="Terminal"
          title="Translate cURL into application code"
          message="Paste a working cURL command to generate ready-to-adapt snippets for JavaScript, Python, PHP, Ruby, Go, or Rust."
        />
      }
      options={
        <>
          <div className="options-label">Target Language</div>
          <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {Object.entries(TARGETS).map(([value, config]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${target === value ? ' active' : ''}`}
                onClick={() => setTarget(value)}
              >
                {config.label}
              </button>
            ))}
          </div>

          {result.warnings.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--warning)',
                background: 'var(--warning-bg)',
                marginBottom: 20,
              }}
            >
              <Icon
                icon={ICON_MAP.AlertCircle}
                size={15}
                color="var(--warning)"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                  Translation Notes
                </div>
                {result.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setTarget('js-fetch');
      }}
      downloadConfig={{
        filename: `curl-${target}.txt`,
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
