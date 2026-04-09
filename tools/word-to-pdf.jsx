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
  parseWordDocument,
  renderHtmlDocumentToPdf,
} from '@/lib/document-conversion-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;
    if (!/\.docx$/i.test(nextFile.name)) {
      setError('Only .docx files are supported for browser conversion.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parseWordDocument(nextFile);
      setFile(nextFile);
      setPreviewHtml(parsed.html);
      setWarnings(parsed.warnings);
    } catch (loadError) {
      setFile(null);
      setPreviewHtml('');
      setWarnings([]);
      setError(loadError.message || 'Unable to read that Word document.');
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
        margin: 'normal',
      });

      setResult({
        blob,
        size: blob.size,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to convert that Word document to PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewHtml('');
    setWarnings([]);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({ pageSize: 'a4' });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onFiles={handleFiles}
            title="Drop a DOCX file to convert it into PDF"
            subtitle="This browser workflow uses Mammoth to convert DOCX to HTML first, then renders the HTML into PDF."
            icon={<Icon icon={ICON_MAP.FileText} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Document',
                  value: file.name,
                  description: `${formatBytes(file.size)} source DOCX`,
                  iconName: 'FileText',
                },
                {
                  label: 'Warnings',
                  value: String(warnings.length),
                  description: warnings.length ? 'Mammoth simplified some content' : 'No conversion warnings',
                  tone: warnings.length ? 'warning' : 'success',
                  iconName: 'AlertTriangle',
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
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <EmptyState
                iconName="FileText"
                title="Load a DOCX file to preview the PDF layout"
                message="Complex styles, comments, SmartArt, and advanced Word features may simplify because Mammoth converts the document into clean HTML before the PDF step."
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
          onChange={(event) => setOptions({ pageSize: event.target.value })}
          style={{ marginBottom: 16 }}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Only modern `.docx` files are supported. Legacy `.doc` files, tracked changes, and some embedded objects require desktop or server-side conversion for high-fidelity output.
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
          onClick={() => result && downloadBlob(result.blob, file.name.replace(/\.docx$/i, '.pdf'))}
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
