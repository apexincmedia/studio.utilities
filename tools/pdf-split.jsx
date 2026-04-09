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
import {
  cleanupResultUrls,
  createZipBlob,
  getPdfBaseName,
  getPdfPageCount,
  isPdfFile,
  loadPdfLib,
  parseSplitGroups,
} from '@/lib/pdf-tool-utils';

function getOutputName(baseName, label, multiPage) {
  return `${baseName}-${multiPage ? `pages-${label}` : `page-${label}`}.pdf`;
}

export default function PdfSplit() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    mode: 'pages',
    ranges: '1-3,5,7-9',
  });

  const resetOutputs = () => {
    setOutputs((current) => {
      cleanupResultUrls(current);
      return [];
    });
  };

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    resetOutputs();
    setProcessing(true);
    setError(null);

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

  const handleSplit = async () => {
    if (!file) return;

    resetOutputs();
    setProcessing(true);
    setError(null);

    try {
      const { PDFDocument } = await loadPdfLib();
      const sourceBytes = await file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(sourceBytes);
      const baseName = getPdfBaseName(file.name);
      const groups = options.mode === 'pages'
        ? Array.from({ length: sourceDoc.getPageCount() }, (_, index) => ({
            label: String(index + 1),
            indices: [index],
          }))
        : parseSplitGroups(options.ranges, sourceDoc.getPageCount());

      const nextOutputs = [];
      for (const group of groups) {
        const splitDoc = await PDFDocument.create();
        const copiedPages = await splitDoc.copyPages(sourceDoc, group.indices);
        copiedPages.forEach((page) => splitDoc.addPage(page));
        const bytes = await splitDoc.save({ useObjectStreams: true });
        const blob = new Blob([bytes], { type: 'application/pdf' });

        nextOutputs.push({
          label: group.label,
          name: getOutputName(baseName, group.label, group.indices.length > 1),
          blob,
          size: blob.size,
          url: URL.createObjectURL(blob),
          pageTotal: group.indices.length,
        });
      }

      setOutputs(nextOutputs);
    } catch (splitError) {
      setError(splitError.message || 'Unable to split that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!outputs.length || !file) return;

    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].name);
      return;
    }

    const zipBlob = await createZipBlob(outputs.map((output) => ({ name: output.name, blob: output.blob })));
    downloadBlob(zipBlob, `${getPdfBaseName(file.name)}-split.zip`);
  };

  const handleClear = () => {
    resetOutputs();
    setFile(null);
    setPageCount(0);
    setProcessing(false);
    setError(null);
    setOptions({
      mode: 'pages',
      ranges: '1-3,5,7-9',
    });
  };

  const outputCount = outputs.length;
  const totalOutputSize = useMemo(
    () => outputs.reduce((sum, output) => sum + output.size, 0),
    [outputs]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to split"
            subtitle="Split every page into its own PDF or break the document into custom page ranges."
            icon={<Icon icon={ICON_MAP.Scissors} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Mode',
                  value: options.mode === 'pages' ? 'Every Page' : 'Custom',
                  description: options.mode === 'pages' ? 'One PDF per page' : options.ranges,
                  iconName: 'Scissors',
                },
                {
                  label: 'Outputs',
                  value: outputCount ? String(outputCount) : 'Pending',
                  description: outputCount ? `${formatBytes(totalOutputSize)} total output` : 'Split results appear here',
                  tone: outputCount ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {outputs.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {outputs.map((output) => (
                  <div
                    key={output.name}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface)',
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
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
                        {output.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {output.pageTotal} {output.pageTotal === 1 ? 'page' : 'pages'} · {formatBytes(output.size)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '8px 12px' }}
                      onClick={() => downloadBlob(output.blob, output.name)}
                    >
                      <Icon icon={ICON_MAP.Download} size={14} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                iconName="Scissors"
                title="Choose how to split the document"
                message="You can split every page into its own file or enter specific page ranges like `1-3,5,7-9`."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Mode</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`mode-btn${options.mode === 'pages' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, mode: 'pages' }))}
          >
            Every Page
          </button>
          <button
            type="button"
            className={`mode-btn${options.mode === 'ranges' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, mode: 'ranges' }))}
          >
            Custom Ranges
          </button>
        </div>

        {options.mode === 'ranges' ? (
          <>
            <div className="options-label">Ranges</div>
            <input
              type="text"
              className="textarea"
              value={options.ranges}
              onChange={(event) => setOptions((current) => ({ ...current, ranges: event.target.value }))}
              placeholder="1-3,5,7-9"
              style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
            />
          </>
        ) : null}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Range input is 1-based in the UI. Each comma-separated range becomes its own output PDF.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleSplit}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Scissors} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Splitting...' : 'Split PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleDownloadAll}
          disabled={!outputs.length}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download All
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !outputs.length}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
