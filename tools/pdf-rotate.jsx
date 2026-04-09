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
import { getPdfBaseName, getPdfPageCount, isPdfFile, loadPdfLib, parsePageSelection } from '@/lib/pdf-tool-utils';

const ROTATIONS = [
  ['90', '90° CW'],
  ['180', '180°'],
  ['270', '90° CCW'],
];

export default function PdfRotate() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    rotation: '90',
    target: 'all',
    range: '1-2',
  });

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

  const handleRotate = async () => {
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
      const { PDFDocument, degrees } = await loadPdfLib();
      const sourceBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(sourceBytes);
      const delta = Number.parseInt(options.rotation, 10) || 90;
      const indices = options.target === 'all'
        ? Array.from({ length: pdfDoc.getPageCount() }, (_, index) => index)
        : parsePageSelection(options.range, pdfDoc.getPageCount());

      indices.forEach((index) => {
        const page = pdfDoc.getPage(index);
        const currentAngle = page.getRotation().angle || 0;
        page.setRotation(degrees((currentAngle + delta) % 360));
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({
        blob,
        size: blob.size,
        url: URL.createObjectURL(blob),
        rotatedPages: indices.length,
      });
    } catch (rotateError) {
      setError(rotateError.message || 'Unable to rotate that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setProcessing(false);
    setError(null);
    setOptions({
      rotation: '90',
      target: 'all',
      range: '1-2',
    });
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const targetSummary = useMemo(() => {
    if (!pageCount) return 'All pages';
    if (options.target === 'all') return `All ${pageCount} pages`;

    try {
      return `${parsePageSelection(options.range, pageCount).length} selected pages`;
    } catch {
      return 'Invalid range';
    }
  }, [options.range, options.target, pageCount]);

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to rotate pages"
            subtitle="Rotate every page in a document or target only specific ranges, then download the updated PDF."
            icon={<Icon icon={ICON_MAP.RotateCw} size={30} />}
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
                  label: 'Rotation',
                  value: ROTATIONS.find(([value]) => value === options.rotation)?.[1] || '90° CW',
                  description: targetSummary,
                  iconName: 'RotateCw',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? `${result.rotatedPages} pages rotated` : 'Apply rotation to generate a new PDF',
                  tone: result ? 'success' : 'default',
                  iconName: 'FilePlus',
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
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Rotated PDF Ready
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {result.rotatedPages} pages updated · {formatBytes(result.size)}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => downloadBlob(result.blob, `${getPdfBaseName(file.name)}-rotated.pdf`)}
                >
                  <Icon icon={ICON_MAP.Download} size={14} />
                  Download Rotated PDF
                </button>
              </div>
            ) : (
              <EmptyState
                iconName="RotateCw"
                title="Choose the rotation target"
                message="Rotate the entire document or switch to range mode to update only a subset of pages such as `1-2,5,8-10`."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Rotation</div>
        <select
          className="input"
          value={options.rotation}
          onChange={(event) => setOptions((current) => ({ ...current, rotation: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          {ROTATIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="options-label">Target</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: options.target === 'range' ? 12 : 16 }}>
          <button
            type="button"
            className={`mode-btn${options.target === 'all' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, target: 'all' }))}
          >
            All Pages
          </button>
          <button
            type="button"
            className={`mode-btn${options.target === 'range' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, target: 'range' }))}
          >
            Page Range
          </button>
        </div>

        {options.target === 'range' ? (
          <input
            type="text"
            className="textarea"
            value={options.range}
            onChange={(event) => setOptions((current) => ({ ...current, range: event.target.value }))}
            placeholder="1-2,5,8-10"
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          />
        ) : null}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Rotation is applied relative to the page’s current angle, so a 90° rotation turns already-rotated pages another quarter turn.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleRotate}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.RotateCw} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Applying...' : 'Rotate PDF'}
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
