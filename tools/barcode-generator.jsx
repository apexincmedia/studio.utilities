'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, downloadText, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';

function validateBarcodeValue(format, value) {
  const clean = value.trim();
  if (!clean) return 'Enter a value to generate a barcode.';
  if (format === 'EAN13' && !/^\d{12,13}$/.test(clean)) return 'EAN-13 needs 12 or 13 digits.';
  if (format === 'EAN8' && !/^\d{7,8}$/.test(clean)) return 'EAN-8 needs 7 or 8 digits.';
  if (format === 'UPC' && !/^\d{11,12}$/.test(clean)) return 'UPC-A needs 11 or 12 digits.';
  if (format === 'ITF14' && !/^\d{13,14}$/.test(clean)) return 'ITF-14 needs 13 or 14 digits.';
  if (format === 'CODE39' && !/^[A-Z0-9\-.\s$/+%]+$/i.test(clean)) return 'Code 39 allows letters, numbers, spaces, and - . $ / + %.';
  return null;
}

export default function BarcodeGenerator() {
  const svgRef = useRef(null);
  const [format, setFormat] = useState('CODE128');
  const [value, setValue] = useState('123456789012');
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [lineColor, setLineColor] = useState('');
  const [background, setBackground] = useState('');
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setLineColor(styles.getPropertyValue('--text').trim());
    setBackground(styles.getPropertyValue('--pill-bg').trim());
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!lineColor || !background) return;
    const validationError = validateBarcodeValue(format, value);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width: barWidth,
        height,
        displayValue,
        lineColor,
        background,
        margin: 12,
        fontOptions: 'bold',
      });
      setError(null);
    } catch (renderError) {
      setError(renderError.message || 'Barcode generation failed.');
    }
  }, [format, value, barWidth, height, displayValue, lineColor, background]);

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgRef.current);
    downloadText(svgText, 'barcode.svg', 'image/svg+xml;charset=utf-8');
  };

  const downloadPng = async () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      downloadBlob(pngBlob, 'barcode.png');
    }, 'image/png');
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Barcode Preview</div>
        {value.trim() ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
              marginBottom: 16,
              overflow: 'auto',
            }}
          >
            <svg ref={svgRef} />
          </div>
        ) : (
          <EmptyState
            iconName="Layers"
            title="Generate a barcode instantly"
            message="Choose a standard format, enter a valid value, then export the barcode as SVG or PNG."
          />
        )}

        <ErrorCallout message={error} />

        {value.trim() ? (
          <>
            <div className="panel-label">Barcode Value</div>
            <textarea className="textarea" value={value} readOnly style={{ minHeight: 100, marginBottom: 8 }} />
            <TextStatLine items={[format, `${value.length} characters`]} marginBottom={0} />
          </>
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Format</div>
        <select
          className="textarea"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
        >
          <option value="CODE128">CODE128</option>
          <option value="EAN13">EAN-13</option>
          <option value="EAN8">EAN-8</option>
          <option value="UPC">UPC-A</option>
          <option value="CODE39">CODE39</option>
          <option value="ITF14">ITF-14</option>
        </select>

        <div className="options-label">Value</div>
        <input
          type="text"
          className="textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
        />

        <div className="options-label">Bar Width</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input type="range" min="1" max="4" step="1" value={barWidth} onChange={(event) => setBarWidth(Number(event.target.value))} />
          <span className="range-value">{barWidth}</span>
        </div>

        <div className="options-label">Height</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input type="range" min="60" max="180" step="5" value={height} onChange={(event) => setHeight(Number(event.target.value))} />
          <span className="range-value">{height}</span>
        </div>

        <label className="checkbox-row" style={{ marginBottom: 20 }}>
          <input type="checkbox" checked={displayValue} onChange={(event) => setDisplayValue(event.target.checked)} />
          <span className="checkbox-label">Display value below barcode</span>
        </label>

        <div className="options-label">Colors</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input type="color" value={lineColor} onChange={(event) => setLineColor(event.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
          <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(value)}
            disabled={!value.trim()}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setValue('')}
          >
            Clear
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadSvg} disabled={Boolean(error)}>
            SVG
          </button>
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadPng} disabled={Boolean(error)}>
            PNG
          </button>
        </div>

        <div className="privacy-note">
          Barcode generation is local and instant, with no server round-trip.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
