'use client';

import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { cleanupImageEntries } from '@/tools/_shared/image-batch-tool';
import { createImageEntries } from '@/lib/image-tool-utils';
import { buildImagePdf } from '@/lib/document-pdf-utils';

export default function ImageToPdf() {
  const [entries, setEntries] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    pageSize: 'a4',
    margin: 'medium',
    orientation: 'auto',
  });

  const handleFiles = useCallback(async (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const nextEntries = await createImageEntries(imageFiles);

    setEntries((current) => [...current, ...nextEntries]);
    setResult(null);
    setError(null);
  }, []);

  const handleRemove = (id) => {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry) {
        cleanupImageEntries([entry]);
      }
      return current.filter((item) => item.id !== id);
    });
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!entries.length) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const generated = await buildImagePdf(
        entries.map((entry) => entry.file),
        options
      );

      setResult({
        blob: generated.blob,
        size: generated.blob.size,
        pageCount: generated.pageCount,
      });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the PDF from those images.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    cleanupImageEntries(entries);
    setEntries([]);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      pageSize: 'a4',
      margin: 'medium',
      orientation: 'auto',
    });
  };

  const totalInputSize = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.file.size, 0),
    [entries]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        {!entries.length ? (
          <DropZone
            accept="image/*"
            multiple
            onFiles={handleFiles}
            title="Drop images to turn them into a PDF"
            subtitle="Add JPG, PNG, or WebP images and export one PDF with one image per page."
            icon={<Icon icon={ICON_MAP.FileImage} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Images',
                  value: String(entries.length),
                  description: `${formatBytes(totalInputSize)} total input`,
                  iconName: 'Image',
                },
                {
                  label: 'Page Setup',
                  value: options.pageSize === 'fit' ? 'Fit to Image' : options.pageSize.toUpperCase(),
                  description: options.orientation === 'auto' ? 'Auto orientation' : options.orientation,
                  iconName: 'FileText',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? `${result.pageCount} PDF pages ready` : 'Generate a PDF to download',
                  tone: result ? 'success' : 'default',
                  iconName: 'Archive',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: result ? 16 : 0,
              }}
            >
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      minHeight: 130,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={entry.thumb}
                      alt={entry.file.name}
                      style={{ width: '100%', height: 130, objectFit: 'contain', display: 'block' }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 12,
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
                      {entry.dimensions ? `${entry.dimensions.width}x${entry.dimensions.height} · ` : ''}
                      {formatBytes(entry.file.size)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
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
                  PDF Ready
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {result.pageCount} image pages packaged into one PDF · {formatBytes(result.size)}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => downloadBlob(result.blob, 'images.pdf')}
                >
                  <Icon icon={ICON_MAP.Download} size={14} />
                  Download PDF
                </button>
              </div>
            ) : (
              <EmptyState
                iconName="FileImage"
                title="Generate one page per image"
                message="Choose the page size, margins, and orientation behavior, then export a PDF that places each uploaded image on its own page."
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
          <option value="fit">Fit to Image</option>
        </select>

        <div className="options-label">Margins</div>
        <select
          className="input"
          value={options.margin}
          onChange={(event) => setOptions((current) => ({ ...current, margin: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
        </select>

        <div className="options-label">Orientation</div>
        <select
          className="input"
          value={options.orientation}
          onChange={(event) => setOptions((current) => ({ ...current, orientation: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <option value="auto">Auto</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Fit-to-image mode creates pages that match the image dimensions, while the fixed paper sizes preserve the image aspect ratio inside the chosen margins.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!entries.length || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.FileText} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate PDF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, 'images.pdf')}
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
          disabled={!entries.length && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
