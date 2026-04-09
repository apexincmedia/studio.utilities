'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/tool-utils';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import {
  EmptyState,
  MetricGrid,
  TextStatLine,
  ToolSectionDivider,
  TextTransformTool,
} from '@/tools/_shared/text-tool-kit';
import { getByteSize } from '@/lib/developer-tool-utils';

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
      <div style={{ fontSize: 13 }}>Rendering Markdown…</div>
    </div>
  );
}

export default function MarkdownToHtml() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('side-by-side');
  const [gfm, setGfm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ html: '', error: null });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ html: '', error: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const markedModule = await import('marked');
        const html = await markedModule.marked.parse(debouncedInput, {
          gfm,
          breaks: gfm,
        });

        if (!cancelled) {
          setResult({ html, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ html: '', error: error.message || 'Could not render Markdown.' });
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
  }, [debouncedInput, gfm]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="Markdown Input"
      inputPlaceholder="# Apex Studio Utilities&#10;&#10;- Fast&#10;- Local&#10;- Production-ready"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="HTML Result"
      error={result.error}
      output={result.html}
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : !input.trim() ? (
          <EmptyState
            iconName="FileCode"
            title="Render Markdown and inspect the generated HTML"
            message="Paste Markdown to preview the rendered result, inspect the raw HTML, or keep both views open side by side."
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Mode',
                  value: mode === 'side-by-side' ? 'Split View' : mode === 'preview' ? 'Preview' : 'HTML',
                  description: 'Current output presentation',
                  iconName: 'Layers',
                },
                {
                  label: 'Output Size',
                  value: `${getByteSize(result.html)} bytes`,
                  description: 'Rendered HTML payload size',
                  iconName: 'FileCode',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            {mode !== 'html' ? (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  color: 'var(--text)',
                  lineHeight: 1.8,
                  marginBottom: mode === 'side-by-side' ? 16 : 0,
                }}
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            ) : null}

            {mode === 'side-by-side' ? <ToolSectionDivider label="Raw HTML" /> : null}

            {mode !== 'preview' ? (
              <>
                <div className="panel-label">Generated HTML</div>
                <textarea
                  className="textarea"
                  value={result.html}
                  readOnly
                  style={{ minHeight: 220 }}
                />
              </>
            ) : null}
          </>
        )
      }
      showEmptyState={false}
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['preview', 'Preview'],
              ['html', 'HTML'],
              ['side-by-side', 'Both'],
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
              checked={gfm}
              onChange={(event) => setGfm(event.target.checked)}
            />
            <span className="checkbox-label">Use GitHub Flavored Markdown rules</span>
          </label>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('side-by-side');
        setGfm(true);
      }}
      copyValue={result.html}
      downloadConfig={{
        filename: 'markdown-output.html',
        mimeType: 'text/html;charset=utf-8',
        text: result.html,
        enabled: Boolean(result.html),
      }}
    />
  );
}
