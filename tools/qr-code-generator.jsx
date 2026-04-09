'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, downloadText, useCopyState } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout, TextStatLine } from '@/tools/_shared/text-tool-kit';

function buildQrContent({ type, text, phone, wifi, vcard }) {
  if (type === 'url' || type === 'text') return text.trim();
  if (type === 'phone') return phone.trim() ? `tel:${phone.trim()}` : '';
  if (type === 'wifi') {
    if (!wifi.ssid.trim()) return '';
    const encryption = wifi.encryption === 'none' ? 'nopass' : wifi.encryption;
    return `WIFI:T:${encryption};S:${wifi.ssid};P:${wifi.password};H:false;;`;
  }

  if (!vcard.name.trim()) return '';
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcard.name}`,
    vcard.phone ? `TEL:${vcard.phone}` : '',
    vcard.email ? `EMAIL:${vcard.email}` : '',
    vcard.url ? `URL:${vcard.url}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function QrCodeGenerator() {
  const canvasRef = useRef(null);
  const [type, setType] = useState('url');
  const [text, setText] = useState('https://example.com');
  const [phone, setPhone] = useState('+1 555 0100');
  const [wifi, setWifi] = useState({ ssid: 'Apex WiFi', password: 'secure-pass', encryption: 'WPA' });
  const [vcard, setVcard] = useState({ name: 'Apex Studio', phone: '+1 555 0100', email: 'hello@example.com', url: 'https://example.com' });
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('M');
  const [size, setSize] = useState(320);
  const [darkColor, setDarkColor] = useState('');
  const [lightColor, setLightColor] = useState('');
  const [error, setError] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [copied, copy] = useCopyState();

  const payload = useMemo(
    () => buildQrContent({ type, text, phone, wifi, vcard }),
    [type, text, phone, wifi, vcard]
  );

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setDarkColor(styles.getPropertyValue('--text').trim());
    setLightColor(styles.getPropertyValue('--pill-bg').trim());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderQr = async () => {
      if (!payload || !canvasRef.current || !darkColor || !lightColor) return;
      try {
        setRendering(true);
        setError(null);
        await QRCode.toCanvas(canvasRef.current, payload, {
          errorCorrectionLevel,
          width: size,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          margin: 1,
        });
      } catch (renderError) {
        if (!cancelled) {
          setError(renderError.message || 'QR code generation failed.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderQr();
    return () => {
      cancelled = true;
    };
  }, [payload, errorCorrectionLevel, size, darkColor, lightColor]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, 'qr-code.png');
    }, 'image/png');
  };

  const downloadSvg = async () => {
    const svgText = await QRCode.toString(payload, {
      type: 'svg',
      width: size,
      errorCorrectionLevel,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      margin: 1,
    });
    downloadText(svgText, 'qr-code.svg', 'image/svg+xml;charset=utf-8');
  };

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">QR Preview</div>
        {payload ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 360,
              marginBottom: 16,
            }}
          >
            {rendering ? (
              <Icon icon={ICON_MAP.Loader2} size={24} className="spin" />
            ) : (
              <canvas
                ref={canvasRef}
                width={size}
                height={size}
                style={{
                  width: Math.min(size, 320),
                  height: Math.min(size, 320),
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-2)',
                }}
              />
            )}
          </div>
        ) : (
          <EmptyState
            iconName="QrCode"
            title="Choose a QR content type"
            message="Add a URL, text, phone number, WiFi details, or a vCard contact to generate a live QR code."
          />
        )}

        <ErrorCallout message={error} />

        {payload ? (
          <>
            <div className="panel-label">Encoded Content</div>
            <textarea
              className="textarea"
              value={payload}
              readOnly
              style={{ minHeight: 120, marginBottom: 8 }}
            />
            <TextStatLine items={[`${payload.length} characters`, `${type} payload`]} marginBottom={0} />
          </>
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Content Type</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            ['url', 'URL'],
            ['text', 'Text'],
            ['wifi', 'WiFi'],
            ['vcard', 'vCard'],
            ['phone', 'Phone'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${type === value ? ' active' : ''}`}
              onClick={() => setType(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {type === 'url' || type === 'text' ? (
          <textarea
            className="textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={type === 'url' ? 'https://example.com' : 'Enter any text'}
            style={{ minHeight: 110, marginBottom: 20 }}
          />
        ) : null}

        {type === 'phone' ? (
          <input
            type="text"
            className="textarea"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 0100"
            style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 20 }}
          />
        ) : null}

        {type === 'wifi' ? (
          <div className="options-row">
            <input
              type="text"
              className="textarea"
              value={wifi.ssid}
              onChange={(event) => setWifi((current) => ({ ...current, ssid: event.target.value }))}
              placeholder="Network name"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
            <input
              type="text"
              className="textarea"
              value={wifi.password}
              onChange={(event) => setWifi((current) => ({ ...current, password: event.target.value }))}
              placeholder="Password"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
            <select
              className="textarea"
              value={wifi.encryption}
              onChange={(event) => setWifi((current) => ({ ...current, encryption: event.target.value }))}
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            >
              <option value="WPA">WPA</option>
              <option value="WEP">WEP</option>
              <option value="none">None</option>
            </select>
          </div>
        ) : null}

        {type === 'vcard' ? (
          <div className="options-row">
            <input
              type="text"
              className="textarea"
              value={vcard.name}
              onChange={(event) => setVcard((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
            <input
              type="text"
              className="textarea"
              value={vcard.phone}
              onChange={(event) => setVcard((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
            <input
              type="email"
              className="textarea"
              value={vcard.email}
              onChange={(event) => setVcard((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
            <input
              type="url"
              className="textarea"
              value={vcard.url}
              onChange={(event) => setVcard((current) => ({ ...current, url: event.target.value }))}
              placeholder="Website"
              style={{ minHeight: 'auto', padding: '12px 14px' }}
            />
          </div>
        ) : null}

        <div className="options-label">Error Correction</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {['L', 'M', 'Q', 'H'].map((value) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${errorCorrectionLevel === value ? ' active' : ''}`}
              onClick={() => setErrorCorrectionLevel(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="options-label">Size</div>
        <div className="range-wrap" style={{ marginBottom: 16 }}>
          <input
            type="range"
            min="180"
            max="600"
            step="10"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
          <span className="range-value">{size}</span>
        </div>

        <div className="options-label">Colors</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input type="color" value={darkColor} onChange={(event) => setDarkColor(event.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
          <input type="color" value={lightColor} onChange={(event) => setLightColor(event.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(payload)}
            disabled={!payload}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setText('');
              setPhone('');
              setWifi({ ssid: '', password: '', encryption: 'WPA' });
              setVcard({ name: '', phone: '', email: '', url: '' });
              setError(null);
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadPng} disabled={!payload}>
            PNG
          </button>
          <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadSvg} disabled={!payload}>
            SVG
          </button>
        </div>

        <div className="privacy-note">
          QR rendering is instant and local. No data leaves this device.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
