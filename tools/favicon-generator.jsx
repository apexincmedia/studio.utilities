'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, downloadText, formatBytes, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { canvasToBlob, createCanvas, drawContain, loadImageFromFile } from '@/lib/image-tool-utils';

const FAVICON_SIZES = [
  { size: 16, file: 'favicon-16x16.png' },
  { size: 32, file: 'favicon-32x32.png' },
  { size: 48, file: 'favicon-48x48.png' },
  { size: 64, file: 'favicon-64x64.png' },
  { size: 128, file: 'favicon-128x128.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 192, file: 'android-chrome-192x192.png' },
];

function buildHtmlSnippet() {
  return [
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />',
  ].join('\n');
}

export default function FaviconGenerator() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [generated, setGenerated] = useState([]);
  const [zipBlob, setZipBlob] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const htmlSnippet = useMemo(() => buildHtmlSnippet(), []);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setError(null);
    setGenerated([]);
    setZipBlob(null);

    if (!nextFile.type.startsWith('image/')) {
      setError('Please upload an image file for favicon generation.');
      return;
    }

    try {
      const { image, revoke } = await loadImageFromFile(nextFile);
      revoke();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      generated.forEach((item) => item.url && URL.revokeObjectURL(item.url));
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

  const handleGenerate = async () => {
    if (!file || !meta) return;

    setProcessing(true);
    setError(null);

    try {
      const [{ default: JSZip }] = await Promise.all([import('jszip')]);
      const { image, revoke } = await loadImageFromFile(file);

      try {
        generated.forEach((item) => item.url && URL.revokeObjectURL(item.url));
        const nextGenerated = [];
        const zip = new JSZip();

        for (const item of FAVICON_SIZES) {
          const canvas = createCanvas(item.size, item.size);
          const context = canvas.getContext('2d');
          drawContain(context, image, item.size, item.size);
          const blob = await canvasToBlob(canvas, 'image/png');
          const url = URL.createObjectURL(blob);

          zip.file(item.file, blob);
          nextGenerated.push({
            ...item,
            blob,
            url,
          });
        }

        zip.file('favicon-links.html', htmlSnippet);
        setGenerated(nextGenerated);
        setZipBlob(await zip.generateAsync({ type: 'blob' }));
      } finally {
        revoke();
      }
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the favicon package.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    generated.forEach((item) => item.url && URL.revokeObjectURL(item.url));
    setFile(null);
    setPreviewUrl('');
    setMeta(null);
    setGenerated([]);
    setZipBlob(null);
    setProcessing(false);
    setError(null);
  };

  const totalOutputSize = generated.reduce((sum, item) => sum + item.blob.size, 0);

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop a source image for favicon export"
            subtitle="Generate modern PNG favicon sizes plus an HTML snippet and ZIP package from one image."
            icon={<Icon icon={ICON_MAP.Star} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Source',
                  value: `${meta.width}x${meta.height}`,
                  description: `${formatBytes(meta.size)} input image`,
                  iconName: 'Image',
                },
                {
                  label: 'Outputs',
                  value: String(generated.length || FAVICON_SIZES.length),
                  description: generated.length ? `${formatBytes(totalOutputSize)} total PNG output` : 'PNG favicon sizes prepared',
                  tone: generated.length ? 'success' : 'default',
                  iconName: 'Star',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
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
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Source Image</div>
              <img
                src={previewUrl}
                alt={file.name}
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }}
              />
            </div>

            {generated.length ? (
              <>
                <div className="panel-label">Generated PNG Sizes</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {generated.map((item) => (
                    <div
                      key={item.file}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.file}
                          style={{ width: item.size, height: item.size, objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text)', textAlign: 'center' }}>
                        {item.size}x{item.size}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="panel-label">HTML Snippet</div>
                <textarea
                  className="textarea"
                  value={htmlSnippet}
                  readOnly
                  style={{ minHeight: 140 }}
                />
              </>
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          ICO output is intentionally skipped. Modern browsers and app platforms accept PNG favicon assets reliably.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : 'Generate Favicons'}
        </button>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(htmlSnippet)}
          disabled={!generated.length}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy HTML'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadBlob(zipBlob, 'favicons.zip')}
          disabled={!zipBlob}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download ZIP
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadText(htmlSnippet, 'favicon-links.html', 'text/html;charset=utf-8')}
          disabled={!generated.length}
        >
          <Icon icon={ICON_MAP.FileCode} size={14} />
          Download HTML
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
