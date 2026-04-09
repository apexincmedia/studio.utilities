'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes, readAsText } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { canvasToBlob, createCanvas, fillCanvasBackground } from '@/lib/image-tool-utils';

function loadSvgImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render that SVG file.'));
    image.src = url;
  });
}

function getOutputName(name, format) {
  const base = name.replace(/\.[^/.]+$/, '');
  return `${base}-converted.${format === 'jpeg' ? 'jpg' : format}`;
}

export default function SvgToPng() {
  const [fileInfo, setFileInfo] = useState(null);
  const [svgUrl, setSvgUrl] = useState('');
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    width: '',
    scale: 1,
    background: 'transparent',
    customColor: 'rgb(255, 255, 255)',
    format: 'png',
  });

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setResult(null);

    if (
      file.type !== 'image/svg+xml' &&
      !file.name.toLowerCase().endsWith('.svg')
    ) {
      setError('Please upload an SVG file.');
      return;
    }

    try {
      const svgText = await readAsText(file);
      const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
      const image = await loadSvgImage(url);

      if (svgUrl) URL.revokeObjectURL(svgUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
      setSvgUrl(url);
      setSourcePreviewUrl(url);
      setFileInfo({
        name: file.name,
        size: file.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to read that SVG file.');
    }
  };

  const handleConvert = async () => {
    if (!svgUrl || !fileInfo) return;

    setProcessing(true);
    setError(null);

    try {
      const image = await loadSvgImage(svgUrl);
      const requestedWidth = Number.parseInt(options.width, 10);
      const width =
        Number.isFinite(requestedWidth) && requestedWidth > 0
          ? requestedWidth
          : Math.max(1, Math.round(image.naturalWidth * Number(options.scale)));
      const height = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * width));
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');
      const isJpeg = options.format === 'jpeg';

      if (isJpeg || options.background !== 'transparent') {
        fillCanvasBackground(
          context,
          width,
          height,
          options.background === 'custom' ? options.customColor : 'white'
        );
      }

      context.drawImage(image, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, isJpeg ? 'image/jpeg' : 'image/png', 0.92);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        width,
        height,
        format: options.format,
      });
    } catch (convertError) {
      setResult(null);
      setError(convertError.message || 'Unable to convert that SVG.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFileInfo(null);
    setSvgUrl('');
    setSourcePreviewUrl('');
    setResult(null);
    setProcessing(false);
    setError(null);
    setOptions({
      width: '',
      scale: 1,
      background: 'transparent',
      customColor: 'rgb(255, 255, 255)',
      format: 'png',
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!fileInfo ? (
          <DropZone
            accept=".svg,image/svg+xml"
            onFiles={handleFiles}
            title="Drop an SVG to rasterize"
            subtitle="Render an SVG into PNG or JPG at a custom width or scale multiplier."
            icon={<Icon icon={ICON_MAP.FileCode} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: `${fileInfo.width}x${fileInfo.height}`,
                  description: `${formatBytes(fileInfo.size)} SVG`,
                  iconName: 'FileCode',
                },
                {
                  label: 'Output',
                  value: result ? `${result.width}x${result.height}` : options.width || `${Number(options.scale).toFixed(1)}x`,
                  description: result ? `${formatBytes(result.size)} ready` : 'Configured export size',
                  tone: result ? 'success' : 'default',
                  iconName: 'FileImage',
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
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Source SVG</div>
                <img
                  src={sourcePreviewUrl}
                  alt={fileInfo.name}
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
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Raster Output</div>
                  <img
                    src={result.url}
                    alt="Raster preview"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output Width</div>
        <input
          type="number"
          className="textarea"
          value={options.width}
          onChange={(event) => {
            setOptions((current) => ({ ...current, width: event.target.value }));
            setResult(null);
          }}
          placeholder="Auto"
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          disabled={!fileInfo}
        />

        <div className="options-label">Scale</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${Number(options.scale) === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, scale: value }));
                setResult(null);
              }}
              disabled={!fileInfo}
            >
              {value}x
            </button>
          ))}
        </div>

        <div className="options-label">Background</div>
        <div className="mode-toggle" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            ['transparent', 'Transparent'],
            ['white', 'White'],
            ['custom', 'Custom'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.background === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, background: value }));
                setResult(null);
              }}
              disabled={!fileInfo}
            >
              {label}
            </button>
          ))}
        </div>

        {options.background === 'custom' ? (
          <input
            type="text"
            className="textarea"
            value={options.customColor}
            onChange={(event) => {
              setOptions((current) => ({ ...current, customColor: event.target.value }));
              setResult(null);
            }}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
            disabled={!fileInfo}
          />
        ) : null}

        <div className="options-label">Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          {[
            ['png', 'PNG'],
            ['jpeg', 'JPG'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.format === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, format: value }));
                setResult(null);
              }}
              disabled={!fileInfo}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleConvert}
          disabled={!fileInfo || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Converting...' : 'Convert SVG'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadBlob(result.blob, getOutputName(fileInfo.name, result.format))}
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
          disabled={!fileInfo && !error}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note">
          Transparent backgrounds are preserved on PNG output. JPG exports use the selected fill color.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
