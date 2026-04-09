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
  minifyCss,
  minifyHtml,
} from '@/lib/developer-tool-utils';

function detectLanguage(input = '') {
  const trimmed = input.trim();
  if (!trimmed) return 'html';
  if (trimmed.startsWith('<')) return 'html';
  if (/^[\w.#@-]+\s*\{[\s\S]*:\s*[^;]+;?/m.test(trimmed) && !/\b(function|const|let|var|=>)\b/.test(trimmed)) {
    return 'css';
  }
  return 'javascript';
}

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
      <div style={{ fontSize: 13 }}>Minifying code…</div>
    </div>
  );
}

export default function MultiLanguageMinifier() {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ output: '', error: null, actualLanguage: 'html' });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ output: '', error: null, actualLanguage: 'html' });
        setLoading(false);
        return;
      }

      const actualLanguage = language === 'auto' ? detectLanguage(debouncedInput) : language;
      setLoading(true);

      try {
        let output = '';

        if (actualLanguage === 'html') {
          output = minifyHtml(debouncedInput, { removeComments: true });
        } else if (actualLanguage === 'css') {
          output = minifyCss(debouncedInput, { preserveImportantComments: true });
        } else {
          const terser = await import('terser');
          const minified = await terser.minify(debouncedInput, {
            compress: true,
            mangle: true,
          });
          if (minified.error) throw minified.error;
          output = minified.code || '';
        }

        if (!cancelled) {
          setResult({ output, error: null, actualLanguage });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            output: '',
            error: error.message || 'Could not minify the input.',
            actualLanguage,
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
  }, [debouncedInput, language]);

  const savings = getSavingsPercent(input, result.output);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Source Input"
      inputPlaceholder="<section>...</section> or .card { ... } or function run() { ... }"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="Minified Output"
      error={result.error}
      output={result.output}
      outputLabel="Minified Result"
      outputPlaceholder="Minified code will appear here..."
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
                label: 'Language',
                value: result.actualLanguage.toUpperCase(),
                description: language === 'auto' ? 'Auto-detected from the source' : 'Chosen manually',
                iconName: 'FileCode',
              },
              {
                label: 'Savings',
                value: savings !== null ? `${savings}%` : '-',
                description: 'Size reduction compared to the original input',
                tone: savings !== null && savings > 0 ? 'success' : 'warning',
                iconName: 'Minimize2',
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
          iconName="Minimize2"
          title="Minify HTML, CSS, or JavaScript from one workspace"
          message="Paste web source, let the tool auto-detect the language, and get a compact production-ready output with byte savings."
        />
      }
      options={
        <>
          <div className="options-label">Language</div>
          <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              ['auto', 'Auto'],
              ['html', 'HTML'],
              ['css', 'CSS'],
              ['javascript', 'JS'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${language === value ? ' active' : ''}`}
                onClick={() => setLanguage(value)}
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
        setLanguage('auto');
      }}
      downloadConfig={{
        filename:
          result.actualLanguage === 'html'
            ? 'minified.html'
            : result.actualLanguage === 'css'
              ? 'styles.min.css'
              : 'script.min.js',
        mimeType: 'text/plain;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
