'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import {
  parseRtfDocument,
  renderHtmlDocumentToPdf,
} from '@/lib/document-conversion-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function RtfToPdf() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
    margin: 'normal',
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;
    if (!/\.rtf$/i.test(nextFile.name)) {
      setError('Please upload an .rtf file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parseRtfDocument(nextFile);
      setFile(nextFile);
      setMetadata(parsed.metadata);
      setPreviewHtml(parsed.html);
    } catch (loadError) {
      setFile(null);
      setMetadata(null);
      setPreviewHtml('');
      setError(loadError.message || 'Unable to parse that RTF document.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file || !previewHtml) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = await renderHtmlDocumentToPdf(previewHtml, {
        pageSize: options.pageSize,
        orientation: 'portrait',
        margin: options.margin,
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to convert that RTF document to PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setMetadata(null);
    setPreviewHtml('');
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      pageSize: 'a4',
      margin: 'normal',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept=".rtf,application/rtf,text/rtf"
            onFiles={handleFiles}
            title="Drop an RTF file to convert it into PDF"
            subtitle="This browser workflow renders rich text, basic formatting, and supported embedded images before exporting to PDF."
            icon={<Icon icon={ICON_MAP.FileText} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Document',
                  value: file.name,
                  description: `${formatBytes(file.size)} source RTF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Metadata',
                  value: metadata?.title || 'Rendered',
                  description: metadata?.author || 'Basic rich text + image support',
                  iconName: 'Bookmark',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? 'PDF is ready to download' : 'Generate to export',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {previewHtml ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 20,
                  maxHeight: 560,
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <EmptyState
                iconName="FileText"
                title="RTF preview will appear here"
                message="RTF is a broad format, so this browser renderer focuses on readable text, bold/italic emphasis, and supported embedded WMF/EMF graphics."
              />
            )}
          </>
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
          RTF documents vary widely. This converter is best-effort and focuses on readable output for text-heavy files rather than perfect recreation of every legacy layout feature.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!previewHtml || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, file.name.replace(/\.rtf$/i, '.pdf'))}
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
          disabled={!file && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
