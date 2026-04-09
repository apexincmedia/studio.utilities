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
      <div style={{ fontSize: 13 }}>Converting HTML…</div>
    </div>
  );
}

export default function HtmlToMarkdown() {
  const [input, setInput] = useState('');
  const [headingStyle, setHeadingStyle] = useState('atx');
  const [bulletListMarker, setBulletListMarker] = useState('-');
  const [codeBlockStyle, setCodeBlockStyle] = useState('fenced');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ markdown: '', error: null });
  const debouncedInput = useDebounce(input, 150);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedInput.trim()) {
        setResult({ markdown: '', error: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const turndownModule = await import('turndown');
        const TurndownService = turndownModule.default;
        const service = new TurndownService({
          headingStyle,
          bulletListMarker,
          codeBlockStyle,
        });
        const markdown = service.turndown(debouncedInput);

        if (!cancelled) {
          setResult({ markdown, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ markdown: '', error: error.message || 'Could not convert HTML.' });
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
  }, [bulletListMarker, codeBlockStyle, debouncedInput, headingStyle]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="HTML Input"
      inputPlaceholder="<article><h1>Apex Studio</h1><p>Utility suite</p></article>"
      inputStats={
        input ? (
          <TextStatLine items={[`${input.length} characters`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel="Markdown Output"
      error={result.error}
      output={result.markdown}
      outputLabel="Converted Markdown"
      outputPlaceholder="Markdown output will appear here..."
      outputStats={
        result.markdown ? (
          <TextStatLine items={[`${result.markdown.split('\n').length} lines`, `${getByteSize(result.markdown)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={
        loading ? (
          <LoadingState />
        ) : undefined
      }
      extraActions={
        result.markdown ? (
          <MetricGrid
            items={[
              {
                label: 'Heading Style',
                value: headingStyle.toUpperCase(),
                description: 'Heading conversion strategy',
              },
              {
                label: 'Bullet Style',
                value: bulletListMarker,
                description: 'List marker used for unordered lists',
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
          title="Convert markup into clean Markdown"
          message="Paste HTML to turn headings, lists, links, and code blocks into tidy Markdown that is easy to edit or export."
        />
      }
      options={
        <>
          <div className="options-label">Heading Style</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            {[
              ['atx', 'ATX'],
              ['setext', 'Setext'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${headingStyle === value ? ' active' : ''}`}
                onClick={() => setHeadingStyle(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="options-label">Bullet Marker</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            {['-', '*', '+'].map((value) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${bulletListMarker === value ? ' active' : ''}`}
                onClick={() => setBulletListMarker(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="options-label">Code Style</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            {[
              ['fenced', 'Fenced'],
              ['indented', 'Indented'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`mode-btn${codeBlockStyle === value ? ' active' : ''}`}
                onClick={() => setCodeBlockStyle(value)}
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
        setHeadingStyle('atx');
        setBulletListMarker('-');
        setCodeBlockStyle('fenced');
      }}
      downloadConfig={{
        filename: 'converted.md',
        mimeType: 'text/markdown;charset=utf-8',
        text: result.markdown,
        enabled: Boolean(result.markdown),
      }}
    />
  );
}
