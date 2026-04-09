'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes, readAsArrayBuffer } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { getPdfBaseName, getPdfPageCount, isPdfFile, loadPdfLib } from '@/lib/pdf-tool-utils';

const POSITION_OPTIONS = [
  ['center', 'Center'],
  ['diagonal', 'Diagonal'],
  ['top-left', 'Top Left'],
  ['top-right', 'Top Right'],
  ['bottom-left', 'Bottom Left'],
  ['bottom-right', 'Bottom Right'],
];

function getPlacement(pageWidth, pageHeight, itemWidth, itemHeight, position) {
  const margin = 36;

  switch (position) {
    case 'top-left':
      return { x: margin, y: pageHeight - itemHeight - margin };
    case 'top-right':
      return { x: pageWidth - itemWidth - margin, y: pageHeight - itemHeight - margin };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'bottom-right':
      return { x: pageWidth - itemWidth - margin, y: margin };
    case 'center':
    case 'diagonal':
    default:
      return {
        x: (pageWidth - itemWidth) / 2,
        y: (pageHeight - itemHeight) / 2,
      };
  }
}

export default function PdfWatermark() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    mode: 'text',
    text: 'CONFIDENTIAL',
    fontSize: '48',
    opacity: '35',
    position: 'diagonal',
    angle: '-45',
    imageScale: '28',
  });

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (!isPdfFile(nextFile)) {
      setError('Please upload a PDF file.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });

    try {
      const count = await getPdfPageCount(nextFile);
      setFile(nextFile);
      setPageCount(count);
    } catch (loadError) {
      setFile(null);
      setPageCount(0);
      setError(loadError.message || 'Unable to inspect that PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWatermark = async () => {
    if (!file) return;
    if (options.mode === 'text' && !options.text.trim()) {
      setError('Enter watermark text before applying it.');
      return;
    }
    if (options.mode === 'image' && !watermarkImage) {
      setError('Upload a PNG or JPG watermark image first.');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });

    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await loadPdfLib();
      const sourceBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(sourceBytes);
      const opacity = Math.max(0.05, Math.min(1, (Number.parseInt(options.opacity, 10) || 35) / 100));
      const parsedAngle = Number.parseInt(options.angle, 10);
      const baseAngle = Number.isFinite(parsedAngle) ? parsedAngle : 0;
      const fontSize = Math.max(12, Number.parseInt(options.fontSize, 10) || 48);

      let embeddedFont = null;
      let embeddedImage = null;
      if (options.mode === 'text') {
        embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      } else {
        const imageBytes = await readAsArrayBuffer(watermarkImage);
        if (watermarkImage.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (watermarkImage.type === 'image/jpeg' || watermarkImage.type === 'image/jpg') {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          throw new Error('Watermark images must be PNG or JPG.');
        }
      }

      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const position = options.position;

        if (options.mode === 'text') {
          const textWidth = embeddedFont.widthOfTextAtSize(options.text, fontSize);
          const textHeight = fontSize;
          const placement = getPlacement(width, height, textWidth, textHeight, position);

          page.drawText(options.text, {
            x: placement.x,
            y: placement.y,
            font: embeddedFont,
            size: fontSize,
            opacity,
            color: rgb(0.62, 0.62, 0.62),
            rotate: degrees(position === 'diagonal' ? (Number.isFinite(parsedAngle) ? baseAngle : -45) : baseAngle),
          });
          return;
        }

        const scaleRatio = Math.max(0.1, Number.parseInt(options.imageScale, 10) || 28) / 100;
        const maxWidth = width * scaleRatio;
        const maxHeight = height * scaleRatio;
        const imageScale = Math.min(maxWidth / embeddedImage.width, maxHeight / embeddedImage.height);
        const targetWidth = embeddedImage.width * imageScale;
        const targetHeight = embeddedImage.height * imageScale;
        const placement = getPlacement(width, height, targetWidth, targetHeight, position);

        page.drawImage(embeddedImage, {
          x: placement.x,
          y: placement.y,
          width: targetWidth,
          height: targetHeight,
          opacity,
          rotate: degrees(position === 'diagonal' ? (Number.isFinite(parsedAngle) ? baseAngle : -45) : baseAngle),
        });
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({
        blob,
        size: blob.size,
        url: URL.createObjectURL(blob),
      });
    } catch (watermarkError) {
      setError(watermarkError.message || 'Unable to apply the watermark.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setWatermarkImage(null);
    setProcessing(false);
    setError(null);
    setOptions({
      mode: 'text',
      text: 'CONFIDENTIAL',
      fontSize: '48',
      opacity: '35',
      position: 'diagonal',
      angle: '-45',
      imageScale: '28',
    });
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept="application/pdf,.pdf"
            onFiles={handleFiles}
            title="Drop a PDF to add a watermark"
            subtitle="Apply a text or image watermark across every page with control over opacity, angle, and placement."
            icon={<Icon icon={ICON_MAP.Layers} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Pages',
                  value: String(pageCount),
                  description: `${formatBytes(file.size)} source PDF`,
                  iconName: 'FileText',
                },
                {
                  label: 'Mode',
                  value: options.mode === 'text' ? 'Text' : 'Image',
                  description: options.mode === 'text' ? options.text || 'Enter watermark text' : watermarkImage?.name || 'Upload watermark image',
                  iconName: 'Layers',
                },
                {
                  label: 'Output',
                  value: result ? formatBytes(result.size) : 'Pending',
                  description: result ? 'Watermarked PDF is ready to download' : 'Apply watermark to export a new file',
                  tone: result ? 'success' : 'default',
                  iconName: 'FilePlus',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            {result ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Watermarked PDF Ready
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  {options.mode === 'text'
                    ? `Text watermark "${options.text}" applied across ${pageCount} pages`
                    : `Image watermark applied across ${pageCount} pages`}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => downloadBlob(result.blob, `${getPdfBaseName(file.name)}-watermarked.pdf`)}
                >
                  <Icon icon={ICON_MAP.Download} size={14} />
                  Download Watermarked PDF
                </button>
              </div>
            ) : (
              <EmptyState
                iconName="Layers"
                title="Choose a watermark style"
                message="Use text for quick document stamps like `CONFIDENTIAL`, or switch to image mode for a logo watermark with the same opacity and placement controls."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Mode</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`mode-btn${options.mode === 'text' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, mode: 'text' }))}
          >
            Text Watermark
          </button>
          <button
            type="button"
            className={`mode-btn${options.mode === 'image' ? ' active' : ''}`}
            onClick={() => setOptions((current) => ({ ...current, mode: 'image' }))}
          >
            Image Watermark
          </button>
        </div>

        {options.mode === 'text' ? (
          <>
            <div className="options-label">Text</div>
            <input
              type="text"
              className="textarea"
              value={options.text}
              onChange={(event) => setOptions((current) => ({ ...current, text: event.target.value }))}
              placeholder="CONFIDENTIAL"
              style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
            />

            <div className="options-label">Font Size</div>
            <input
              type="number"
              className="input"
              min="12"
              max="120"
              value={options.fontSize}
              onChange={(event) => setOptions((current) => ({ ...current, fontSize: event.target.value }))}
              style={{ marginBottom: 16 }}
            />
          </>
        ) : (
          <>
            <div className="options-label">Watermark Image</div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(event) => setWatermarkImage(event.target.files?.[0] || null)}
              style={{ width: '100%', marginBottom: 16 }}
            />

            <div className="options-label">Image Scale</div>
            <input
              type="range"
              min="12"
              max="40"
              step="1"
              value={options.imageScale}
              onChange={(event) => setOptions((current) => ({ ...current, imageScale: event.target.value }))}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              {options.imageScale}% of page size
            </div>
          </>
        )}

        <div className="options-label">Position</div>
        <select
          className="input"
          value={options.position}
          onChange={(event) => setOptions((current) => ({ ...current, position: event.target.value }))}
          style={{ marginBottom: 16 }}
        >
          {POSITION_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="options-label">Opacity</div>
        <input
          type="range"
          min="10"
          max="100"
          step="1"
          value={options.opacity}
          onChange={(event) => setOptions((current) => ({ ...current, opacity: event.target.value }))}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
          {options.opacity}% opacity
        </div>

        <div className="options-label">Angle</div>
        <input
          type="range"
          min="-90"
          max="90"
          step="1"
          value={options.angle}
          onChange={(event) => setOptions((current) => ({ ...current, angle: event.target.value }))}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
          {options.angle}°
        </div>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          Text watermarks use an embedded Helvetica Bold font, while image watermarks accept PNG or JPG files and preserve transparency when available.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleWatermark}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Layers} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Applying...' : 'Apply Watermark'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
