'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { getPdfBaseName, getPdfPageCount, isPdfFile, loadPdfLib } from '@/lib/pdf-tool-utils';

const LEVELS = [
  ['light', 'Light', 'Re-save the original PDF with minimal changes.'],
  ['standard', 'Standard', 'Enable object stream compression for a smaller client-side save.'],
  ['aggressive', 'Aggressive', 'Rebuild the document by copying pages into a fresh PDF container.'],
];

export default function PdfCompress() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState('standard');

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });

    try {
      const count = await getPdfPageCount(nextFile);
      setFile(nextFile);
      setPageCount(count);
    } catch (loadError) {
      setFile(null);
      setPageCount(0);
      setError(loadError.message || 'Unable to inspect that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });

    try {
      const { PDFDocument } = await loadPdfLib();
      const sourceBytes = await file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(sourceBytes);

      let bytes;
      if (level === 'aggressive') {
        const rebuiltDoc = await PDFDocument.create();
        const copiedPages = await rebuiltDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
        copiedPages.forEach((page) => rebuiltDoc.addPage(page));
        bytes = await rebuiltDoc.save({ useObjectStreams: true });
      } else {
        bytes = await sourceDoc.save({ useObjectStreams: level !== 'light' });
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({
        blob,
        size: blob.size,
        url: URL.createObjectURL(blob),
      });
    } catch (compressError) {
      setError(compressError.message || 'Unable to compress that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setProcessing(false);
    setError(null);
    setLevel('standard');
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const savings = useMemo(() => {
    if (!file || !result?.size || result.size >= file.size) return 0;
    return Math.round(((file.size - result.size) / file.size) * 100);
  }, [file, result]);

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to compress"
            subtitle="Re-save or rebuild a PDF entirely in the browser for best-effort client-side size reduction."
            icon={<Icon icon={ICON_MAP.Archive} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount),
                  description: `${formatBytes(file.size)} original size`,
                  iconName: 'FileText',
                },
                {
                  label: 'Level',
                  value: level.charAt(0).toUpperCase() + level.slice(1),
                  description: 'Client-side best-effort compression',
                  iconName: 'Archive',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? `${savings > 0 ? `${savings}% smaller` : 'Size stayed close to the original'}` : 'Compress to compare before and after',
                  tone: result ? 'success' : 'default',
                  iconName: 'TrendingUp',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {result ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 12 }}>
                  Compression Result
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Before</span>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{formatBytes(file.size)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>After</span>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{formatBytes(result.size)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Savings</span>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{savings > 0 ? `${savings}%` : 'No meaningful reduction'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => downloadBlob(result.blob, `${getPdfBaseName(file.name)}-compressed.pdf`)}
                >
                  <Icon icon={ICON_MAP.Download} size={14} />
                  Download Compressed PDF
                </button>
              </div>
            ) : (
              <EmptyState
                iconName="Archive"
                title="Run a best-effort client-side compression pass"
                message="PDF compression in the browser is limited, so this tool focuses on cleaner container structures and object streams rather than destructive rasterization."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Compression Level</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {LEVELS.map(([value, label, description]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${level === value ? ' active' : ''}`}
              onClick={() => setLevel(value)}
              disabled={processing}
              title={description}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          This is a best-effort client-side compressor. Existing embedded images are preserved, so the biggest wins usually come from rebuilding or object-stream compression.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleCompress}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Archive} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Compressing...' : 'Compress PDF'}
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
