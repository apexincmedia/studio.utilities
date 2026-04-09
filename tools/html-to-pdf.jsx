'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid, TextStatLine, ToolSectionDivider } from '@/tools/_shared/text-tool-kit';
import { renderHtmlToPdfBlob } from '@/lib/document-pdf-utils';

export default function HtmlToPdf() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
  });

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = await renderHtmlToPdfBlob(input, {
        pageSize: options.pageSize,
        orientation: options.orientation,
        margin: 'normal',
        fontSize: 12,
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the PDF from that HTML input.');
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
      pageSize: 'a4',
      orientation: 'portrait',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {input.trim() ? (
          <MetricGrid
            items={[
              {
                label: 'HTML',
                value: `${input.length} chars`,
                description: 'Rendered in a sandboxed preview frame',
                iconName: 'FileCode',
              },
              {
                label: 'Paper',
                value: options.pageSize.toUpperCase(),
                description: options.orientation,
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

        <div className="panel-label">HTML Input</div>
        <textarea
          className="textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'<article><h1>Apex Studio</h1><p>HTML preview ready for PDF export.</p></article>'}
          style={{ minHeight: 220, marginBottom: 8 }}
        />

        <TextStatLine items={input ? [`${input.length} characters`] : []} />

        <ToolSectionDivider label="Sandboxed Preview" />
        <ErrorCallout message={error} />

        {!input.trim() ? (
          <EmptyState
            iconName="FileCode"
            title="Render raw HTML into a PDF"
            message="Paste HTML, preview it in a sandboxed frame, then capture the rendered layout into a downloadable PDF."
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              minHeight: 320,
              overflow: 'hidden',
            }}
          >
            <iframe
              title="HTML preview"
              srcDoc={input}
              style={{
                width: '100%',
                height: 340,
                border: 'none',
                background: 'white',
              }}
            />
          </div>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Page Size</div>
        <select
          className="input"
          value={options.pageSize}
          onChange={(event) => setOptions((current) => ({ ...current, pageSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="a3">A3</option>
        </select>

        <div className="options-label">Orientation</div>
        <select
          className="input"
          value={options.orientation}
          onChange={(event) => setOptions((current) => ({ ...current, orientation: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          The preview is sandboxed, so app-level CSS does not bleed into the captured HTML. Inline styles and document-level styles are the safest way to control the export.
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
          onClick={() => result && downloadBlob(result.blob, 'html.pdf')}
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
