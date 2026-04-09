'use client';

import { useState } from 'react';
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
  renderPdfToImages,
} from '@/lib/pdf-tool-utils';

const DPI_OPTIONS = [
  ['72', '72 DPI'],
  ['150', '150 DPI'],
  ['300', '300 DPI'],
];

export default function PdfRasterTool({ mode = 'png', title, subtitle }) {
  const isJpg = mode === 'jpg';
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    dpi: '150',
    quality: '88',
  });

  const resetPages = () => {
    setPages((current) => {
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

    resetPages();
    setError(null);
    setProcessing(true);
    setProgress({ current: 0, total: 0 });

    try {
      const count = await getPdfPageCount(nextFile);
      setFile(nextFile);
      setPageCount(count);
    } catch (loadError) {
      setFile(null);
      setPageCount(0);
      setError(loadError.message || 'Unable to read that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRender = async () => {
    if (!file) return;

    resetPages();
    setProcessing(true);
    setError(null);

    try {
      const rendered = await renderPdfToImages(file, {
        dpi: Number.parseInt(options.dpi, 10) || 150,
        format: mode,
        quality: Math.max(0.1, Math.min(1, (Number.parseInt(options.quality, 10) || 88) / 100)),
        onProgress: ({ pageNumber, totalPages }) => {
          setProgress({ current: pageNumber, total: totalPages });
        },
      });

      setPageCount(rendered.pageCount);
      setPages(rendered.pages);
      setProgress({ current: rendered.pageCount, total: rendered.pageCount });
    } catch (renderError) {
      setError(renderError.message || 'Unable to render that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!pages.length || !file) return;

    if (pages.length === 1) {
      downloadBlob(pages[0].blob, `${getPdfBaseName(file.name)}-page-1.${mode}`);
      return;
    }

    const zipBlob = await createZipBlob(
      pages.map((page) => ({
        name: `${getPdfBaseName(file.name)}-page-${page.pageNumber}.${mode}`,
        blob: page.blob,
      }))
    );

    downloadBlob(zipBlob, `${getPdfBaseName(file.name)}-${mode}-pages.zip`);
  };

  const handleClear = () => {
    resetPages();
    setFile(null);
    setPageCount(0);
    setProcessing(false);
    setProgress({ current: 0, total: 0 });
    setError(null);
    setOptions({
      dpi: '150',
      quality: '88',
    });
  };

  const totalOutputSize = pages.reduce((sum, page) => sum + page.size, 0);

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title={title}
            subtitle={subtitle}
            icon={<Icon icon={ICON_MAP.FileText} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount || 0),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Output',
                  value: pages.length ? `${pages.length} images` : mode.toUpperCase(),
                  description: pages.length ? `${formatBytes(totalOutputSize)} total output` : 'Ready to render',
                  tone: pages.length ? 'success' : 'default',
                  iconName: 'FileImage',
                },
                {
                  label: 'Resolution',
                  value: `${options.dpi} DPI`,
                  description: isJpg ? `JPEG quality ${options.quality}%` : 'Lossless PNG export',
                  iconName: 'Maximize2',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {processing ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 18,
                  marginBottom: pages.length ? 16 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon icon={ICON_MAP.Loader2} size={18} className="spin" />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    Rendering page {Math.max(1, progress.current)} of {Math.max(1, progress.total || pageCount)}...
                  </div>
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-elevated)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                      height: '100%',
                      background: 'var(--success)',
                    }}
                  />
                </div>
              </div>
            ) : null}

            {pages.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {pages.map((page) => (
                  <div
                    key={page.pageNumber}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        overflow: 'hidden',
                        minHeight: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={page.url}
                        alt={`Page ${page.pageNumber}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                        Page {page.pageNumber}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {page.width} x {page.height} · {formatBytes(page.size)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => downloadBlob(page.blob, `${getPdfBaseName(file.name)}-page-${page.pageNumber}.${mode}`)}
                    >
                      <Icon icon={ICON_MAP.Download} size={14} />
                      Download Page
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                iconName="FileImage"
                title={`Render each PDF page as ${mode.toUpperCase()}`}
                message="Choose the output resolution, then render the uploaded PDF into downloadable page images with individual previews."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Resolution</div>
        <select
          className="input"
          value={options.dpi}
          onChange={(event) => setOptions((current) => ({ ...current, dpi: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          {DPI_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {isJpg ? (
          <>
            <div className="options-label">JPEG Quality</div>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={options.quality}
              onChange={(event) => setOptions((current) => ({ ...current, quality: event.target.value }))}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              {options.quality}% quality
            </div>
          </>
        ) : null}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Rendering uses `pdf.js` locally in the browser. Multi-page exports can be downloaded as a ZIP after the previews finish rendering.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleRender}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Rendering...' : `Render ${mode.toUpperCase()} Pages`}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleDownloadAll}
          disabled={!pages.length}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download All
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !pages.length}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
