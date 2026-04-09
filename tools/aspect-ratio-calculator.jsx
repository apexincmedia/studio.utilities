'use client';

import { useState } from 'react';
import {
  CalculatorEmptyState,
  CalculatorField,
  CalculatorInput,
  CalculatorNotice,
  CalculatorPrimaryResult,
  CalculatorSectionDivider,
  CalculatorSelect,
  CalculatorShell,
  CalculatorStatGrid,
  OutputPanel,
} from '@/tools/_shared/calculator-kit';
import {
  formatNumber,
  parseAspectRatio,
  scaleAspectRatio,
  simplifyAspectRatio,
} from '@/lib/calculator-tool-utils';

const PRESETS = ['16:9', '4:3', '1:1', '21:9', '3:2', '9:16'];

export default function AspectRatioCalculator() {
  const [mode, setMode] = useState('find');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [knownSide, setKnownSide] = useState('width');
  const [knownValue, setKnownValue] = useState('');

  const simplified = mode === 'find' ? simplifyAspectRatio(width, height) : null;
  const scaled = mode === 'scale' ? scaleAspectRatio(ratio, knownSide, knownValue) : null;
  const ratioParsed = mode === 'scale' ? parseAspectRatio(ratio) : null;
  const isInvalid =
    mode === 'find'
      ? (width.trim() || height.trim()) && !simplified
      : (ratio.trim() || knownValue.trim()) && (!ratioParsed || !scaled);

  const copyValue =
    mode === 'find' && simplified
      ? [
          `Aspect ratio: ${simplified.ratio}`,
          `Decimal ratio: ${formatNumber(simplified.decimal, { maximumFractionDigits: 4 })}`,
        ].join('\n')
      : scaled
        ? [
            `Ratio: ${ratio}`,
            `Width: ${formatNumber(scaled.width, { maximumFractionDigits: 2 })}`,
            `Height: ${formatNumber(scaled.height, { maximumFractionDigits: 2 })}`,
          ].join('\n')
        : '';

  return (
    <CalculatorShell
      copyValue={copyValue}
      onClear={() => {
        setMode('find');
        setWidth('');
        setHeight('');
        setRatio('16:9');
        setKnownSide('width');
        setKnownValue('');
      }}
      options={
        <>
          <div className="options-label">Mode</div>
          <div className="mode-toggle" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`mode-btn${mode === 'find' ? ' active' : ''}`}
              onClick={() => setMode('find')}
            >
              Find Ratio
            </button>
            <button
              type="button"
              className={`mode-btn${mode === 'scale' ? ' active' : ''}`}
              onClick={() => setMode('scale')}
            >
              Scale Dimensions
            </button>
          </div>

          <div className="options-label">Common Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`mode-btn${ratio === preset ? ' active' : ''}`}
                onClick={() => setRatio(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          {mode === 'scale' ? (
            <>
              <div className="options-label">Known Dimension</div>
              <CalculatorSelect
                value={knownSide}
                onChange={(event) => setKnownSide(event.target.value)}
                style={{ marginBottom: 20 }}
              >
                <option value="width">Width</option>
                <option value="height">Height</option>
              </CalculatorSelect>
            </>
          ) : null}

          <div className="panel-divider" />
          <CalculatorNotice message="Use presets for popular video and image formats, or enter any custom ratio like 5:4 or 239:100." />
        </>
      }
    >
      <OutputPanel>
        <div className="panel-label" style={{ marginBottom: 16 }}>
          {mode === 'find' ? 'Dimensions' : 'Scaling Inputs'}
        </div>

        {mode === 'find' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <CalculatorField label="Width">
                <CalculatorInput
                  type="number"
                  placeholder="1920"
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                />
              </CalculatorField>
              <CalculatorField label="Height">
                <CalculatorInput
                  type="number"
                  placeholder="1080"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                />
              </CalculatorField>
            </div>

            {!width.trim() && !height.trim() ? (
              <CalculatorEmptyState
                iconName="Maximize2"
                title="Reduce any dimensions to their simplest ratio"
                message="Enter a width and height to simplify them into a clean aspect ratio and see whether the shape is landscape, portrait, or square."
              />
            ) : null}

            {isInvalid ? (
              <CalculatorNotice tone="error" message="Enter positive width and height values to simplify the ratio." />
            ) : null}

            {simplified ? (
              <>
                <CalculatorPrimaryResult
                  label="Simplified Ratio"
                  value={simplified.ratio}
                  detail={`Decimal ratio: ${formatNumber(simplified.decimal, { maximumFractionDigits: 4 })}`}
                />
                <CalculatorStatGrid
                  items={[
                    {
                      label: 'Orientation',
                      value:
                        simplified.decimal > 1
                          ? 'Landscape'
                          : simplified.decimal < 1
                            ? 'Portrait'
                            : 'Square',
                      detail: 'Based on width vs height',
                    },
                    {
                      label: 'Decimal Form',
                      value: formatNumber(simplified.decimal, { maximumFractionDigits: 4 }),
                      detail: 'Width divided by height',
                    },
                  ]}
                />
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <CalculatorField label="Aspect Ratio">
              <CalculatorInput
                placeholder="16:9"
                value={ratio}
                onChange={(event) => setRatio(event.target.value)}
              />
            </CalculatorField>
            <CalculatorField label={`Known ${knownSide === 'width' ? 'Width' : 'Height'}`}>
              <CalculatorInput
                type="number"
                placeholder={knownSide === 'width' ? '1920' : '1080'}
                value={knownValue}
                onChange={(event) => setKnownValue(event.target.value)}
              />
            </CalculatorField>

            {!knownValue.trim() ? (
              <CalculatorEmptyState
                iconName="Maximize2"
                title="Scale dimensions without breaking the ratio"
                message="Enter a ratio plus one known dimension to calculate the matching width or height instantly."
              />
            ) : null}

            {isInvalid ? (
              <CalculatorNotice tone="error" message="Use a valid ratio like 16:9 and a positive known dimension." />
            ) : null}

            {scaled ? (
              <>
                <CalculatorPrimaryResult
                  label="Scaled Dimensions"
                  value={`${formatNumber(scaled.width, { maximumFractionDigits: 2 })} × ${formatNumber(scaled.height, { maximumFractionDigits: 2 })}`}
                  detail={`Ratio preserved as ${ratio}`}
                />
                <CalculatorSectionDivider label="Dimensions" />
                <CalculatorStatGrid
                  items={[
                    {
                      label: 'Width',
                      value: formatNumber(scaled.width, { maximumFractionDigits: 2 }),
                      detail: 'Scaled proportionally',
                    },
                    {
                      label: 'Height',
                      value: formatNumber(scaled.height, { maximumFractionDigits: 2 }),
                      detail: 'Scaled proportionally',
                    },
                  ]}
                />
              </>
            ) : null}
          </div>
        )}
      </OutputPanel>
    </CalculatorShell>
  );
}
