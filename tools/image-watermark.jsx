'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getColorFormats, parseColorInput } from '@/lib/color-utils';

const OUTPUT_FORMATS = ['original', 'jpeg', 'png', 'webp'];
const POSITION_OPTIONS = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'];
const DEFAULT_TEXT_COLOR = 'rgb(255, 255, 255)';

function getPickerValue(color) {
  return getColorFormats(parseColorInput(color) ?? parseColorInput(DEFAULT_TEXT_COLOR)).hex;
}

function getAnchorPosition(position, baseWidth, baseHeight, overlayWidth, overlayHeight, padding) {
  const horizontal = position[1];
  const vertical = position[0];

  const x =
    horizontal === 'L'
      ? padding
      : horizontal === 'C'
        ? (baseWidth - overlayWidth) / 2
        : baseWidth - overlayWidth - padding;
  const y =
    vertical === 'T'
      ? padding
      : vertical === 'M'
        ? (baseHeight - overlayHeight) / 2
        : baseHeight - overlayHeight - padding;

  return { x, y };
}

export default function ImageWatermark() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [options, setOptions] = useState({
    mode: 'text',
    text: 'Apex Studio Utilities',
    fontSize: 28,
    color: DEFAULT_TEXT_COLOR,
    opacity: 0.45,
    padding: 24,
    position: 'BR',
    outputFormat: 'original',
    quality: 0.9,
    logoScale: 20,
  });

  useEffect(() => {
    if (!logoFile) {
      setLogoUrl('');
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

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
      const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
      const context = canvas.getContext('2d');

      if (mime === 'image/jpeg') {
        fillCanvasBackground(context, canvas.width, canvas.height, 'white');
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.save();
      context.globalAlpha = options.opacity;

      if (options.mode === 'image' && logoFile) {
        const { image: logoImage, revoke: revokeLogo } = await loadImageFromFile(logoFile);
        try {
          const logoWidth = Math.max(24, Math.round((canvas.width * options.logoScale) / 100));
          const logoHeight = Math.max(24, Math.round((logoImage.naturalHeight / logoImage.naturalWidth) * logoWidth));
          const anchor = getAnchorPosition(options.position, canvas.width, canvas.height, logoWidth, logoHeight, options.padding);
          context.drawImage(logoImage, anchor.x, anchor.y, logoWidth, logoHeight);
        } finally {
          revokeLogo();
        }
      } else {
        context.fillStyle = options.color;
        context.font = `600 ${options.fontSize}px Georgia, serif`;
        context.textBaseline = 'top';
        const metrics = context.measureText(options.text);
        const width = metrics.width;
        const height = options.fontSize * 1.2;
        const anchor = getAnchorPosition(options.position, canvas.width, canvas.height, width, height, options.padding);
        context.fillText(options.text, anchor.x, anchor.y);
      }

      context.restore();

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
              ? { ...item, status: 'error', error: error.message || 'Unable to apply the watermark.' }
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
      getOutputFilename(entry.file.name, 'watermarked', options.outputFormat, entry.file)
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
  const overlayPreview = useMemo(() => {
    if (!firstFile?.dimensions) return null;

    if (options.mode === 'image' && logoUrl) {
      const widthPercent = options.logoScale;
      return {
        type: 'image',
        style: {
          position: 'absolute',
          opacity: options.opacity,
          width: `${widthPercent}%`,
          maxWidth: 140,
        },
      };
    }

    return {
      type: 'text',
      style: {
        position: 'absolute',
        opacity: options.opacity,
        color: options.color,
        fontSize: `${Math.max(14, options.fontSize / 2)}px`,
        fontWeight: 600,
        fontFamily: 'Georgia, serif',
      },
    };
  }, [firstFile?.dimensions, logoUrl, options.color, options.fontSize, options.logoScale, options.mode, options.opacity]);

  const anchorStyle = useMemo(() => {
    const isTop = options.position.startsWith('T');
    const isMiddle = options.position.startsWith('M');
    const isLeft = options.position.endsWith('L');
    const isCenter = options.position.endsWith('C');

    return {
      top: isTop ? options.padding : isMiddle ? '50%' : 'auto',
      bottom: !isTop && !isMiddle ? options.padding : 'auto',
      left: isLeft ? options.padding : isCenter ? '50%' : 'auto',
      right: !isLeft && !isCenter ? options.padding : 'auto',
      transform:
        isMiddle && isCenter
          ? 'translate(-50%, -50%)'
          : isMiddle
            ? 'translateY(-50%)'
            : isCenter
              ? 'translateX(-50%)'
              : 'none',
    };
  }, [options.padding, options.position]);

  const doneFiles = files.filter((item) => item.status === 'done' && item.result);
  const pendingCount = files.filter((item) => item.status === 'pending' || item.status === 'error').length;
  const totalBefore = doneFiles.reduce((sum, item) => sum + item.originalSize, 0);
  const totalAfter = doneFiles.reduce((sum, item) => sum + item.result.size, 0);

  return (
    <ToolLayout>
      <OutputPanel>
        {firstFile && overlayPreview ? (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Mode',
                  value: options.mode === 'text' ? 'Text' : 'Logo',
                  description: 'Current watermark source',
                  iconName: 'Type',
                },
                {
                  label: 'Position',
                  value: options.position,
                  description: `${Math.round(options.opacity * 100)}% opacity`,
                  iconName: 'Layers',
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

            <div
              style={{
                position: 'relative',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <img
                src={firstFile.thumb}
                alt={firstFile.file.name}
                style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />

              <div style={anchorStyle}>
                {overlayPreview.type === 'image' && logoUrl ? (
                  <img src={logoUrl} alt="Watermark preview" style={overlayPreview.style} />
                ) : (
                  <div style={overlayPreview.style}>{options.text}</div>
                )}
              </div>
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
          emptyTitle="Drop images to watermark"
          emptySubtitle="Apply the same text or logo watermark across an image batch with adjustable position and opacity."
          actionLabel="Watermark"
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
              {doneFiles.length} watermarked file{doneFiles.length === 1 ? '' : 's'}
            </div>
          </div>
        ) : null}

        <div className="options-label">Mode</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          <button type="button" className={`mode-btn${options.mode === 'text' ? ' active' : ''}`} onClick={() => setOptions((current) => ({ ...current, mode: 'text' }))}>
            Text
          </button>
          <button type="button" className={`mode-btn${options.mode === 'image' ? ' active' : ''}`} onClick={() => setOptions((current) => ({ ...current, mode: 'image' }))}>
            Image
          </button>
        </div>

        {options.mode === 'text' ? (
          <>
            <div className="options-label">Watermark Text</div>
            <textarea
              className="textarea"
              value={options.text}
              onChange={(event) => setOptions((current) => ({ ...current, text: event.target.value }))}
              style={{ minHeight: 90, marginBottom: 12 }}
            />

            <div className="options-label">Text Color</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="color"
                value={getPickerValue(options.color)}
                onChange={(event) => setOptions((current) => ({ ...current, color: event.target.value }))}
                style={{ width: 56, height: 44, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}
              />
              <input
                type="text"
                className="textarea"
                value={options.color}
                onChange={(event) => setOptions((current) => ({ ...current, color: event.target.value }))}
                style={{ minHeight: 'auto', padding: '12px 14px' }}
              />
            </div>

            <div className="options-label">Font Size</div>
            <div className="range-wrap" style={{ marginBottom: 16 }}>
              <input
                type="range"
                min="14"
                max="96"
                step="2"
                value={options.fontSize}
                onChange={(event) => setOptions((current) => ({ ...current, fontSize: Number(event.target.value) }))}
              />
              <span className="range-value">{options.fontSize}px</span>
            </div>
          </>
        ) : (
          <>
            <div className="options-label">Logo Image</div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
              style={{ width: '100%', marginBottom: 12, color: 'var(--muted)' }}
            />

            <div className="options-label">Logo Scale</div>
            <div className="range-wrap" style={{ marginBottom: 16 }}>
              <input
                type="range"
                min="8"
                max="40"
                step="1"
                value={options.logoScale}
                onChange={(event) => setOptions((current) => ({ ...current, logoScale: Number(event.target.value) }))}
              />
              <span className="range-value">{options.logoScale}%</span>
            </div>
          </>
        )}

        <div className="options-label">Position</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {POSITION_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.position === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, position: value }))}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="options-label">Opacity</div>
        <div className="range-wrap" style={{ marginBottom: 12 }}>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={options.opacity}
            onChange={(event) => setOptions((current) => ({ ...current, opacity: Number(event.target.value) }))}
          />
          <span className="range-value">{Math.round(options.opacity * 100)}%</span>
        </div>

        <div className="options-label">Padding</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input
            type="range"
            min="0"
            max="80"
            step="2"
            value={options.padding}
            onChange={(event) => setOptions((current) => ({ ...current, padding: Number(event.target.value) }))}
          />
          <span className="range-value">{options.padding}px</span>
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
              disabled={!pendingCount || processing || (options.mode === 'image' && !logoFile)}
            >
              <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
              {processing ? 'Applying…' : `Apply ${pendingCount > 1 ? `All (${pendingCount})` : 'Watermark'}`}
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

        <div className="privacy-note">Watermarks are rendered directly onto the exported pixels in your browser.</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
