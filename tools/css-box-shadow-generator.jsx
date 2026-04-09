'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { getColorFormats, parseColorInput } from '@/lib/color-utils';

const DEFAULT_PREVIEW_BACKGROUND = 'rgb(229, 231, 235)';
const DEFAULT_LAYERS = [
  {
    x: 0,
    y: 12,
    blur: 32,
    spread: -8,
    color: 'rgb(17, 24, 39)',
    opacity: 0.2,
    inset: false,
  },
];

function getPickerValue(color, fallback = 'rgb(255, 255, 255)') {
  return getColorFormats(parseColorInput(color) ?? parseColorInput(fallback)).hex;
}

function colorToRgba(color, opacity) {
  const parsed = parseColorInput(color) ?? { r: 0, g: 0, b: 0 };
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${opacity})`;
}

function buildShadowValue(layers) {
  return layers
    .map((layer) => {
      const parts = [
        `${layer.x}px`,
        `${layer.y}px`,
        `${layer.blur}px`,
        `${layer.spread}px`,
        colorToRgba(layer.color, layer.opacity),
      ];

      if (layer.inset) {
        parts.unshift('inset');
      }

      return parts.join(' ');
    })
    .join(', ');
}

export default function CssBoxShadowGenerator() {
  const [previewBackground, setPreviewBackground] = useState(DEFAULT_PREVIEW_BACKGROUND);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const shadowValue = useMemo(() => buildShadowValue(layers), [layers]);
  const output = `box-shadow: ${shadowValue};`;

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!layers.length}
      emptyState={
        <EmptyState
          iconName="Layers"
          title="Design layered box shadows visually"
          message="Adjust offsets, blur, spread, opacity, and inset mode to produce a clean CSS `box-shadow` value with a live preview."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Layers',
                value: String(layers.length),
                description: 'Shadow layers included in the stack',
                iconName: 'Layers',
              },
            ]}
            columns="1fr"
            marginBottom={16}
          />

          <div
            style={{
              background: previewBackground,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              marginBottom: 16,
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 220,
                height: 160,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                boxShadow: shadowValue,
              }}
            />
          </div>

          <div className="panel-label">CSS Output</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 140 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Preview Background</div>
          <input
            type="color"
            value={getPickerValue(previewBackground, DEFAULT_PREVIEW_BACKGROUND)}
            onChange={(event) => setPreviewBackground(event.target.value)}
            style={{ width: '100%', height: 44, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', marginBottom: 16 }}
          />

          <div className="options-label">Shadow Layers</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {layers.map((layer, index) => (
              <div
                key={`layer-${index}`}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {[
                    ['x', 'X'],
                    ['y', 'Y'],
                    ['blur', 'Blur'],
                    ['spread', 'Spread'],
                  ].map(([key, label]) => (
                    <input
                      key={key}
                      type="number"
                      className="textarea"
                      value={layer[key]}
                      onChange={(event) => setLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: Number(event.target.value) } : item))}
                      placeholder={label}
                      style={{ minHeight: 'auto', padding: '12px 14px' }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={getPickerValue(layer.color, 'rgb(17, 24, 39)')} onChange={(event) => setLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} style={{ width: 56, height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
                  <input type="number" min="0" max="1" step="0.05" className="textarea" value={layer.opacity} onChange={(event) => setLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, opacity: Number(event.target.value) } : item))} style={{ minHeight: 'auto', padding: '12px 14px' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={layer.inset} onChange={(event) => setLayers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, inset: event.target.checked } : item))} />
                    <span className="checkbox-label">Inset</span>
                  </label>
                  <button type="button" className="btn-ghost" onClick={() => setLayers((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} disabled={layers.length <= 1}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setLayers((current) => [...current, { x: 0, y: 6, blur: 16, spread: 0, color: 'rgb(17, 24, 39)', opacity: 0.15, inset: false }])}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
          >
            Add Layer
          </button>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setPreviewBackground(DEFAULT_PREVIEW_BACKGROUND);
        setLayers(DEFAULT_LAYERS);
      }}
      copyValue={output}
      downloadConfig={{
        filename: 'box-shadow.css',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
