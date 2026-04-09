'use client';

import { useEffect, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, formatBytes, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { createCanvas, loadImageFromFile } from '@/lib/image-tool-utils';

export default function PngToSvg() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [svgOutput, setSvgOutput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const [options, setOptions] = useState({
    colors: 8,
    smoothing: 1,
    lineThreshold: 1,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setError(null);
    setSvgOutput('');

    if (nextFile.type !== 'image/png' && !nextFile.name.toLowerCase().endsWith('.png')) {
      setError('Please upload a PNG image.');
      return;
    }

    try {
      const { image, revoke } = await loadImageFromFile(nextFile);
      revoke();

      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setMeta({
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: nextFile.size,
      });
    } catch (loadError) {
      setError(loadError.message || 'Unable to load that PNG file.');
    }
  };

  const handleTrace = async () => {
    if (!file || !meta) return;

    setProcessing(true);
    setError(null);

    try {
      const [{ default: ImageTracer }] = await Promise.all([import('imagetracerjs')]);
      const { image, revoke } = await loadImageFromFile(file);

      try {
        const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const svgString = ImageTracer.imagedataToSVG(context.getImageData(0, 0, canvas.width, canvas.height), {
          numberofcolors: Number(options.colors),
          ltres: Number(options.lineThreshold),
          qtres: Number(options.smoothing),
          pathomit: 4,
          linefilter: true,
          scale: 1,
          strokewidth: 1,
        });

        setSvgOutput(svgString);
      } finally {
        revoke();
      }
    } catch (traceError) {
      setSvgOutput('');
      setError(traceError.message || 'Unable to vectorize that PNG file.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl('');
    setMeta(null);
    setSvgOutput('');
    setProcessing(false);
    setError(null);
    setOptions({
      colors: 8,
      smoothing: 1,
      lineThreshold: 1,
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="image/png"
            onFiles={handleFiles}
            title="Drop a PNG to vectorize"
            subtitle="Trace logos and flat graphics into scalable SVG output directly in your browser."
            icon={<Icon icon={ICON_MAP.FileCode} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: `${meta.width}x${meta.height}`,
                  description: `${formatBytes(meta.size)} PNG`,
                  iconName: 'Image',
                },
                {
                  label: 'SVG',
                  value: svgOutput ? `${svgOutput.length} chars` : `${options.colors} colors`,
                  description: svgOutput ? 'Vector output ready to download' : 'Current trace preset',
                  tone: svgOutput ? 'success' : 'default',
                  iconName: 'FileCode',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: svgOutput ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
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
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Source PNG</div>
                <img
                  src={previewUrl}
                  alt={file.name}
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                />
              </div>

              {svgOutput ? (
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>SVG Preview</div>
                  <div
                    style={{
                      minHeight: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    dangerouslySetInnerHTML={{ __html: svgOutput }}
                  />
                </div>
              ) : null}
            </div>

            {svgOutput ? (
              <>
                <div className="panel-label">SVG Output</div>
                <textarea
                  className="textarea"
                  value={svgOutput}
                  readOnly
                  style={{ minHeight: 220 }}
                />
              </>
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Colors</div>
        <div className="mode-toggle" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {[2, 4, 8, 16].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.colors === value ? ' active' : ''}`}
              onClick={() => {
                setOptions((current) => ({ ...current, colors: value }));
                setSvgOutput('');
              }}
              disabled={!file}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="options-label">Smoothing</div>
        <div className="range-wrap" style={{ marginBottom: 12 }}>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={options.smoothing}
            onChange={(event) => {
              setOptions((current) => ({ ...current, smoothing: Number(event.target.value) }));
              setSvgOutput('');
            }}
            disabled={!file}
          />
          <span className="range-value">{Number(options.smoothing).toFixed(1)}</span>
        </div>

        <div className="options-label">Line Threshold</div>
        <div className="range-wrap" style={{ marginBottom: 20 }}>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={options.lineThreshold}
            onChange={(event) => {
              setOptions((current) => ({ ...current, lineThreshold: Number(event.target.value) }));
              setSvgOutput('');
            }}
            disabled={!file}
          />
          <span className="range-value">{Number(options.lineThreshold).toFixed(1)}</span>
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Best results come from logos, icons, and flat graphics. Detailed photos will generate very large SVG paths.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleTrace}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Tracing...' : 'Trace PNG'}
        </button>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(svgOutput)}
          disabled={!svgOutput}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy SVG'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadText(svgOutput, `${file.name.replace(/\.[^/.]+$/, '')}.svg`, 'image/svg+xml;charset=utf-8')}
          disabled={!svgOutput}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download SVG
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
