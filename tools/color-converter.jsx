'use client';

import { useEffect, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { copyToClipboard, downloadText, useDebounce } from '@/lib/tool-utils';
import {
  EmptyState,
  ErrorCallout,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import {
  getColorFormats,
  parseColorInput,
} from '@/lib/color-utils';

function FormatCard({ label, value, copied, onCopy }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
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

export default function ColorConverter() {
  const [input, setInput] = useState('#1F6FEB');
  const [copiedKey, setCopiedKey] = useState('');
  const debouncedInput = useDebounce(input, 150);

  const parsedColor = parseColorInput(debouncedInput);
  const formats = parsedColor ? getColorFormats(parsedColor) : null;
  const error =
    debouncedInput.trim() && !formats
      ? 'Enter a valid HEX, RGB, HSL, HSV, or CMYK color.'
      : null;

  useEffect(() => {
    if (!copiedKey) return undefined;
    const timer = setTimeout(() => setCopiedKey(''), 1200);
    return () => clearTimeout(timer);
  }, [copiedKey]);

  const report = formats
    ? [
        `HEX: ${formats.hex}`,
        `RGB: ${formats.rgb}`,
        `HSL: ${formats.hsl}`,
        `HSV: ${formats.hsv}`,
        `CMYK: ${formats.cmyk}`,
      ].join('\n')
    : '';

  async function handleCopy(label, value) {
    const copied = await copyToClipboard(value);
    if (copied) {
      setCopiedKey(label);
    }
  }

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Color Preview</div>
        {formats ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: 180,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: formats.hex,
                marginBottom: 16,
              }}
            />
            <MetricGrid
              items={[
                {
                  label: 'HEX',
                  value: formats.hex,
                  description: 'CSS-ready hexadecimal color',
                  iconName: 'Eye',
                },
                {
                  label: 'RGB',
                  value: `${formats.rgbObject.r} / ${formats.rgbObject.g} / ${formats.rgbObject.b}`,
                  description: 'Red, green, and blue channels',
                  iconName: 'Package',
                },
              ]}
              columns="repeat(2, minmax(0, 1fr))"
            />
          </div>
        ) : (
          <EmptyState
            iconName="Eye"
            title="Convert one color into every common format"
            message="Paste any supported color format or choose one with the picker to get clean HEX, RGB, HSL, HSV, and CMYK values."
          />
        )}

        <ErrorCallout message={error} />

        {formats ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <FormatCard
              label="HEX"
              value={formats.hex}
              copied={copiedKey === 'hex'}
              onCopy={() => handleCopy('hex', formats.hex)}
            />
            <FormatCard
              label="RGB"
              value={formats.rgb}
              copied={copiedKey === 'rgb'}
              onCopy={() => handleCopy('rgb', formats.rgb)}
            />
            <FormatCard
              label="HSL"
              value={formats.hsl}
              copied={copiedKey === 'hsl'}
              onCopy={() => handleCopy('hsl', formats.hsl)}
            />
            <FormatCard
              label="HSV"
              value={formats.hsv}
              copied={copiedKey === 'hsv'}
              onCopy={() => handleCopy('hsv', formats.hsv)}
            />
            <FormatCard
              label="CMYK"
              value={formats.cmyk}
              copied={copiedKey === 'cmyk'}
              onCopy={() => handleCopy('cmyk', formats.cmyk)}
            />
          </div>
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Manual Input</div>
        <input
          type="text"
          className="textarea"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="#1F6FEB or rgb(31, 111, 235)"
          style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}
        />

        <div className="options-label">Color Picker</div>
        <input
          type="color"
          value={formats?.hex ?? '#000000'}
          onChange={(event) => setInput(event.target.value)}
          style={{
            width: '100%',
            height: 48,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            marginBottom: 20,
          }}
        />

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: 12,
            color: 'var(--text-dim)',
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          Supports `#hex`, `rgb()`, `hsl()`, `hsv()`, and `cmyk()`.
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copiedKey === 'report' ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => handleCopy('report', report)}
            disabled={!report}
          >
            <Icon icon={copiedKey === 'report' ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copiedKey === 'report' ? 'Copied' : 'Copy All'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setInput('')}
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'color-conversions.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Color parsing and conversion run entirely in the browser</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
