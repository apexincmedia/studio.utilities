'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { canvasToBlob, createCanvas, fillCanvasBackground, loadImageFromFile } from '@/lib/image-tool-utils';

function applySharpen(imageData, mode) {
  if (mode === 'none') {
    return imageData;
  }

  const source = imageData.data;
  const clone = new Uint8ClampedArray(source);
  const output = new Uint8ClampedArray(source.length);
  const { width, height } = imageData;
  const blend = mode === 'strong' ? 0.8 : 0.45;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const center = clone[index + channel] * 5;
        const top = clone[index - width * 4 + channel];
        const bottom = clone[index + width * 4 + channel];
        const left = clone[index - 4 + channel];
        const right = clone[index + 4 + channel];
        const sharpened = center - top - bottom - left - right;
        output[index + channel] = Math.max(
          0,
          Math.min(255, clone[index + channel] * (1 - blend) + sharpened * blend)
        );
      }

      output[index + 3] = clone[index + 3];
    }
  }

  for (let index = 0; index < source.length; index += 4) {
    if (!output[index + 3]) {
      output[index] = clone[index];
      output[index + 1] = clone[index + 1];
      output[index + 2] = clone[index + 2];
      output[index + 3] = clone[index + 3];
    }
  }

  return new ImageData(output, width, height);
}

export default function ImageUpscaler() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    scale: 2,
    sharpen: 'light',
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setError(null);
    setResult(null);

    if (!nextFile.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    try {
      const { image, revoke } = await loadImageFromFile(nextFile);
      revoke();

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setMeta({
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: nextFile.size,
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to load that source image.');
    }
  };

  const handleUpscale = async () => {
    if (!file || !meta) return;

    setProcessing(true);
    setError(null);

    try {
      const { image, revoke } = await loadImageFromFile(file);

      try {
        const width = image.naturalWidth * options.scale;
        const height = image.naturalHeight * options.scale;
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';

        if (mime === 'image/jpeg') {
          fillCanvasBackground(context, width, height, 'white');
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);

        if (options.sharpen !== 'none') {
          const imageData = context.getImageData(0, 0, width, height);
          context.putImageData(applySharpen(imageData, options.sharpen), 0, 0);
        }

        const blob = await canvasToBlob(canvas, mime, mime === 'image/jpeg' ? 0.92 : undefined);
        if (result?.url) URL.revokeObjectURL(result.url);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          size: blob.size,
          width,
          height,
          mime,
        });
      } finally {
        revoke();
      }
    } catch (upscaleError) {
      setResult(null);
      setError(upscaleError.message || 'Unable to upscale that image.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl('');
    setMeta(null);
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({ scale: 2, sharpen: 'light' });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop an image to enhance"
            subtitle="Upscale by 2x or 4x with high-quality smoothing and an optional sharpening pass."
            icon={<Icon icon={ICON_MAP.ZoomIn} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: `${meta.width}x${meta.height}`,
                  description: `${formatBytes(meta.size)} original`,
                  iconName: 'Image',
                },
                {
                  label: 'Enhanced',
                  value: result ? `${result.width}x${result.height}` : `${options.scale}x`,
                  description: result ? `${formatBytes(result.size)} output` : `${options.sharpen} sharpening`,
                  tone: result ? 'success' : 'default',
                  iconName: 'ZoomIn',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: result ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
                gap: 16,
              }}
            >
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Source</div>
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                />
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
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Enhanced Output</div>
                  <img
                    src={result.url}
                    alt="Enhanced preview"
                    style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Scale</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          {[2, 4].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.scale === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, scale: value }));
                setResult(null);
              }}
              disabled={!file}
            >
              {value}x
            </button>
          ))}
        </div>

        <div className="options-label">Sharpening</div>
        <div className="mode-toggle" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ['none', 'None'],
            ['light', 'Light'],
            ['strong', 'Strong'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.sharpen === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, sharpen: value }));
                setResult(null);
              }}
              disabled={!file}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          This is an enhanced canvas upscaler with sharpening, not a neural-network model. It keeps processing fully local and instant.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleUpscale}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Enhancing...' : 'Enhance Image'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() =>
            downloadBlob(
              result.blob,
              `${file.name.replace(/\.[^/.]+$/, '')}-enhanced.${result.mime === 'image/jpeg' ? 'jpg' : 'png'}`
            )
          }
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !error}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
