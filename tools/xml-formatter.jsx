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
import {
  extractErrorLocation,
  getByteSize,
} from '@/lib/developer-tool-utils';

function countXmlElements(input = '') {
  return (input.match(/<([A-Za-z_][\w:.-]*)(?=\s|>|\/)/g) ?? []).length;
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
      <div style={{ fontSize: 13 }}>Formatting XML…</div>
    </div>
  );
}

export default function XmlFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('beautify');
  const [indent, setIndent] = useState('2');
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
        const parserModule = await import('fast-xml-parser');
        const validation = parserModule.XMLValidator.validate(debouncedInput);
        if (validation !== true) {
          throw new Error(validation.err?.msg || 'Invalid XML input.');
        }

        const parser = new parserModule.XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          preserveOrder: false,
        });
        const parsed = parser.parse(debouncedInput);

        const builder = new parserModule.XMLBuilder({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          format: mode === 'beautify',
          indentBy: ' '.repeat(Number.parseInt(indent, 10)),
          suppressEmptyNode: false,
        });

        if (!cancelled) {
          setResult({
            output: builder.build(parsed),
            error: null,
          });
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
  }, [debouncedInput, mode, indent]);

  return (
    <TextTransformTool
      input={input}
      onInputChange={setInput}
      inputLabel="XML Input"
      inputPlaceholder="<root><item id='1'>Apex</item></root>"
      inputStats={
        input ? (
          <TextStatLine items={[`${countXmlElements(input)} elements`, `${getByteSize(input)} bytes`]} />
        ) : null
      }
      dividerLabel={mode === 'beautify' ? 'Beautified XML' : 'Minified XML'}
      error={result.error}
      output={result.output}
      outputLabel="Formatted XML"
      outputPlaceholder="Formatted XML will appear here..."
      outputStats={
        result.output ? (
          <TextStatLine items={[`${countXmlElements(result.output)} elements`, `${getByteSize(result.output)} bytes`]} marginBottom={0} />
        ) : null
      }
      outputRenderer={loading ? <LoadingState /> : undefined}
      showEmptyState={!input.trim()}
      emptyState={
        <EmptyState
          iconName="FileCode"
          title="Beautify or minify XML in the browser"
          message="Paste XML to validate it, normalize indentation, or collapse it into a compact single-line payload."
        />
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
          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setInput('');
        setMode('beautify');
        setIndent('2');
      }}
      downloadConfig={{
        filename: 'formatted.xml',
        mimeType: 'application/xml;charset=utf-8',
        text: result.output,
        enabled: Boolean(result.output),
      }}
    />
  );
}
