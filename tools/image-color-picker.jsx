'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { copyToClipboard, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { getColorFormats } from '@/lib/color-utils';
import { loadImageFromFile } from '@/lib/image-tool-utils';

const COPY_OPTIONS = [
  ['hex', 'HEX'],
  ['rgb', 'RGB'],
  ['hsl', 'HSL'],
];

function getPaletteFromCanvas(context, width, height, limit = 8) {
  const imageData = context.getImageData(0, 0, width, height).data;
  const bucketCounts = new Map();
  const stride = Math.max(1, Math.round(Math.sqrt((width * height) / 18000)));

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const index = (y * width + x) * 4;
      const alpha = imageData[index + 3];
      if (alpha < 180) continue;

      const r = Math.round(imageData[index] / 24) * 24;
      const g = Math.round(imageData[index + 1] / 24) * 24;
      const b = Math.round(imageData[index + 2] / 24) * 24;
      const key = `${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)}`;
      bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1);
    }
  }

  const sorted = [...bucketCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => {
      const [r, g, b] = key.split(',').map((value) => Number.parseInt(value, 10));
      return { r, g, b, formats: getColorFormats({ r, g, b }) };
    });

  const unique = [];
  for (const color of sorted) {
    const isDistinct = unique.every((item) => {
      const distance = Math.hypot(item.r - color.r, item.g - color.g, item.b - color.b);
      return distance > 42;
    });

    if (isDistinct) {
      unique.push(color);
    }

    if (unique.length === limit) {
      break;
    }
  }

  return unique;
}

function FormatCard({ label, value, copied, onCopy }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {label}
        </div>
        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ padding: '6px 10px' }}
          onClick={onCopy}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 13,
          color: 'var(--text)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ImageColorPicker() {
  const canvasRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [selection, setSelection] = useState(null);
  const [palette, setPalette] = useState([]);
  const [showPalette, setShowPalette] = useState(true);
  const [copyFormat, setCopyFormat] = useState('hex');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    if (!copiedKey) return undefined;
    const timer = setTimeout(() => setCopiedKey(''), 1200);
    return () => clearTimeout(timer);
  }, [copiedKey]);

  useEffect(() => {
    if (!file || !canvasRef.current) return undefined;

    let active = true;
    let revoke = null;

    async function drawImage() {
      setLoading(true);
      setError(null);

      try {
        const asset = await loadImageFromFile(file);
        revoke = asset.revoke;
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = asset.image.naturalWidth;
        canvas.height = asset.image.naturalHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(asset.image, 0, 0);

        setDimensions({ width: canvas.width, height: canvas.height });
        setPalette(showPalette ? getPaletteFromCanvas(context, canvas.width, canvas.height, 8) : []);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load that image for color sampling.');
          setPalette([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    drawImage();

    return () => {
      active = false;
      if (revoke) {
        revoke();
      }
    };
  }, [file, showPalette]);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!nextFile.type.startsWith('image/')) {
      setError('Please upload an image file to sample colors.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setDimensions(null);
    setSelection(null);
    setPalette([]);
    setError(null);
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * scaleX)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * scaleY)));
    const data = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    const formats = getColorFormats({ r: data[0], g: data[1], b: data[2] });

    setSelection({
      x,
      y,
      alpha: Number((data[3] / 255).toFixed(2)),
      formats,
    });
  };

  const copyValue = selection ? selection.formats[copyFormat] : '';
  const markerStyle = selection && dimensions && Number.isFinite(selection.x) && Number.isFinite(selection.y)
    ? {
        left: `${(selection.x / dimensions.width) * 100}%`,
        top: `${(selection.y / dimensions.height) * 100}%`,
      }
    : null;

  const selectionSummary = useMemo(() => {
    if (!selection) return '';

    return [
      selection.formats.hex,
      selection.formats.rgb,
      selection.formats.hsl,
      selection.formats.cmyk,
      selection.x !== null && selection.y !== null ? `Pixel: ${selection.x}, ${selection.y}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }, [selection]);

  async function handleFormatCopy(key, value) {
    const didCopy = await copyToClipboard(value);
    if (didCopy) {
      setCopiedKey(key);
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl('');
    setDimensions(null);
    setSelection(null);
    setPalette([]);
    setShowPalette(true);
    setCopyFormat('hex');
    setLoading(false);
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop an image to pick colors"
            subtitle="Click any pixel to capture HEX, RGB, HSL, and CMYK values, then extract a quick palette from the same image."
            icon={<Icon icon={ICON_MAP.Eye} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Image',
                  value: dimensions ? `${dimensions.width}x${dimensions.height}` : 'Loading...',
                  description: file.name,
                  iconName: 'Image',
                },
                {
                  label: 'Selection',
                  value: selection ? selection.formats.hex : 'None',
                  description: selection ? `${selection.formats.rgb} · alpha ${selection.alpha}` : 'Click the preview to sample a pixel',
                  tone: selection ? 'success' : 'default',
                  iconName: 'Eye',
                },
                {
                  label: 'Palette',
                  value: showPalette ? String(palette.length) : 'Off',
                  description: showPalette ? 'Automatic palette extraction' : 'Palette disabled',
                  iconName: 'Layers',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface)',
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div className="panel-label" style={{ marginBottom: 10 }}>
                Click the image to sample a color
              </div>

              {loading ? (
                <div
                  style={{
                    minHeight: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    color: 'var(--muted)',
                  }}
                >
                  <Icon icon={ICON_MAP.Loader2} size={18} className="spin" />
                  Sampling image data...
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      width: '100%',
                      maxHeight: 500,
                      display: 'block',
                      objectFit: 'contain',
                      cursor: 'crosshair',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                    }}
                  />

                  {markerStyle ? (
                    <div
                      style={{
                        position: 'absolute',
                        ...markerStyle,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid var(--text)',
                        background: selection.formats.hex,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 3px var(--surface)',
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>

            {selection ? (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px minmax(0, 1fr)',
                    gap: 16,
                    marginBottom: 16,
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
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Sampled Color</div>
                    <div
                      style={{
                        height: 164,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        background: selection.formats.hex,
                        marginBottom: 12,
                      }}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text)' }}>{selection.formats.hex}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {Number.isFinite(selection.x) && Number.isFinite(selection.y)
                        ? `Pixel ${selection.x}, ${selection.y}`
                        : 'Palette swatch'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <FormatCard
                      label="HEX"
                      value={selection.formats.hex}
                      copied={copiedKey === 'hex'}
                      onCopy={() => handleFormatCopy('hex', selection.formats.hex)}
                    />
                    <FormatCard
                      label="RGB"
                      value={selection.formats.rgb}
                      copied={copiedKey === 'rgb'}
                      onCopy={() => handleFormatCopy('rgb', selection.formats.rgb)}
                    />
                    <FormatCard
                      label="HSL"
                      value={selection.formats.hsl}
                      copied={copiedKey === 'hsl'}
                      onCopy={() => handleFormatCopy('hsl', selection.formats.hsl)}
                    />
                    <FormatCard
                      label="CMYK"
                      value={selection.formats.cmyk}
                      copied={copiedKey === 'cmyk'}
                      onCopy={() => handleFormatCopy('cmyk', selection.formats.cmyk)}
                    />
                  </div>
                </div>

                {showPalette ? (
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface)',
                      padding: 16,
                    }}
                  >
                    <div className="panel-label" style={{ marginBottom: 12 }}>
                      Extracted Palette
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {palette.map((color) => (
                        <button
                          key={color.formats.hex}
                          type="button"
                          onClick={() => setSelection({ x: null, y: null, alpha: 1, formats: color.formats })}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-elevated)',
                            padding: 10,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              height: 56,
                              borderRadius: 'var(--radius-md)',
                              background: color.formats.hex,
                              marginBottom: 8,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text)',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            }}
                          >
                            {color.formats.hex}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                iconName="Eye"
                title="Pick the first pixel"
                message="Click anywhere on the preview to sample a pixel, inspect all color formats, and copy the one you need."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Copy Format</div>
        <select
          className="input"
          value={copyFormat}
          onChange={(event) => setCopyFormat(event.target.value)}
          style={{ marginBottom: 16 }}
        >
          {COPY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="checkbox-row" style={{ marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={showPalette}
            onChange={(event) => setShowPalette(event.target.checked)}
            disabled={!file}
          />
          <span className="checkbox-label">Show palette extraction</span>
        </label>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Color sampling runs against a canvas copy of your image, so nothing leaves your browser while you pick pixels or build the palette.
        </div>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(copyValue)}
          disabled={!copyValue}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : `Copy ${copyFormat.toUpperCase()}`}
        </button>

        <button
          type="button"
          className={`copy-btn${copiedKey === 'report' ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => handleFormatCopy('report', selectionSummary)}
          disabled={!selectionSummary}
        >
          <Icon icon={copiedKey === 'report' ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copiedKey === 'report' ? 'Copied' : 'Copy All Formats'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
