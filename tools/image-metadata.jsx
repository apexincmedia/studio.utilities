'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, downloadText, formatBytes, readAsArrayBuffer, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import {
  canvasToBlob,
  createCanvas,
  fillCanvasBackground,
  loadImageFromFile,
  supportsCanvasMime,
} from '@/lib/image-tool-utils';

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function formatExposure(value) {
  if (!Number.isFinite(value)) return null;
  if (value >= 1) {
    return `${value.toFixed(value >= 10 ? 0 : 1)} s`;
  }

  return `1/${Math.round(1 / value)} s`;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value).toFixed(digits).replace(/\.?0+$/, '');
}

function formatValue(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  if (value instanceof Date) return formatDate(value);
  if (Array.isArray(value)) {
    const filtered = value.map((item) => formatValue(item)).filter(Boolean);
    return filtered.length ? filtered.join(', ') : null;
  }
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return null;
  return String(value);
}

function createSection(title, items) {
  const filtered = items.filter((item) => item.value);
  return filtered.length ? { title, items: filtered } : null;
}

function buildSections({ file, dimensions, metadata }) {
  const latitude = metadata?.latitude ?? metadata?.GPSLatitude ?? null;
  const longitude = metadata?.longitude ?? metadata?.GPSLongitude ?? null;

  return [
    createSection('Basics', [
      { label: 'Filename', value: file.name },
      { label: 'File type', value: file.type || 'Unknown' },
      { label: 'File size', value: formatBytes(file.size) },
      {
        label: 'Dimensions',
        value: dimensions ? `${dimensions.width} x ${dimensions.height}` : null,
      },
      { label: 'Last modified', value: formatDate(file.lastModified) },
    ]),
    createSection('Camera', [
      { label: 'Make', value: metadata?.Make },
      { label: 'Model', value: metadata?.Model },
      { label: 'Lens', value: metadata?.LensModel },
      { label: 'Software', value: metadata?.Software },
      { label: 'Color space', value: metadata?.ColorSpace },
    ]),
    createSection('Exposure', [
      { label: 'Shutter', value: formatExposure(metadata?.ExposureTime) },
      { label: 'Aperture', value: metadata?.FNumber ? `f/${formatNumber(metadata.FNumber, 1)}` : null },
      { label: 'ISO', value: metadata?.ISO ?? metadata?.PhotographicSensitivity },
      { label: 'Focal length', value: metadata?.FocalLength ? `${formatNumber(metadata.FocalLength, 1)} mm` : null },
      { label: 'Flash', value: formatValue(metadata?.Flash) },
    ]),
    createSection('Capture', [
      { label: 'Taken', value: formatDate(metadata?.DateTimeOriginal ?? metadata?.CreateDate) },
      { label: 'Orientation', value: formatValue(metadata?.Orientation) },
      { label: 'White balance', value: formatValue(metadata?.WhiteBalance) },
      { label: 'Metering', value: formatValue(metadata?.MeteringMode) },
      { label: 'Exposure mode', value: formatValue(metadata?.ExposureMode) },
    ]),
    createSection('Location', [
      { label: 'Latitude', value: Number.isFinite(latitude) ? formatNumber(latitude, 6) : null },
      { label: 'Longitude', value: Number.isFinite(longitude) ? formatNumber(longitude, 6) : null },
      { label: 'Altitude', value: metadata?.GPSAltitude ? `${formatNumber(metadata.GPSAltitude, 1)} m` : null },
      {
        label: 'Map link',
        value: Number.isFinite(latitude) && Number.isFinite(longitude)
          ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
          : null,
      },
    ]),
  ].filter(Boolean);
}

function metadataReplacer(_key, value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

async function exportWithoutMetadata(file) {
  const { image, revoke } = await loadImageFromFile(file);

  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    const mime = supportsCanvasMime(file.type) ? file.type : 'image/png';

    if (mime === 'image/jpeg') {
      fillCanvasBackground(context, width, height, 'white');
    }

    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, mime, mime === 'image/jpeg' ? 0.92 : undefined);
    const extension = mime === 'image/jpeg'
      ? 'jpg'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/png'
          ? 'png'
          : file.name.split('.').pop()?.toLowerCase() || 'png';

    return {
      blob,
      filename: `${file.name.replace(/\.[^/.]+$/, '')}-clean.${extension}`,
    };
  } finally {
    revoke();
  }
}

export default function ImageMetadata() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [sections, setSections] = useState([]);
  const [stripOnDownload, setStripOnDownload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  const metadataJson = useMemo(
    () => JSON.stringify(metadata || {}, metadataReplacer, 2),
    [metadata]
  );

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!nextFile.type.startsWith('image/')) {
      setError('Please upload an image file to inspect metadata.');
      return;
    }

    setLoading(true);
    setError(null);
    setMetadata(null);
    setSections([]);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      const [exifrModule, arrayBuffer, imageAsset] = await Promise.all([
        import('exifr'),
        readAsArrayBuffer(nextFile),
        loadImageFromFile(nextFile),
      ]);
      const parse = exifrModule.parse ?? exifrModule.default?.parse;

      imageAsset.revoke();

      if (typeof parse !== 'function') {
        throw new Error('The EXIF reader is unavailable in this browser session.');
      }

      const parsedMetadata = (await parse(arrayBuffer, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        xmp: true,
        icc: true,
      })) || {};
      const nextDimensions = {
        width: imageAsset.image.naturalWidth,
        height: imageAsset.image.naturalHeight,
      };

      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setDimensions(nextDimensions);
      setMetadata(parsedMetadata);
      setSections(buildSections({ file: nextFile, dimensions: nextDimensions, metadata: parsedMetadata }));
    } catch (loadError) {
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setDimensions(null);
      setMetadata(null);
      setSections([]);
      setError(loadError.message || 'Unable to read metadata from that image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    if (!stripOnDownload) {
      downloadBlob(file, file.name);
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const cleaned = await exportWithoutMetadata(file);
      downloadBlob(cleaned.blob, cleaned.filename);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to strip metadata from that image.');
    } finally {
      setDownloading(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl('');
    setDimensions(null);
    setMetadata(null);
    setSections([]);
    setStripOnDownload(true);
    setLoading(false);
    setDownloading(false);
    setError(null);
  };

  const locationSection = sections.find((section) => section.title === 'Location');
  const mapLink = locationSection?.items.find((item) => item.label === 'Map link')?.value || '';
  const metadataCount = metadata ? Object.keys(metadata).length : 0;

  return (
    <ToolLayout>
      <OutputPanel>
        {!file && !loading ? (
          <DropZone
            accept="image/*"
            onFiles={handleFiles}
            title="Drop a photo to inspect its metadata"
            subtitle="Review useful EXIF details like camera settings, timestamps, and GPS info, then download a clean copy for privacy."
            icon={<Icon icon={ICON_MAP.Info} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Image',
                  value: dimensions ? `${dimensions.width}x${dimensions.height}` : 'Loaded',
                  description: file ? `${formatBytes(file.size)} source file` : 'Awaiting upload',
                  iconName: 'Image',
                },
                {
                  label: 'Metadata',
                  value: loading ? 'Reading...' : metadataCount ? String(metadataCount) : 'None',
                  description: metadataCount ? 'Parsed EXIF/XMP fields' : 'No embedded metadata surfaced',
                  tone: metadataCount ? 'success' : 'default',
                  iconName: 'Info',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {loading ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Icon icon={ICON_MAP.Loader2} size={18} className="spin" />
                <div style={{ fontSize: 13, color: 'var(--text)' }}>Reading embedded image metadata...</div>
              </div>
            ) : (
              <>
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
                    Preview
                  </div>
                  <img
                    src={previewUrl}
                    alt={file?.name || 'Uploaded image'}
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                  />
                </div>

                {sections.length > 1 ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {sections.map((section) => (
                      <div
                        key={section.title}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface)',
                          padding: 16,
                        }}
                      >
                        <div className="panel-label" style={{ marginBottom: 12 }}>
                          {section.title}
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          {section.items.map((item) => (
                            <div
                              key={`${section.title}-${item.label}`}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 16,
                                borderTop: '1px solid var(--border)',
                                paddingTop: 10,
                              }}
                            >
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.label}</div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text)',
                                  textAlign: 'right',
                                  maxWidth: '65%',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {item.label === 'Map link' ? (
                                  <a href={item.value} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }}>
                                    Open location
                                  </a>
                                ) : (
                                  item.value
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    iconName="Info"
                    title="No useful EXIF metadata surfaced"
                    message="This image can still be cleaned for privacy. Some formats or exported screenshots simply do not carry camera metadata."
                  />
                )}
              </>
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Clean-copy downloads re-encode the image in your browser, which removes most embedded EXIF metadata before the file is saved again.
        </div>

        <label className="checkbox-row" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={stripOnDownload}
            onChange={(event) => setStripOnDownload(event.target.checked)}
            disabled={!file}
          />
          <span className="checkbox-label">Strip metadata on download</span>
        </label>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(metadataJson)}
          disabled={!metadata}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy Metadata JSON'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => downloadText(metadataJson, 'image-metadata.json', 'application/json;charset=utf-8')}
          disabled={!metadata}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download JSON
        </button>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleDownload}
          disabled={!file || downloading}
        >
          <Icon icon={downloading ? ICON_MAP.Loader2 : ICON_MAP.FileImage} size={14} className={downloading ? 'spin' : ''} />
          {downloading
            ? 'Preparing...'
            : stripOnDownload
              ? 'Download Clean Copy'
              : 'Download Original'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: mapLink ? 8 : 0 }}
          onClick={handleClear}
          disabled={!file && !loading}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        {mapLink ? (
          <a
            href={mapLink}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
          >
            <Icon icon={ICON_MAP.Globe} size={14} />
            Open Map Link
          </a>
        ) : null}
      </OptionsPanel>
    </ToolLayout>
  );
}
