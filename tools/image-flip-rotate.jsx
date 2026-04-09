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
  fillCanvasBackground,
  getOutputFilename,
  getOutputMime,
  loadImageFromFile,
} from '@/lib/image-tool-utils';
import { MetricGrid } from '@/tools/_shared/text-tool-kit';

const OUTPUT_FORMATS = ['original', 'jpeg', 'png', 'webp'];

function getCanvasSize(width, height, angle) {
  const radians = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: Math.max(1, Math.round(width * cos + height * sin)),
    height: Math.max(1, Math.round(width * sin + height * cos)),
  };
}

export default function ImageFlipRotate() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [options, setOptions] = useState({
    flipH: false,
    flipV: false,
    angle: 0,
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
      const normalizedAngle = ((options.angle % 360) + 360) % 360;
      const canvasSize = getCanvasSize(image.naturalWidth, image.naturalHeight, normalizedAngle);
      const canvas = createCanvas(canvasSize.width, canvasSize.height);
      const context = canvas.getContext('2d');

      if (mime === 'image/jpeg') {
        fillCanvasBackground(context, canvas.width, canvas.height, 'white');
      }

      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((normalizedAngle * Math.PI) / 180);
      context.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
      context.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight
      );

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
              ? { ...item, status: 'error', error: error.message || 'Unable to transform that image.' }
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
      getOutputFilename(entry.file.name, 'flipped-rotated', options.outputFormat, entry.file)
    );
  };

  const handleDownloadAll = () => {
    files.filter((item) => item.status === 'done').forEach(handleDownloadOne);
  };

  const handleClear = () => {
    cleanupImageEntries(files);
    setFiles([]);
  };

  const firstFile = files[0];
  const previewStyle = useMemo(
    () => ({
      transform: `scale(${options.flipH ? -1 : 1}, ${options.flipV ? -1 : 1}) rotate(${options.angle}deg)`,
      transformOrigin: 'center',
      maxWidth: '100%',
      maxHeight: 240,
      objectFit: 'contain',
      borderRadius: 'var(--radius-md)',
    }),
    [options.angle, options.flipH, options.flipV]
  );
  const doneFiles = files.filter((item) => item.status === 'done' && item.result);
  const pendingCount = files.filter((item) => item.status === 'pending' || item.status === 'error').length;
  const totalBefore = doneFiles.reduce((sum, item) => sum + item.originalSize, 0);
  const totalAfter = doneFiles.reduce((sum, item) => sum + item.result.size, 0);

  return (
    <ToolLayout>
      <OutputPanel>
        {firstFile ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Rotation',
                  value: `${options.angle}deg`,
                  description: 'Current composite rotation angle',
                  iconName: 'RotateCw',
                },
                {
                  label: 'Flip',
                  value: `${options.flipH ? 'H' : '-'} / ${options.flipV ? 'V' : '-'}`,
                  description: 'Horizontal and vertical flip toggles',
                  iconName: 'RefreshCw',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
                marginBottom: 16,
              }}
            >
              <img src={firstFile.thumb} alt={firstFile.file.name} style={previewStyle} />
            </div>
          </>
        ) : null}

        <ImageBatchOutputPanel
          files={files}
          onFiles={handleFiles}
          onRemove={handleRemove}
          onProcessOne={handleProcessOne}
          onDownloadOne={handleDownloadOne}
          processing={processing}
          acceptedFormats={['JPG', 'PNG', 'WebP', 'AVIF']}
          emptyTitle="Drop images to flip or rotate"
          emptySubtitle="Apply horizontal flips, vertical flips, and any rotation angle to one image or a full batch."
          actionLabel="Apply"
        />
      </OutputPanel>

      <OptionsPanel>
        {doneFiles.length ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>
              {formatBytes(totalBefore)} {'->'} {formatBytes(totalAfter)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {doneFiles.length} transformed file{doneFiles.length === 1 ? '' : 's'}
            </div>
          </div>
        ) : null}

        <div className="options-label">Quick Actions</div>
        <div className="mode-toggle" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" className={`mode-btn${options.flipH ? ' active' : ''}`} onClick={() => setOptions((current) => ({ ...current, flipH: !current.flipH }))}>
            Flip H
          </button>
          <button type="button" className={`mode-btn${options.flipV ? ' active' : ''}`} onClick={() => setOptions((current) => ({ ...current, flipV: !current.flipV }))}>
            Flip V
          </button>
        </div>

        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <button type="button" className="mode-btn" onClick={() => setOptions((current) => ({ ...current, angle: current.angle - 90 }))}>
            -90deg
          </button>
          <button type="button" className="mode-btn" onClick={() => setOptions((current) => ({ ...current, angle: current.angle + 90 }))}>
            +90deg
          </button>
          <button type="button" className="mode-btn" onClick={() => setOptions((current) => ({ ...current, angle: current.angle + 180 }))}>
            180deg
          </button>
        </div>

        <div className="options-label">Custom Angle</div>
        <input
          type="number"
          className="textarea"
          value={options.angle}
          onChange={(event) => setOptions((current) => ({ ...current, angle: Number(event.target.value) || 0 }))}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
        />

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
              {processing ? 'Applying…' : `Apply ${pendingCount > 1 ? `All (${pendingCount})` : 'Transform'}`}
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

        <div className="privacy-note">Preview uses CSS transforms, while export uses canvas rendering for the actual pixels.</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
