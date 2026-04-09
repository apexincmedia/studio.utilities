'use client';

import { marked } from 'marked';
import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid, TextStatLine, ToolSectionDivider } from '@/tools/_shared/text-tool-kit';
import { renderHtmlToPdfBlob } from '@/lib/document-pdf-utils';

marked.setOptions({ gfm: true, breaks: true });

export default function MarkdownToPdf() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
    fontSize: '12',
    margin: 'normal',
  });

  const previewHtml = useMemo(
    () => (input.trim() ? marked.parse(input) : ''),
    [input]
  );

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = await renderHtmlToPdfBlob(previewHtml, {
        pageSize: options.pageSize,
        orientation: 'portrait',
        margin: options.margin,
        fontSize: Number.parseInt(options.fontSize, 10) || 12,
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the PDF from that Markdown input.');
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
      fontSize: '12',
      margin: 'normal',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {input.trim() ? (
          <MetricGrid
            items={[
              {
                label: 'Markdown',
                value: `${input.split(/\r?\n/).length} lines`,
                description: `${input.length} characters`,
                iconName: 'FileCode',
              },
              {
                label: 'Paper',
                value: options.pageSize.toUpperCase(),
                description: `${options.fontSize}px base font`,
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

        <div className="panel-label">Markdown Input</div>
        <textarea
          className="textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'# Apex Studio\n\n- Clean exports\n- Polished previews\n- Browser-only PDF generation'}
          style={{ minHeight: 220, marginBottom: 8 }}
        />

        <TextStatLine items={input ? [`${input.length} characters`, `${input.split(/\r?\n/).length} lines`] : []} />

        <ToolSectionDivider label="Rendered Preview" />
        <ErrorCallout message={error} />

        {!input.trim() ? (
          <EmptyState
            iconName="FileCode"
            title="Render Markdown into a downloadable PDF"
            message="Write headings, lists, tables, and code blocks in Markdown, preview the HTML result, then export it as a PDF in your browser."
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              padding: 20,
              minHeight: 260,
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
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
        </select>

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
        </select>

        <div className="options-label">Margins</div>
        <select
          className="input"
          value={options.margin}
          onChange={(event) => setOptions((current) => ({ ...current, margin: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="tight">Tight</option>
          <option value="normal">Normal</option>
          <option value="wide">Wide</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          The preview uses GitHub-flavored Markdown basics. Complex layouts can vary slightly in the exported PDF, which is expected for browser-only rendering.
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
          onClick={() => result && downloadBlob(result.blob, 'markdown.pdf')}
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
