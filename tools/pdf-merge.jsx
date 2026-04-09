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

function createEntry(file, pageCount) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    pageCount,
  };
}

function reorderEntries(entries, sourceId, targetId) {
  const sourceIndex = entries.findIndex((item) => item.id === sourceId);
  const targetIndex = entries.findIndex((item) => item.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return entries;
  }

  const next = [...entries];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export default function PdfMerge() {
  const [entries, setEntries] = useState([]);
  const [draggedId, setDraggedId] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (files) => {
    const pdfFiles = files.filter(isPdfFile);
    if (!pdfFiles.length) {
      setError('Please upload one or more PDF files.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const nextEntries = await Promise.all(
        pdfFiles.map(async (file) => createEntry(file, await getPdfPageCount(file)))
      );

      setResult((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url);
        }
        return null;
      });
      setEntries((current) => [...current, ...nextEntries]);
    } catch (loadError) {
      setError(loadError.message || 'Unable to inspect one of the selected PDFs.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = (id) => {
    setEntries((current) => current.filter((item) => item.id !== id));
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const handleMerge = async () => {
    if (!entries.length) return;

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
      const mergedDoc = await PDFDocument.create();

      for (const entry of entries) {
        const bytes = await entry.file.arrayBuffer();
        const sourceDoc = await PDFDocument.load(bytes);
        const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      setResult({
        blob,
        size: blob.size,
        url: URL.createObjectURL(blob),
      });
    } catch (mergeError) {
      setError(mergeError.message || 'Unable to merge those PDF files.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setEntries([]);
    setDraggedId('');
    setProcessing(false);
    setError(null);
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const totalPages = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.pageCount, 0),
    [entries]
  );
  const totalInputSize = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.file.size, 0),
    [entries]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        {!entries.length ? (
          <DropZone
            accept="application/pdf,.pdf"
            multiple
            onFiles={handleFiles}
            title="Drop PDFs to merge"
            subtitle="Upload multiple PDFs, drag them into the right order, and export one combined document."
            icon={<Icon icon={ICON_MAP.FilePlus} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Files',
                  value: String(entries.length),
                  description: `${formatBytes(totalInputSize)} total input size`,
                  iconName: 'FileText',
                },
                {
                  label: 'Pages',
                  value: String(totalPages),
                  description: 'Merged in the order shown below',
                  iconName: 'Layers',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? 'Merged PDF is ready to download' : 'Run merge to generate one file',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div style={{ display: 'grid', gap: 12, marginBottom: result ? 16 : 0 }}>
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  draggable={!processing}
                  onDragStart={() => setDraggedId(entry.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => setEntries((current) => reorderEntries(current, draggedId, entry.id))}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--muted)',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 4,
                      }}
                    >
                      {entry.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {entry.pageCount} pages · {formatBytes(entry.file.size)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '8px 12px' }}
                    onClick={() => handleRemove(entry.id)}
                    disabled={processing}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {result ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Merged PDF Ready
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {entries.length} files merged into one document · {formatBytes(result.size)}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => downloadBlob(result.blob, `${getPdfBaseName(entries[0]?.file.name || 'merged')}-merged.pdf`)}
                >
                  <Icon icon={ICON_MAP.Download} size={14} />
                  Download Merged PDF
                </button>
              </div>
            ) : (
              <EmptyState
                iconName="FilePlus"
                title="Arrange the merge order"
                message="Drag files up or down to change the merge order, then generate one combined PDF with every page preserved."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Merge order follows the list exactly. Drag any card onto another to reorder the combined output before you export it.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleMerge}
          disabled={!entries.length || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Archive} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Merging...' : 'Merge PDFs'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!entries.length && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
