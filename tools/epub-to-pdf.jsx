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
  parseEpubDocument,
  renderHtmlDocumentToPdf,
} from '@/lib/document-conversion-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

export default function EpubToPdf() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [previewHtml, setPreviewHtml] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
    fontSize: '12',
    margin: 'normal',
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;
    if (!/\.epub$/i.test(nextFile.name)) {
      setError('Please upload an .epub file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parseEpubDocument(nextFile);
      setFile(nextFile);
      setMetadata(parsed.metadata);
      setChapterCount(parsed.chapterCount);
      setPreviewHtml(parsed.html);
    } catch (loadError) {
      setFile(null);
      setMetadata(null);
      setChapterCount(0);
      setPreviewHtml('');
      setError(loadError.message || 'Unable to open that EPUB file.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!previewHtml || !file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const wrappedHtml = `<div style="font-size: ${Number.parseInt(options.fontSize, 10) || 12}px;">${previewHtml}</div>`;
      const blob = await renderHtmlDocumentToPdf(wrappedHtml, {
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
      setError(generateError.message || 'Unable to convert that EPUB file to PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setMetadata(null);
    setChapterCount(0);
    setPreviewHtml('');
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
        {!file ? (
          <DropZone
            accept=".epub,application/epub+zip"
            onFiles={handleFiles}
            title="Drop an EPUB to convert it into a readable PDF"
            subtitle="Chapter content is extracted in the browser and rendered into a print-friendly PDF layout."
            icon={<Icon icon={ICON_MAP.Bookmark} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Book',
                  value: metadata?.title || file.name,
                  description: `${formatBytes(file.size)} source EPUB`,
                  iconName: 'Bookmark',
                },
                {
                  label: 'Chapters',
                  value: String(chapterCount),
                  description: metadata?.creator || 'Author unavailable',
                  iconName: 'Layers',
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
                iconName="Bookmark"
                title="Book preview will appear here"
                message="EPUB conversion is best-effort. Most reflowable books work well, while highly stylized layouts may simplify during the PDF rendering step."
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

        <div className="options-label">Base Font Size</div>
        <select
          className="input"
          value={options.fontSize}
          onChange={(event) => setOptions((current) => ({ ...current, fontSize: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="11">11 px</option>
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
          Complex EPUB themes, custom fonts, and interactive content may not render exactly the same in PDF. This exporter focuses on readable chapter flow rather than pixel-perfect recreation.
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
          onClick={() => result && downloadBlob(result.blob, file.name.replace(/\.epub$/i, '.pdf'))}
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
