'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import {
  canvasToBlob,
  createCanvas,
  fillCanvasBackground,
  getOutputFilename,
  getOutputMime,
  loadImageFromFile,
  supportsCanvasMime,
} from '@/lib/image-tool-utils';

const ASPECT_PRESETS = [
  { value: 'free', label: 'Free', ratio: null },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '3:2', label: '3:2', ratio: 3 / 2 },
];

const OUTPUT_FORMATS = ['original', 'jpeg', 'png', 'webp'];
const MIN_CROP_SIZE = 32;
const MAX_STAGE_HEIGHT = 420;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundCrop(crop) {
  return {
    x: Math.round(crop.x),
    y: Math.round(crop.y),
    width: Math.round(crop.width),
    height: Math.round(crop.height),
  };
}

function getPresetRatio(preset) {
  return ASPECT_PRESETS.find((item) => item.value === preset)?.ratio ?? null;
}

function getDisplaySize(width, height, maxWidth) {
  const safeMaxWidth = Math.max(1, Math.round(maxWidth || width));
  const ratio = Math.min(safeMaxWidth / width, MAX_STAGE_HEIGHT / height, 1);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function createCenteredCrop(imageWidth, imageHeight, preset = 'free') {
  const ratio = getPresetRatio(preset);

  if (!ratio) {
    const width = Math.max(MIN_CROP_SIZE, Math.round(imageWidth * 0.78));
    const height = Math.max(MIN_CROP_SIZE, Math.round(imageHeight * 0.78));

    return roundCrop({
      x: Math.round((imageWidth - width) / 2),
      y: Math.round((imageHeight - height) / 2),
      width,
      height,
    });
  }

  const maxWidth = imageWidth * 0.82;
  const maxHeight = imageHeight * 0.82;
  let width = Math.min(maxWidth, maxHeight * ratio);
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  width = clamp(Math.round(width), Math.ceil(MIN_CROP_SIZE * ratio), imageWidth);
  height = clamp(Math.round(height), MIN_CROP_SIZE, imageHeight);

  return roundCrop({
    x: Math.round((imageWidth - width) / 2),
    y: Math.round((imageHeight - height) / 2),
    width,
    height,
  });
}

function resizeFreeCrop(startCrop, dx, dy, handle, imageWidth, imageHeight) {
  const right = startCrop.x + startCrop.width;
  const bottom = startCrop.y + startCrop.height;

  if (handle === 'nw') {
    const x = clamp(startCrop.x + dx, 0, right - MIN_CROP_SIZE);
    const y = clamp(startCrop.y + dy, 0, bottom - MIN_CROP_SIZE);
    return roundCrop({ x, y, width: right - x, height: bottom - y });
  }

  if (handle === 'ne') {
    const width = clamp(startCrop.width + dx, MIN_CROP_SIZE, imageWidth - startCrop.x);
    const y = clamp(startCrop.y + dy, 0, bottom - MIN_CROP_SIZE);
    return roundCrop({ x: startCrop.x, y, width, height: bottom - y });
  }

  if (handle === 'sw') {
    const x = clamp(startCrop.x + dx, 0, right - MIN_CROP_SIZE);
    const height = clamp(startCrop.height + dy, MIN_CROP_SIZE, imageHeight - startCrop.y);
    return roundCrop({ x, y: startCrop.y, width: right - x, height });
  }

  const width = clamp(startCrop.width + dx, MIN_CROP_SIZE, imageWidth - startCrop.x);
  const height = clamp(startCrop.height + dy, MIN_CROP_SIZE, imageHeight - startCrop.y);
  return roundCrop({ x: startCrop.x, y: startCrop.y, width, height });
}

function resizeLockedCrop(startCrop, dx, dy, handle, ratio, imageWidth, imageHeight) {
  const anchorX = handle.includes('w') ? startCrop.x + startCrop.width : startCrop.x;
  const anchorY = handle.includes('n') ? startCrop.y + startCrop.height : startCrop.y;
  const rawWidth = handle.includes('w') ? anchorX - (startCrop.x + dx) : startCrop.width + dx;
  const rawHeight = handle.includes('n') ? anchorY - (startCrop.y + dy) : startCrop.height + dy;
  const widthFromHeight = rawHeight * ratio;
  const preferredWidth =
    Math.abs(dx) >= Math.abs(dy)
      ? rawWidth
      : widthFromHeight;
  const minWidth = Math.max(MIN_CROP_SIZE, Math.ceil(MIN_CROP_SIZE * ratio));
  const maxWidth = handle.includes('w') ? anchorX : imageWidth - anchorX;
  const maxHeight = handle.includes('n') ? anchorY : imageHeight - anchorY;
  const maxAllowedWidth = Math.min(maxWidth, maxHeight * ratio);
  const width = clamp(preferredWidth, minWidth, maxAllowedWidth);
  const height = width / ratio;
  const x = handle.includes('w') ? anchorX - width : anchorX;
  const y = handle.includes('n') ? anchorY - height : anchorY;

  return roundCrop({ x, y, width, height });
}

function moveCrop(startCrop, dx, dy, imageWidth, imageHeight) {
  const x = clamp(startCrop.x + dx, 0, imageWidth - startCrop.width);
  const y = clamp(startCrop.y + dy, 0, imageHeight - startCrop.height);
  return roundCrop({ ...startCrop, x, y });
}

function applyCropSize(currentCrop, imageWidth, imageHeight, ratio, axis, nextValue) {
  if (!Number.isFinite(nextValue) || nextValue <= 0) {
    return currentCrop;
  }

  if (!ratio) {
    if (axis === 'width') {
      const width = clamp(nextValue, MIN_CROP_SIZE, imageWidth);
      const x = clamp(currentCrop.x, 0, imageWidth - width);
      return roundCrop({ ...currentCrop, x, width });
    }

    const height = clamp(nextValue, MIN_CROP_SIZE, imageHeight);
    const y = clamp(currentCrop.y, 0, imageHeight - height);
    return roundCrop({ ...currentCrop, y, height });
  }

  let width = axis === 'width' ? nextValue : nextValue * ratio;
  let height = width / ratio;

  if (height > imageHeight) {
    height = imageHeight;
    width = height * ratio;
  }

  if (width > imageWidth) {
    width = imageWidth;
    height = width / ratio;
  }

  width = clamp(width, Math.ceil(MIN_CROP_SIZE * ratio), imageWidth);
  height = clamp(height, MIN_CROP_SIZE, imageHeight);

  const x = clamp(currentCrop.x, 0, imageWidth - width);
  const y = clamp(currentCrop.y, 0, imageHeight - height);

  return roundCrop({ x, y, width, height });
}

function LoadingState() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'rgba(10, 12, 18, 0.72)',
        backdropFilter: 'blur(4px)',
        color: 'var(--text)',
        zIndex: 4,
      }}
    >
      <Icon icon={ICON_MAP.Loader2} size={26} className="spin" />
      <div style={{ fontSize: 13 }}>Exporting cropped image...</div>
    </div>
  );
}

export default function ImageCropper() {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageMeta, setImageMeta] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState(null);
  const [aspectPreset, setAspectPreset] = useState('free');
  const [outputFormat, setOutputFormat] = useState('original');
  const [quality, setQuality] = useState(0.92);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragState, setDragState] = useState(null);
  const stageContainerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  useEffect(() => {
    if (!imageMeta) {
      setStageSize({ width: 0, height: 0 });
      return;
    }

    const updateStage = () => {
      const maxWidth = stageContainerRef.current?.clientWidth ?? imageMeta.width;
      setStageSize(getDisplaySize(imageMeta.width, imageMeta.height, maxWidth));
    };

    updateStage();
    window.addEventListener('resize', updateStage);
    return () => window.removeEventListener('resize', updateStage);
  }, [imageMeta]);

  useEffect(() => {
    if (!dragState || !imageMeta || !stageSize.width || !stageSize.height) {
      return undefined;
    }

    const scaleX = imageMeta.width / stageSize.width;
    const scaleY = imageMeta.height / stageSize.height;

    const handleMove = (event) => {
      const dx = (event.clientX - dragState.startX) * scaleX;
      const dy = (event.clientY - dragState.startY) * scaleY;
      const ratio = getPresetRatio(aspectPreset);
      const nextCrop =
        dragState.mode === 'move'
          ? moveCrop(dragState.crop, dx, dy, imageMeta.width, imageMeta.height)
          : ratio
            ? resizeLockedCrop(dragState.crop, dx, dy, dragState.mode, ratio, imageMeta.width, imageMeta.height)
            : resizeFreeCrop(dragState.crop, dx, dy, dragState.mode, imageMeta.width, imageMeta.height);

      setCrop(nextCrop);
    };

    const handleUp = () => {
      setDragState(null);
      setResult(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [aspectPreset, dragState, imageMeta, stageSize.height, stageSize.width]);

  const handleFiles = useCallback(
    async (files) => {
      const nextFile = files[0];

      if (!nextFile) {
        return;
      }

      setProcessing(false);
      setError(null);
      setResult(null);

      try {
        const { width, height, revoke } = await loadImageFromFile(nextFile);
        revoke();

        setImageFile(nextFile);
        setImageUrl(URL.createObjectURL(nextFile));
        setImageMeta({
          width,
          height,
          size: nextFile.size,
          type: nextFile.type || 'image/png',
        });
        setCrop(createCenteredCrop(width, height, aspectPreset));
      } catch (loadError) {
        setImageFile(null);
        setImageUrl('');
        setImageMeta(null);
        setCrop(null);
        setError(loadError.message || 'Unable to load that image.');
      }
    },
    [aspectPreset]
  );

  const handleClear = () => {
    setImageFile(null);
    setImageUrl('');
    setImageMeta(null);
    setCrop(null);
    setOutputFormat('original');
    setQuality(0.92);
    setAspectPreset('free');
    setResult(null);
    setError(null);
    setDragState(null);
  };

  const handleAspectChange = (preset) => {
    setAspectPreset(preset);
    setResult(null);

    if (imageMeta) {
      setCrop(createCenteredCrop(imageMeta.width, imageMeta.height, preset));
    }
  };

  const handleCropValueChange = (axis, value) => {
    if (!crop || !imageMeta) {
      return;
    }

    const nextValue = Number.parseInt(value, 10);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }

    setResult(null);
    setCrop((currentCrop) =>
      applyCropSize(
        currentCrop,
        imageMeta.width,
        imageMeta.height,
        getPresetRatio(aspectPreset),
        axis,
        nextValue
      )
    );
  };

  const startDrag = (mode, event) => {
    if (!crop) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setError(null);
    setDragState({
      mode,
      startX: event.clientX,
      startY: event.clientY,
      crop,
    });
  };

  const handleCrop = async () => {
    if (!imageFile || !crop) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const mime = getOutputMime(imageFile, outputFormat);

      if (!supportsCanvasMime(mime)) {
        throw new Error(
          outputFormat === 'original'
            ? 'This browser cannot export the original image format after cropping. Choose PNG, JPG, or WebP instead.'
            : `${outputFormat.toUpperCase()} export is not supported in this browser.`
        );
      }

      const { image, revoke } = await loadImageFromFile(imageFile);

      try {
        const canvas = createCanvas(crop.width, crop.height);
        const context = canvas.getContext('2d');

        if (mime === 'image/jpeg') {
          fillCanvasBackground(context, canvas.width, canvas.height, 'white');
        }

        context.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const blob = await canvasToBlob(canvas, mime, quality);
        setResult({
          blob,
          url: URL.createObjectURL(blob),
          size: blob.size,
          mime,
          width: canvas.width,
          height: canvas.height,
        });
      } finally {
        revoke();
      }
    } catch (cropError) {
      setResult(null);
      setError(cropError.message || 'Unable to crop that image.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !imageFile) {
      return;
    }

    downloadBlob(
      result.blob,
      getOutputFilename(imageFile.name, 'cropped', outputFormat, imageFile)
    );
  };

  const displayCrop = useMemo(() => {
    if (!crop || !imageMeta || !stageSize.width || !stageSize.height) {
      return null;
    }

    return {
      left: (crop.x / imageMeta.width) * stageSize.width,
      top: (crop.y / imageMeta.height) * stageSize.height,
      width: (crop.width / imageMeta.width) * stageSize.width,
      height: (crop.height / imageMeta.height) * stageSize.height,
    };
  }, [crop, imageMeta, stageSize.height, stageSize.width]);

  const resultDelta = result && imageMeta ? result.size - imageMeta.size : null;

  return (
    <ToolLayout>
      <OutputPanel>
        {!imageFile || !imageMeta || !crop ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop an image to crop"
            subtitle="Drag a crop region, lock to common ratios, and export locally in your browser."
            icon={<Icon icon={ICON_MAP.Scissors} size={36} />}
          >
            <div className="drop-zone-formats">
              {['JPG', 'PNG', 'WebP', 'AVIF', 'GIF'].map((format) => (
                <span key={format} className="drop-zone-format-pill">
                  {format}
                </span>
              ))}
            </div>
          </DropZone>
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: `${imageMeta.width}x${imageMeta.height}`,
                  description: `${formatBytes(imageMeta.size)} original`,
                  iconName: 'Image',
                },
                {
                  label: 'Crop',
                  value: `${crop.width}x${crop.height}`,
                  description: `X ${crop.x} · Y ${crop.y}`,
                  iconName: 'Scissors',
                },
                {
                  label: 'Output',
                  value: outputFormat === 'original' ? 'Original' : outputFormat.toUpperCase(),
                  description: result ? `${formatBytes(result.size)} ready` : 'Export format',
                  tone: result ? 'success' : 'default',
                  iconName: 'FileImage',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              ref={stageContainerRef}
              style={{
                position: 'relative',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                minHeight: 300,
                padding: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {processing ? <LoadingState /> : null}

              {stageSize.width && stageSize.height && displayCrop ? (
                <div
                  style={{
                    position: 'relative',
                    width: stageSize.width,
                    height: stageSize.height,
                    cursor: dragState?.mode === 'move' ? 'grabbing' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={imageFile.name}
                    style={{
                      width: stageSize.width,
                      height: stageSize.height,
                      objectFit: 'contain',
                      display: 'block',
                      borderRadius: 'var(--radius-md)',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: displayCrop.top,
                        background: 'rgba(8, 10, 16, 0.58)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: displayCrop.top,
                        width: displayCrop.left,
                        height: displayCrop.height,
                        background: 'rgba(8, 10, 16, 0.58)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: displayCrop.left + displayCrop.width,
                        top: displayCrop.top,
                        width: stageSize.width - displayCrop.left - displayCrop.width,
                        height: displayCrop.height,
                        background: 'rgba(8, 10, 16, 0.58)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: displayCrop.top + displayCrop.height,
                        width: '100%',
                        height: stageSize.height - displayCrop.top - displayCrop.height,
                        background: 'rgba(8, 10, 16, 0.58)',
                      }}
                    />
                  </div>

                  <div
                    onMouseDown={(event) => startDrag('move', event)}
                    style={{
                      position: 'absolute',
                      left: displayCrop.left,
                      top: displayCrop.top,
                      width: displayCrop.width,
                      height: displayCrop.height,
                      border: '2px solid var(--text)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0)',
                      cursor: dragState?.mode === 'move' ? 'grabbing' : 'grab',
                      zIndex: 3,
                    }}
                  >
                    {[1 / 3, 2 / 3].map((step) => (
                      <div
                        key={`v-${step}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: `${step * 100}%`,
                          width: 1,
                          background: 'rgba(255, 255, 255, 0.55)',
                        }}
                      />
                    ))}
                    {[1 / 3, 2 / 3].map((step) => (
                      <div
                        key={`h-${step}`}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${step * 100}%`,
                          height: 1,
                          background: 'rgba(255, 255, 255, 0.55)',
                        }}
                      />
                    ))}

                    {[
                      ['nw', { left: -7, top: -7, cursor: 'nwse-resize' }],
                      ['ne', { right: -7, top: -7, cursor: 'nesw-resize' }],
                      ['sw', { left: -7, bottom: -7, cursor: 'nesw-resize' }],
                      ['se', { right: -7, bottom: -7, cursor: 'nwse-resize' }],
                    ].map(([handle, position]) => (
                      <button
                        key={handle}
                        type="button"
                        onMouseDown={(event) => startDrag(handle, event)}
                        style={{
                          position: 'absolute',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid var(--bg)',
                          background: 'var(--text)',
                          padding: 0,
                          ...position,
                        }}
                        aria-label={`Resize crop ${handle}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  iconName="Scissors"
                  title="Preview unavailable"
                  message="The selected image could not be prepared for cropping. Try another image file."
                />
              )}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                      Cropped Output
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {result.width}x{result.height} · {formatBytes(result.size)}
                      {resultDelta !== null ? ` · ${resultDelta > 0 ? '+' : ''}${formatBytes(Math.abs(resultDelta))} vs original` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleDownload}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Icon icon={ICON_MAP.Download} size={14} />
                    Download
                  </button>
                </div>

                <div
                  style={{
                    minHeight: 220,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: 12,
                  }}
                >
                  <img
                    src={result.url}
                    alt="Cropped output preview"
                    style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Aspect Ratio</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`mode-btn${aspectPreset === preset.value ? ' active' : ''}`}
              onClick={() => handleAspectChange(preset.value)}
              disabled={!imageMeta}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="options-label">Crop Size</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            className="textarea"
            value={crop ? Math.round(crop.width) : ''}
            onChange={(event) => handleCropValueChange('width', event.target.value)}
            placeholder="Width"
            disabled={!crop}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
          <input
            type="number"
            className="textarea"
            value={crop ? Math.round(crop.height) : ''}
            onChange={(event) => handleCropValueChange('height', event.target.value)}
            placeholder="Height"
            disabled={!crop}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Exact pixel fields control the exported crop size directly. Drag the box in the preview to reposition or resize visually.
        </div>

        <div className="options-label">Output Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {OUTPUT_FORMATS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${outputFormat === value ? ' active' : ''}`}
              onClick={() => {
                setOutputFormat(value);
                setResult(null);
              }}
              disabled={!imageMeta}
            >
              {value === 'original' ? 'Original' : value.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="options-label">Quality</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={quality}
            onChange={(event) => {
              setQuality(Number(event.target.value));
              setResult(null);
            }}
            disabled={!['jpeg', 'webp'].includes(outputFormat)}
          />
          <span className="range-value">{Math.round(quality * 100)}%</span>
        </div>

        {imageFile ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>
              {imageFile.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {formatBytes(imageMeta?.size ?? 0)}
            </div>
          </div>
        ) : null}

        <label
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              handleFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
            style={{ display: 'none' }}
          />
          <Icon icon={ICON_MAP.Upload} size={14} />
          {imageFile ? 'Replace Image' : 'Upload Image'}
        </label>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
          onClick={handleCrop}
          disabled={!imageFile || !crop || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Scissors} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Cropping...' : 'Crop Image'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
          onClick={handleDownload}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={handleClear}
          disabled={!imageFile && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note">
          Cropping runs fully in-browser. Your image never leaves the page.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
