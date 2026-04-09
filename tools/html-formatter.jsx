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
  fallbackBeautifyHtml,
  getByteSize,
  getSavingsPercent,
  minifyHtml,
  stripHtmlComments,
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
      <div style={{ fontSize: 13 }}>Formatting HTML…</div>
    </div>
  );
}

export default function HtmlFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('beautify');
  const [indent, setIndent] = useState('2');
  const [removeComments, setRemoveComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ output: '', error: null, fallbackUsed: false });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null, fallbackUsed: false });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (mode === 'minify') {
          if (!cancelled) {
            setResult({
              output: minifyHtml(debouncedInput, { removeComments }),
              error: null,
              fallbackUsed: false,
            });
          }
          return;
        }

        try {
          const source = removeComments ? stripHtmlComments(debouncedInput, true) : debouncedInput;
          const prettierModule = await import('prettier/standalone');
          const htmlPlugin = await import('prettier/plugins/html');
          const format = prettierModule.format ?? prettierModule.default?.format;
          if (!format) {
            throw new Error('Prettier formatter is unavailable.');
          }
          const output = await format(source, {
            parser: 'html',
            plugins: [htmlPlugin.default ?? htmlPlugin],
            tabWidth: Number.parseInt(indent, 10),
          });

          if (!cancelled) {
            setResult({ output, error: null, fallbackUsed: false });
          }
        } catch {
          if (!cancelled) {
            setResult({
              output: fallbackBeautifyHtml(debouncedInput, Number.parseInt(indent, 10), removeComments),
              error: null,
              fallbackUsed: true,
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            output: '',
            error: error.message,
            fallbackUsed: false,
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
  }, [debouncedInput, mode, indent, removeComments]);

  const savings = mode === 'minify' ? getSavingsPercent(input, result.output) : null;

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="HTML Input"
      inputPlaceholder="<section><h1>Apex Studio</h1><p>Utility suite</p></section>"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'beautify' ? 'Beautified HTML' : 'Minified HTML'}
      error={result.error}
      output={result.output}
      outputLabel="Formatted HTML"
      outputPlaceholder="Formatted HTML will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[
              `${result.output.length} characters`,
              `${getByteSize(result.output)} bytes`,
              ...(savings !== null ? [`${savings > 0 ? '' : '+'}${savings}% size change`] : []),
            ]}
            marginBottom={0}
          />
        ) : null
      }
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : undefined
      }
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Beautify or minify HTML without leaving the browser"
          message="Paste markup to re-indent it with Prettier-style output or collapse it for compact delivery."
        />
      }
      extraActions={
        result.fallbackUsed ? (
          <MetricGrid
            items={[
              {
                label: 'Formatter',
                value: 'Fallback',
                description: 'Prettier was unavailable, so a regex formatter was used.',
                tone: 'warning',
                iconName: 'Info',
              },
            ]}
            columns="1fr"
            marginBottom={8}
          />
        ) : null
      }
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['beautify', 'Beautify'],
              ['minify', 'Minify'],
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
            {['2', '4'].map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${indent === value ? ' active' : ''}`}
                onClick={() => setIndent(value)}
                disabled={mode !== 'beautify'}
              >
                {value} spaces
              </button>
            ))}
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={removeComments}
              onChange={(event) => setRemoveComments(event.target.checked)}
            />
            <span className="checkbox-label">Remove HTML comments</span>
          </label>
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('beautify');
        setIndent('2');
        setRemoveComments(false);
      }}
      downloadConfig={{
        filename: 'formatted.html',
        mimeType: 'text/html;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
