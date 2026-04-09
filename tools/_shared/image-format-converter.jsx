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
  createCanvas,
  createImageEntries,
  fillCanvasBackground,
  getOutputFilename,
  getOutputMime,
  loadImageFromFile,
  canvasToBlob,
  supportsCanvasMime,
} from '@/lib/image-tool-utils';

export default function ImageFormatConverter({
  toolKey,
  title,
  description,
  defaultTarget = 'png',
  allowedTargets = ['jpeg', 'png', 'webp'],
  acceptedFormats = ['JPG', 'PNG', 'WebP', 'AVIF'],
}) {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState(defaultTarget);
  const [quality, setQuality] = useState(0.9);
  const [globalError, setGlobalError] = useState(null);

  const handleFiles = useCallback(async (newFiles) => {
    if (!newFiles.length) return;
    const entries = await createImageEntries(newFiles);
    setFiles((current) => [...current, ...entries]);
  }, []);

  const handleRemove = (id) => {
    setFiles((current) => {
      const next = current.filter((entry) => entry.id !== id);
      const removed = current.find((entry) => entry.id === id);
      if (removed) {
        cleanupImageEntries([removed]);
      }
      return next;
    });
  };

  const processEntry = async (entry) => {
    const { image, revoke } = await loadImageFromFile(entry.file);

    try {
      const mime = getOutputMime(entry.file, targetFormat);

      if (mime === 'image/avif' && !supportsCanvasMime(mime)) {
        throw new Error('AVIF export is not supported in this browser.');
      }

      const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
      const context = canvas.getContext('2d');

      if (mime === 'image/jpeg') {
        fillCanvasBackground(context, canvas.width, canvas.height, 'white');
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToBlob(canvas, mime, quality);
      const url = URL.createObjectURL(blob);

      return {
        blob,
        url,
        size: blob.size,
        mime,
        width: canvas.width,
        height: canvas.height,
        extension: targetFormat,
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
              ? {
                  ...item,
                  status: 'error',
                  error: error.message || 'Conversion failed.',
                }
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
    setGlobalError(null);
    await runProcess([entry]);
    setProcessing(false);
  };

  const handleProcessAll = async () => {
    const pending = files.filter((entry) => entry.status === 'pending' || entry.status === 'error');
    if (!pending.length) return;
    setProcessing(true);
    setGlobalError(null);
    await runProcess(pending);
    setProcessing(false);
  };

  const handleDownloadOne = (entry) => {
    if (!entry.result) return;
    downloadBlob(
      entry.result.blob,
      getOutputFilename(entry.file.name, toolKey, targetFormat, entry.file)
    );
  };

  const handleDownloadAll = () => {
    files.filter((entry) => entry.status === 'done' && entry.result).forEach(handleDownloadOne);
  };

  const handleClear = () => {
    cleanupImageEntries(files);
    setFiles([]);
    setGlobalError(null);
  };

  const pendingCount = files.filter((entry) => entry.status === 'pending' || entry.status === 'error').length;
  const doneFiles = files.filter((entry) => entry.status === 'done' && entry.result);
  const totalBefore = doneFiles.reduce((sum, entry) => sum + entry.originalSize, 0);
  const totalAfter = doneFiles.reduce((sum, entry) => sum + (entry.result?.size ?? 0), 0);
  const totalSaved = Math.max(0, totalBefore - totalAfter);

  const targetLabel = useMemo(
    () => allowedTargets.find((value) => value === targetFormat) ?? defaultTarget,
    [allowedTargets, defaultTarget, targetFormat]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        <ImageBatchOutputPanel
          files={files}
          onFiles={handleFiles}
          onRemove={handleRemove}
          onProcessOne={handleProcessOne}
          onDownloadOne={handleDownloadOne}
          processing={processing}
          acceptedFormats={acceptedFormats}
          emptyTitle={title}
          emptySubtitle={description}
          actionLabel="Convert"
        />
      </OutputPanel>

      <OptionsPanel>
        {totalSaved > 0 ? (
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 18, color: 'var(--success)', marginBottom: 4 }}>
              Saved {formatBytes(totalSaved)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {formatBytes(totalBefore)} {'->'} {formatBytes(totalAfter)}
            </div>
          </div>
        ) : null}

        {globalError ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--error-bg)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 16,
              color: 'var(--error)',
              fontSize: 12,
            }}
          >
            <Icon icon={ICON_MAP.AlertCircle} size={14} />
            {globalError}
          </div>
        ) : null}

        <div className="options-label">Target Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {allowedTargets.map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${targetFormat === value ? ' active' : ''}`}
              onClick={() => setTargetFormat(value)}
            >
              {value.toUpperCase()}
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
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            disabled={!['jpeg', 'webp', 'avif'].includes(targetFormat)}
          />
          <span className="range-value">{Math.round(quality * 100)}%</span>
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
              {processing ? 'Converting…' : `Convert ${pendingCount > 1 ? `All (${pendingCount})` : targetLabel.toUpperCase()}`}
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

        <div className="privacy-note">
          All image conversion runs locally in the browser using canvas export.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
