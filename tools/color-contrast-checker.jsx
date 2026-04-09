'use client';

import { useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadText, useCopyState } from '@/lib/tool-utils';
import {
  ErrorCallout,
  MetricGrid,
} from '@/tools/_shared/text-tool-kit';
import { getColorFormats, parseColorInput } from '@/lib/color-utils';

const DEFAULT_FOREGROUND = 'rgb(17, 24, 39)';
const DEFAULT_BACKGROUND = 'rgb(255, 255, 255)';
const DEFAULT_FOREGROUND_PICKER = getColorFormats(parseColorInput(DEFAULT_FOREGROUND)).hex;
const DEFAULT_BACKGROUND_PICKER = getColorFormats(parseColorInput(DEFAULT_BACKGROUND)).hex;

function relativeLuminance({ r, g, b }) {
  const linearize = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const red = linearize(r);
  const green = linearize(g);
  const blue = linearize(b);

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function getContrastRatio(foreground, background) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function getThresholds(textSize) {
  return textSize === 'large'
    ? { aa: 3, aaa: 4.5 }
    : { aa: 4.5, aaa: 7 };
}

export default function ColorContrastChecker() {
  const [foregroundInput, setForegroundInput] = useState(DEFAULT_FOREGROUND);
  const [backgroundInput, setBackgroundInput] = useState(DEFAULT_BACKGROUND);
  const [textSize, setTextSize] = useState('normal');
  const [copied, copy] = useCopyState();

  const foreground = parseColorInput(foregroundInput);
  const background = parseColorInput(backgroundInput);
  const error = !foreground || !background
    ? 'Enter valid foreground and background colors.'
    : null;

  const contrastRatio = foreground && background ? getContrastRatio(foreground, background) : 0;
  const thresholds = getThresholds(textSize);
  const report = foreground && background
    ? [
        `Foreground: ${getColorFormats(foreground).hex}`,
        `Background: ${getColorFormats(background).hex}`,
        `Text Size: ${textSize}`,
        `Contrast Ratio: ${contrastRatio.toFixed(2)}:1`,
        `AA: ${contrastRatio >= thresholds.aa ? 'Pass' : 'Fail'}`,
        `AAA: ${contrastRatio >= thresholds.aaa ? 'Pass' : 'Fail'}`,
      ].join('\n')
    : '';

  return (
    <ToolLayout>
      <OutputPanel>
        <div className="panel-label">Live Preview</div>
        <div
          style={{
            background: background ? getColorFormats(background).hex : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '26px',
            marginBottom: 16,
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: foreground ? getColorFormats(foreground).hex : 'var(--text)',
              fontSize: textSize === 'large' ? 28 : 18,
              fontWeight: textSize === 'large' ? 700 : 500,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: 420,
            }}
          >
            Apex Studio Utilities makes contrast checks fast, visual, and WCAG-ready.
          </div>
        </div>

        <ErrorCallout message={error} />

        {foreground && background ? (
          <MetricGrid
            items={[
              {
                label: 'Contrast',
                value: `${contrastRatio.toFixed(2)}:1`,
                description: 'WCAG contrast ratio for the selected pair',
                iconName: 'Eye',
              },
              {
                label: 'AA',
                value: contrastRatio >= thresholds.aa ? 'Pass' : 'Fail',
                description: `${thresholds.aa}:1 required for ${textSize} text`,
                tone: contrastRatio >= thresholds.aa ? 'success' : 'error',
              },
              {
                label: 'AAA',
                value: contrastRatio >= thresholds.aaa ? 'Pass' : 'Fail',
                description: `${thresholds.aaa}:1 required for ${textSize} text`,
                tone: contrastRatio >= thresholds.aaa ? 'success' : 'error',
              },
            ]}
          />
        ) : null}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Foreground</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="color"
            value={foreground ? getColorFormats(foreground).hex : DEFAULT_FOREGROUND_PICKER}
            onChange={(event) => setForegroundInput(event.target.value)}
            style={{ width: 56, height: 44, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}
          />
          <input
            type="text"
            className="textarea"
            value={foregroundInput}
            onChange={(event) => setForegroundInput(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </div>

        <div className="options-label">Background</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="color"
            value={background ? getColorFormats(background).hex : DEFAULT_BACKGROUND_PICKER}
            onChange={(event) => setBackgroundInput(event.target.value)}
            style={{ width: 56, height: 44, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}
          />
          <input
            type="text"
            className="textarea"
            value={backgroundInput}
            onChange={(event) => setBackgroundInput(event.target.value)}
            style={{ minHeight: 'auto', padding: '12px 14px' }}
          />
        </div>

        <div className="options-label">Text Size</div>
        <div className="mode-toggle" style={{ marginBottom: 20 }}>
          {[
            ['normal', 'Normal'],
            ['large', 'Large'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${textSize === value ? ' active' : ''}`}
              onClick={() => setTextSize(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="panel-divider" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`copy-btn${copied ? ' copied' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => copy(report)}
            disabled={!report}
          >
            <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
            {copied ? 'Copied' : 'Copy Report'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              setForegroundInput(DEFAULT_FOREGROUND);
              setBackgroundInput(DEFAULT_BACKGROUND);
              setTextSize('normal');
            }}
          >
            Reset
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadText(report, 'contrast-report.txt', 'text/plain;charset=utf-8')}
          disabled={!report}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download
        </button>

        <div className="privacy-note">Contrast calculations follow WCAG 2.1 luminance rules locally</div>
      </OptionsPanel>
    </ToolLayout>
  );
}
