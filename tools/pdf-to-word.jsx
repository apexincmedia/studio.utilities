'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import {
  buildPdfPlainText,
  buildPdfWordBlob,
  extractPdfPages,
} from '@/lib/document-conversion-utils';
import { getPdfBaseName, isPdfFile } from '@/lib/pdf-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function PdfToWord() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    format: 'docx',
  });

  const combinedText = useMemo(() => buildPdfPlainText(pages), [pages]);
  const previewText = useMemo(() => combinedText.slice(0, 3200), [combinedText]);
  const lineCount = useMemo(
    () => combinedText.split(/\r?\n/).filter(Boolean).length,
    [combinedText]
  );

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const extracted = await extractPdfPages(nextFile);
      setFile(nextFile);
      setPages(extracted.pages);
    } catch (loadError) {
      setFile(null);
      setPages([]);
      setError(loadError.message || 'Unable to extract text from that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    if (!combinedText.trim()) {
      setError('No selectable text was found in that PDF. Scanned pages need OCR before export.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const blob = options.format === 'txt'
        ? new Blob([combinedText], { type: 'text/plain;charset=utf-8' })
        : await buildPdfWordBlob(pages);

      setResult({
        blob,
        size: blob.size,
        extension: options.format === 'txt' ? 'txt' : 'docx',
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the Word export from that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPages([]);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({ format: 'docx' });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to extract editable text"
            subtitle="Choose plain TXT or a basic DOCX export. Complex layouts and formatting may simplify during extraction."
            icon={<Icon icon={ICON_MAP.FileText} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pages.length),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Extracted Text',
                  value: `${combinedText.length} chars`,
                  description: `${lineCount} lines preserved with page breaks`,
                  iconName: 'Type',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? `${result.extension.toUpperCase()} file ready` : 'Generate to export',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {previewText ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 18,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Extracted Preview
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {previewText}
                </pre>
              </div>
            ) : (
              <EmptyState
                iconName="FileText"
                title="No selectable text detected yet"
                message="This PDF may be image-based. OCR is not part of this converter, so the export only works on machine-readable text."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output Format</div>
        <select
          className="input"
          value={options.format}
          onChange={(event) => setOptions({ format: event.target.value })}
          style={{ marginBottom: 16 }}
        >
          <option value="docx">Basic DOCX</option>
          <option value="txt">Plain TXT</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          This is a best-effort text extraction workflow. Paragraph order and line breaks are preserved when possible, but advanced layouts, images, and tables are not reconstructed like a desktop PDF editor.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : `Generate ${options.format.toUpperCase()}`}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, `${getPdfBaseName(file?.name)}.${result.extension}`)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Export
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
