'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid, TextStatLine, ToolSectionDivider } from '@/tools/_shared/text-tool-kit';
import { buildTextPdfBlob } from '@/lib/document-pdf-utils';

export default function TxtToPdf() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    fontSize: '12',
    pageSize: 'a4',
    lineHeight: '1.5',
  });

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = await buildTextPdfBlob(input, {
        pageSize: options.pageSize,
        fontSize: Number.parseInt(options.fontSize, 10) || 12,
        lineHeight: Number.parseFloat(options.lineHeight) || 1.5,
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the PDF from that text input.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      fontSize: '12',
      pageSize: 'a4',
      lineHeight: '1.5',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {input.trim() ? (
          <MetricGrid
            items={[
              {
                label: 'Text',
                value: `${input.split(/\r?\n/).length} lines`,
                description: `${input.length} characters`,
                iconName: 'Type',
              },
              {
                label: 'Layout',
                value: `${options.fontSize}px`,
                description: `${options.lineHeight} line height on ${options.pageSize.toUpperCase()}`,
                iconName: 'FileText',
              },
              {
                label: 'Output',
                value: result ? formatBytes(result.size) : 'Pending',
                description: result ? 'PDF is ready to download' : 'Generate to export a PDF',
                tone: result ? 'success' : 'default',
                iconName: 'Archive',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />
        ) : null}

        <div className="panel-label">Plain Text Input</div>
        <textarea
          className="textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste or type plain text here..."
          style={{ minHeight: 220, marginBottom: 8 }}
        />

        <TextStatLine items={input ? [`${input.length} characters`, `${input.split(/\r?\n/).length} lines`] : []} />

        <ToolSectionDivider label="PDF Preview Mode" />
        <ErrorCallout message={error} />

        {!input.trim() ? (
          <EmptyState
            iconName="Type"
            title="Turn plain text into a clean PDF document"
            message="Paste plain text, choose the page size and typography, then export a lightweight PDF with automatic page breaks."
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              padding: 18,
              minHeight: 260,
            }}
          >
            <pre
              style={{
                margin: 0,
                color: 'var(--text)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {input}
            </pre>
          </div>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Font Size</div>
        <select
          className="input"
          value={options.fontSize}
          onChange={(event) => setOptions((current) => ({ ...current, fontSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="10">10 px</option>
          <option value="12">12 px</option>
          <option value="14">14 px</option>
          <option value="16">16 px</option>
          <option value="18">18 px</option>
        </select>

        <div className="options-label">Page Size</div>
        <select
          className="input"
          value={options.pageSize}
          onChange={(event) => setOptions((current) => ({ ...current, pageSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>

        <div className="options-label">Line Height</div>
        <select
          className="input"
          value={options.lineHeight}
          onChange={(event) => setOptions((current) => ({ ...current, lineHeight: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="1.2">1.2</option>
          <option value="1.5">1.5</option>
          <option value="2">2.0</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Long paragraphs are wrapped automatically to fit the page width, and new PDF pages are inserted whenever the text reaches the bottom margin.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!input.trim() || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, 'text.pdf')}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download PDF
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!input && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
