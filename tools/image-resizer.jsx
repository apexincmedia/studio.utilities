'use client';

import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { ImageBatchOutputPanel, cleanupImageEntries } from '@/tools/_shared/image-batch-tool';
import {
  canvasToBlob,
  createCanvas,
  createImageEntries,
  drawContain,
  drawCover,
  fillCanvasBackground,
  getOutputFilename,
  getOutputMime,
  loadImageFromFile,
} from '@/lib/image-tool-utils';
import { MetricGrid } from '@/tools/_shared/text-tool-kit';

const OUTPUT_FORMATS = ['original', 'jpeg', 'png', 'webp'];

function getTargetDimensions(originalWidth, originalHeight, options) {
  const widthValue = Number.parseInt(options.width, 10);
  const heightValue = Number.parseInt(options.height, 10);
  const hasWidth = Number.isFinite(widthValue) && widthValue > 0;
  const hasHeight = Number.isFinite(heightValue) && heightValue > 0;
  const scale = Math.max(1, Number(options.scalePercent) || 100) / 100;
  const aspectRatio = originalWidth / originalHeight;

  if (hasWidth && hasHeight) {
    if (options.fitMode === 'exact' || !options.lockRatio) {
      return { width: widthValue, height: heightValue, boxWidth: widthValue, boxHeight: heightValue };
    }

    return {
      width: widthValue,
      height: heightValue,
      boxWidth: widthValue,
      boxHeight: heightValue,
    };
  }

  if (hasWidth) {
    return {
      width: widthValue,
      height: options.lockRatio ? Math.round(widthValue / aspectRatio) : originalHeight,
      boxWidth: widthValue,
      boxHeight: options.lockRatio ? Math.round(widthValue / aspectRatio) : originalHeight,
    };
  }

  if (hasHeight) {
    return {
      width: options.lockRatio ? Math.round(heightValue * aspectRatio) : originalWidth,
      height: heightValue,
      boxWidth: options.lockRatio ? Math.round(heightValue * aspectRatio) : originalWidth,
      boxHeight: heightValue,
    };
  }

  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
    boxWidth: Math.max(1, Math.round(originalWidth * scale)),
    boxHeight: Math.max(1, Math.round(originalHeight * scale)),
  };
}

export default function ImageResizer() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [options, setOptions] = useState({
    width: '',
    height: '',
    scalePercent: 100,
    lockRatio: true,
    fitMode: 'exact',
    outputFormat: 'original',
    quality: 0.9,
  });

  const handleFiles = useCallback(async (newFiles) => {
    const entries = await createImageEntries(newFiles);
    setFiles((current) => [...current, ...entries]);
  }, []);

  const handleRemove = (id) => {
    setFiles((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry) cleanupImageEntries([entry]);
      return current.filter((item) => item.id !== id);
    });
  };

  const processEntry = async (entry) => {
    const { image, revoke } = await loadImageFromFile(entry.file);

    try {
      const mime = getOutputMime(entry.file, options.outputFormat);
      const target = getTargetDimensions(image.naturalWidth, image.naturalHeight, options);
      const canvas = createCanvas(target.boxWidth, target.boxHeight);
      const context = canvas.getContext('2d');

      if (mime === 'image/jpeg') {
        fillCanvasBackground(context, canvas.width, canvas.height, 'white');
      }

      if (options.fitMode === 'contain' && target.boxWidth && target.boxHeight) {
        drawContain(context, image, target.boxWidth, target.boxHeight);
      } else if (options.fitMode === 'cover' && target.boxWidth && target.boxHeight) {
        drawCover(context, image, target.boxWidth, target.boxHeight);
      } else {
        context.drawImage(image, 0, 0, target.width, target.height);
      }

      const blob = await canvasToBlob(canvas, mime, options.quality);
      return {
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        mime,
        width: canvas.width,
        height: canvas.height,
      };
    } finally {
      revoke();
    }
  };

  const runProcess = async (entries) => {
    for (const entry of entries) {
      setFiles((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: 'processing', error: null } : item
        )
      );

      try {
        const result = await processEntry(entry);
        setFiles((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: 'done', result } : item
          )
        );
      } catch (error) {
        setFiles((current) =>
          current.map((item) =>
            item.id === entry.id
              ? { ...item, status: 'error', error: error.message || 'Unable to resize that image.' }
              : item
          )
        );
      }
    }
  };

  const handleProcessOne = async (id) => {
    const entry = files.find((item) => item.id === id);
    if (!entry) return;
    setProcessing(true);
    await runProcess([entry]);
    setProcessing(false);
  };

  const handleProcessAll = async () => {
    const pending = files.filter((item) => item.status === 'pending' || item.status === 'error');
    if (!pending.length) return;
    setProcessing(true);
    await runProcess(pending);
    setProcessing(false);
  };

  const handleDownloadOne = (entry) => {
    if (!entry.result) return;
    downloadBlob(
      entry.result.blob,
      getOutputFilename(entry.file.name, 'resized', options.outputFormat, entry.file)
    );
  };

  const handleDownloadAll = () => {
    files.filter((item) => item.status === 'done').forEach(handleDownloadOne);
  };

  const handleClear = () => {
    cleanupImageEntries(files);
    setFiles([]);
  };

  const doneFiles = files.filter((item) => item.status === 'done' && item.result);
  const pendingCount = files.filter((item) => item.status === 'pending' || item.status === 'error').length;
  const totalBefore = doneFiles.reduce((sum, item) => sum + item.originalSize, 0);
  const totalAfter = doneFiles.reduce((sum, item) => sum + item.result.size, 0);
  const firstFile = files[0];
  const previewDimensions = firstFile?.dimensions
    ? getTargetDimensions(firstFile.dimensions.width, firstFile.dimensions.height, options)
    : null;

  return (
    <ToolLayout>
      <OutputPanel>
        {files.length && previewDimensions ? (
          <MetricGrid
            items={[
              {
                label: 'Original',
                value: `${firstFile.dimensions.width}x${firstFile.dimensions.height}`,
                description: 'First image in the batch',
                iconName: 'Image',
              },
              {
                label: 'Target',
                value: `${previewDimensions.boxWidth}x${previewDimensions.boxHeight}`,
                description: `${options.fitMode} fit mode`,
                iconName: 'Maximize2',
              },
              {
                label: 'Output',
                value: options.outputFormat === 'original' ? 'Original' : options.outputFormat.toUpperCase(),
                description: 'Current export format',
                iconName: 'FileImage',
              },
            ]}
            columns="repeat(3, minmax(0, 1fr))"
            marginBottom={16}
          />
        ) : null}

        <ImageBatchOutputPanel
          files={files}
          onFiles={handleFiles}
          onRemove={handleRemove}
          onProcessOne={handleProcessOne}
          onDownloadOne={handleDownloadOne}
          processing={processing}
          acceptedFormats={['JPG', 'PNG', 'WebP', 'AVIF']}
          emptyTitle="Drop images to resize"
          emptySubtitle="Resize images in batch with fixed dimensions, fit modes, and local browser export."
          actionLabel="Resize"
        />
      </OutputPanel>

      <OptionsPanel>
        {doneFiles.length ? (
          <div
            style={{
              background: totalAfter <= totalBefore ? 'var(--success-bg)' : 'var(--surface)',
              border: `1px solid ${totalAfter <= totalBefore ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 18, color: totalAfter <= totalBefore ? 'var(--success)' : 'var(--text)', marginBottom: 4 }}>
              {formatBytes(totalBefore)} {'->'} {formatBytes(totalAfter)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {doneFiles.length} resized file{doneFiles.length === 1 ? '' : 's'}
            </div>
          </div>
        ) : null}

        <div className="options-label">Width / Height</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            className="textarea"
            value={options.width}
            onChange={(event) => setOptions((current) => ({ ...current, width: event.target.value }))}
            placeholder="Width"
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
          <input
            type="number"
            className="textarea"
            value={options.height}
            onChange={(event) => setOptions((current) => ({ ...current, height: event.target.value }))}
            placeholder="Height"
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </div>

        <label className="checkbox-row" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={options.lockRatio}
            onChange={(event) => setOptions((current) => ({ ...current, lockRatio: event.target.checked }))}
          />
          <span className="checkbox-label">Lock aspect ratio when one side is empty</span>
        </label>

        <div className="options-label">Scale</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={options.scalePercent}
            onChange={(event) => setOptions((current) => ({ ...current, scalePercent: Number(event.target.value) }))}
          />
          <span className="range-value">{options.scalePercent}%</span>
        </div>

        <div className="options-label">Fit Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            ['exact', 'Exact'],
            ['contain', 'Contain'],
            ['cover', 'Cover'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.fitMode === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, fitMode: value }))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="options-label">Output Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {OUTPUT_FORMATS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.outputFormat === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, outputFormat: value }))}
            >
              {value === 'original' ? 'Original' : value.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="options-label">Quality</div>
        <div className="range-wrap" style={{ marginBottom: 20 }}>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={options.quality}
            onChange={(event) => setOptions((current) => ({ ...current, quality: Number(event.target.value) }))}
            disabled={!['jpeg', 'webp'].includes(options.outputFormat)}
          />
          <span className="range-value">{Math.round(options.quality * 100)}%</span>
        </div>

        {files.length ? (
          <>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
              onClick={handleProcessAll}
              disabled={!pendingCount || processing}
            >
              <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
              {processing ? 'Resizing…' : `Resize ${pendingCount > 1 ? `All (${pendingCount})` : 'Image'}`}
            </button>

            {doneFiles.length > 1 ? (
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
                onClick={handleDownloadAll}
              >
                <Icon icon={ICON_MAP.Download} size={14} />
                Download All
              </button>
            ) : null}

            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={handleClear}
            >
              <Icon icon={ICON_MAP.Trash2} size={14} />
              Clear All
            </button>
          </>
        ) : null}

        <div className="privacy-note">Resizing happens entirely in-browser with canvas rendering.</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
