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
import { blobToDataUrl } from '@/lib/base64-image-utils';
import { canvasToBlob, createCanvas, fillCanvasBackground, loadImageFromFile } from '@/lib/image-tool-utils';

function loadImageFromBlob(blob) {
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to preview the removed-background image.'));
    };
    image.src = url;
  });
}

export default function BackgroundRemover() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('Loading AI model (one-time download)...');
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    output: 'png',
    backgroundColor: 'rgb(255, 255, 255)',
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
      setError(loadError.message || 'Unable to load that image.');
    }
  };

  const handleRemoveBackground = async () => {
    if (!file || !meta) return;

    setProcessing(true);
    setProgress(2);
    setPhaseLabel('Loading AI model (one-time download)...');
    setError(null);

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const removedBlob = await removeBackground(file, {
        progress: (_key, current, total) => {
          if (total > 0) {
            setProgress(Math.min(98, Math.round((current / total) * 100)));
          }
        },
      });

      setPhaseLabel('Compositing final output...');

      let outputBlob = removedBlob;
      let extension = 'png';

      if (options.output !== 'png') {
        const { image, revoke } = await loadImageFromBlob(removedBlob);

        try {
          const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
          const context = canvas.getContext('2d');
          fillCanvasBackground(
            context,
            canvas.width,
            canvas.height,
            options.output === 'jpeg-custom' ? options.backgroundColor : 'white'
          );
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          outputBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
          extension = 'jpg';
        } finally {
          revoke();
        }
      }

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      setResult({
        blob: outputBlob,
        url: URL.createObjectURL(outputBlob),
        size: outputBlob.size,
        extension,
        preview: await blobToDataUrl(outputBlob),
      });
      setProgress(100);
    } catch (removeError) {
      setResult(null);
      setError(removeError.message || 'Unable to remove the image background.');
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
    setProgress(0);
    setPhaseLabel('Loading AI model (one-time download)...');
    setError(null);
    setOptions({
      output: 'png',
      backgroundColor: 'rgb(255, 255, 255)',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop an image to remove its background"
            subtitle="Use the in-browser model to isolate the subject and export a transparent PNG or flattened JPG."
            icon={<Icon icon={ICON_MAP.Wand2} size={30} />}
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
                  label: 'Output',
                  value: options.output === 'png' ? 'PNG' : 'JPG',
                  description: result ? `${formatBytes(result.size)} ready` : 'Configured export type',
                  tone: result ? 'success' : 'default',
                  iconName: 'Wand2',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
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
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon icon={ICON_MAP.Loader2} size={18} className="spin" />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{phaseLabel}</div>
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
                      width: `${progress}%`,
                      height: '100%',
                      background: 'var(--success)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{progress}%</div>
              </div>
            ) : null}

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
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
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
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Result</div>
                  <img
                    src={result.preview}
                    alt="Removed background result"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output</div>
        <div className="mode-toggle" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            ['png', 'PNG'],
            ['jpeg-white', 'JPG White'],
            ['jpeg-custom', 'JPG Custom'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.output === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, output: value }));
                setResult(null);
              }}
              disabled={!file}
            >
              {label}
            </button>
          ))}
        </div>

        {options.output === 'jpeg-custom' ? (
          <>
            <div className="options-label">Background Color</div>
            <input
              type="text"
              className="textarea"
              value={options.backgroundColor}
              onChange={(event) => {
                setOptions((current) => ({ ...current, backgroundColor: event.target.value }));
                setResult(null);
              }}
              style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
              disabled={!file}
            />
          </>
        ) : null}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          The first run downloads the model assets into your browser cache. Later removals should start faster.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleRemoveBackground}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Wand2} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Removing...' : 'Remove Background'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() =>
            downloadBlob(
              result.blob,
              `${file.name.replace(/\.[^/.]+$/, '')}-no-background.${result.extension}`
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
