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
  getByteSize,
  getSavingsPercent,
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
      <div style={{ fontSize: 13 }}>Minifying JavaScript…</div>
    </div>
  );
}

export default function JsMinifier() {
  const [input, setInput] = useState('');
  const [compress, setCompress] = useState(true);
  const [mangle, setMangle] = useState(true);
  const [keepFunctionNames, setKeepFunctionNames] = useState(false);
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
        const terser = await import('terser');
        const minified = await terser.minify(debouncedInput, {
          compress,
          mangle: mangle ? { keep_fnames: keepFunctionNames } : false,
          keep_fnames: keepFunctionNames,
        });

        if (!cancelled) {
          if (minified.error) {
            throw minified.error;
          }
          setResult({ output: minified.code || '', error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ output: '', error: error.message || 'Could not minify JavaScript.' });
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
  }, [debouncedInput, compress, mangle, keepFunctionNames]);

  const savings = getSavingsPercent(input, result.output);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="JavaScript Input"
      inputPlaceholder="function greet(name) { console.log(`Hello ${name}`); }"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="Minified Output"
      error={result.error}
      output={result.output}
      outputLabel="Minified JavaScript"
      outputPlaceholder="Minified JavaScript will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine
            items={[
              `${result.output.length} characters`,
              `${getByteSize(result.output)} bytes`,
              ...(savings !== null ? [`${savings}% saved`] : []),
            ]}
            marginBottom={0}
          />
        ) : null
      }
      outputRenderer={loading ? <LoadingState /> : undefined}
      extraActions={
        result.output ? (
          <MetricGrid
            items={[
              {
                label: 'Savings',
                value: savings !== null ? `${savings}%` : '-',
                description: 'Compared to the original source size',
                tone: savings !== null && savings > 0 ? 'success' : 'warning',
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
          title="Minify JavaScript with Terser in the browser"
          message="Paste source code to compress it, optionally mangle identifiers, and inspect the size savings before exporting."
        />
      }
      options={
        <>
          <label className="checkbox-row" style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={compress} onChange={(event) => setCompress(event.target.checked)} />
            <span className="checkbox-label">Enable compression passes</span>
          </label>

          <label className="checkbox-row" style={{ marginBottom: 14 }}>
            <input type="checkbox" checked={mangle} onChange={(event) => setMangle(event.target.checked)} />
            <span className="checkbox-label">Mangle variable and property names</span>
          </label>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              checked={keepFunctionNames}
              onChange={(event) => setKeepFunctionNames(event.target.checked)}
            />
            <span className="checkbox-label">Keep function names for debugging</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setCompress(true);
        setMangle(true);
        setKeepFunctionNames(false);
      }}
      downloadConfig={{
        filename: 'script.min.js',
        mimeType: 'application/javascript;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
