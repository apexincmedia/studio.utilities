'use client';

import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { cleanupImageEntries } from '@/tools/_shared/image-batch-tool';
import { createCanvas, createImageEntries, drawContain, fillCanvasBackground, loadImageFromFile } from '@/lib/image-tool-utils';

function getGifFilename(name) {
  return `${name.replace(/\.[^/.]+$/, '') || 'animated'}-animation.gif`;
}

export default function GifMaker() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    delay: 180,
    loopMode: 'infinite',
    loopCount: 1,
    width: '',
    quality: 10,
  });

  const handleFiles = useCallback(async (newFiles) => {
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

  const handleRender = async () => {
    if (!files.length) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const { default: GIF } = await import('gif.js/dist/gif');
      const firstWidth = Number.parseInt(options.width, 10) || files[0].dimensions?.width || 480;
      const firstHeight = Math.round(
        ((files[0].dimensions?.height || 270) / (files[0].dimensions?.width || 480)) * firstWidth
      );
      const canvas = createCanvas(firstWidth, firstHeight);
      const context = canvas.getContext('2d');
      const gif = new GIF({
        workers: 2,
        quality: Number(options.quality),
        workerScript: '/gif.worker.js',
        width: firstWidth,
        height: firstHeight,
        repeat: options.loopMode === 'infinite' ? 0 : Number(options.loopCount),
      });

      const blob = await new Promise(async (resolve, reject) => {
        gif.on('progress', (value) => setProgress(Math.round(value * 100)));
        gif.on('finished', resolve);
        gif.on('abort', () => reject(new Error('GIF rendering was aborted.')));

        try {
          for (const entry of files) {
            const { image, revoke } = await loadImageFromFile(entry.file);
            try {
              context.clearRect(0, 0, canvas.width, canvas.height);
              fillCanvasBackground(context, canvas.width, canvas.height, 'white');
              drawContain(context, image, canvas.width, canvas.height);
              gif.addFrame(context, { copy: true, delay: Number(options.delay) });
            } finally {
              revoke();
            }
          }

          gif.render();
        } catch (renderError) {
          reject(renderError);
        }
      });

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        width: firstWidth,
        height: firstHeight,
      });
    } catch (renderError) {
      setResult(null);
      setError(renderError.message || 'Unable to render the animated GIF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    cleanupImageEntries(files);
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    setFiles([]);
    setResult(null);
    setProcessing(false);
    setProgress(0);
    setError(null);
  };

  const targetWidth = Number.parseInt(options.width, 10) || files[0]?.dimensions?.width || 0;
  const targetHeight = targetWidth && files[0]?.dimensions
    ? Math.round((files[0].dimensions.height / files[0].dimensions.width) * targetWidth)
    : 0;
  const totalInputSize = useMemo(
    () => files.reduce((sum, entry) => sum + entry.originalSize, 0),
    [files]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        {!files.length ? (
          <DropZone
            accept="image/*"
            multiple
            onFiles={handleFiles}
            title="Drop images to build an animated GIF"
            subtitle="Upload frames in order, tune timing and quality, then export a browser-ready GIF."
            icon={<Icon icon={ICON_MAP.Film} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Frames',
                  value: String(files.length),
                  description: `${formatBytes(totalInputSize)} total input`,
                  iconName: 'Film',
                },
                {
                  label: 'Output',
                  value: result ? `${result.width}x${result.height}` : `${targetWidth || '-'}x${targetHeight || '-'}`,
                  description: result ? `${formatBytes(result.size)} GIF ready` : 'Render size from the first frame',
                  tone: result ? 'success' : 'default',
                  iconName: 'FileImage',
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
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>Rendering animated GIF...</div>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {files.map((entry, index) => (
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
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <img
                      src={entry.thumb}
                      alt={entry.file.name}
                      style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(8, 10, 16, 0.72)',
                        color: 'var(--text)',
                        padding: '2px 8px',
                        fontSize: 10,
                      }}
                    >
                      Frame {index + 1}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
                    {entry.file.name}
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleRemove(entry.id)}
                    disabled={processing}
                  >
                    <Icon icon={ICON_MAP.Trash2} size={12} />
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
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Animated Preview</div>
                <img
                  src={result.url}
                  alt="Animated GIF preview"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Frame Delay</div>
        <input
          type="number"
          className="textarea"
          value={options.delay}
          onChange={(event) => {
            setOptions((current) => ({ ...current, delay: Number(event.target.value) || 100 }));
            setResult(null);
          }}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          disabled={!files.length}
        />

        <div className="options-label">Loop</div>
        <div className="mode-toggle" style={{ marginBottom: 12 }}>
          {[
            ['infinite', 'Infinite'],
            ['count', 'Count'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.loopMode === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, loopMode: value }));
                setResult(null);
              }}
              disabled={!files.length}
            >
              {label}
            </button>
          ))}
        </div>

        {options.loopMode === 'count' ? (
          <input
            type="number"
            className="textarea"
            value={options.loopCount}
            onChange={(event) => {
              setOptions((current) => ({ ...current, loopCount: Number(event.target.value) || 1 }));
              setResult(null);
            }}
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
            disabled={!files.length}
          />
        ) : null}

        <div className="options-label">Output Width</div>
        <input
          type="number"
          className="textarea"
          value={options.width}
          onChange={(event) => {
            setOptions((current) => ({ ...current, width: event.target.value }));
            setResult(null);
          }}
          placeholder="Use first frame width"
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
          disabled={!files.length}
        />

        <div className="options-label">Quality</div>
        <div className="range-wrap" style={{ marginBottom: 20 }}>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={options.quality}
            onChange={(event) => {
              setOptions((current) => ({ ...current, quality: Number(event.target.value) }));
              setResult(null);
            }}
            disabled={!files.length}
          />
          <span className="range-value">{options.quality}</span>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleRender}
          disabled={files.length < 2 || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Rendering...' : 'Create GIF'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadBlob(result.blob, getGifFilename(files[0]?.file?.name || 'animated.gif'))}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download GIF
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!files.length && !error}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note">
          `gif.js` encodes frames in a Web Worker from `/gif.worker.js`, so GIF creation stays responsive even on larger frame sets.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
