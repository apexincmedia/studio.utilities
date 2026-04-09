'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';
import { getColorFormats, parseColorInput } from '@/lib/color-utils';

const DEFAULT_STOPS = [
  { color: 'rgb(31, 111, 235)', position: 0 },
  { color: 'rgb(6, 182, 212)', position: 100 },
];

function getPickerValue(color, fallback = 'rgb(255, 255, 255)') {
  return getColorFormats(parseColorInput(color) ?? parseColorInput(fallback)).hex;
}

function buildGradientValue({ type, angle, repeat, stops }) {
  const fn = `${repeat ? 'repeating-' : ''}${type}-gradient`;
  const stopList = stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');

  if (type === 'radial') {
    return `${fn}(circle, ${stopList})`;
  }

  if (type === 'conic') {
    return `${fn}(from ${angle}deg, ${stopList})`;
  }

  return `${fn}(${angle}deg, ${stopList})`;
}

export default function CssGradientGenerator() {
  const [type, setType] = useState('linear');
  const [angle, setAngle] = useState(90);
  const [repeat, setRepeat] = useState(false);
  const [stops, setStops] = useState(DEFAULT_STOPS);

  const gradientValue = useMemo(
    () => buildGradientValue({ type, angle, repeat, stops }),
    [angle, repeat, stops, type]
  );
  const output = `background: ${gradientValue};`;

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={!stops.length}
      emptyState={
        <EmptyState
          iconName="Layers"
          title="Build CSS gradients visually"
          message="Choose a gradient type, tune the angle, and edit color stops to generate a copy-ready CSS background value."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Type',
                value: `${repeat ? 'Repeating ' : ''}${type}`,
                description: 'Current gradient family',
                iconName: 'Layers',
              },
              {
                label: 'Stops',
                value: String(stops.length),
                description: 'Color stops included in the gradient',
                iconName: 'Eye',
              },
            ]}
            columns="repeat(2, minmax(0, 1fr))"
            marginBottom={16}
          />

          <div
            style={{
              height: 220,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: gradientValue,
              marginBottom: 16,
            }}
          />

          <div className="panel-label">CSS Output</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 140 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Gradient Type</div>
          <div className="mode-toggle" style={{ marginBottom: 16 }}>
            {[
              ['linear', 'Linear'],
              ['radial', 'Radial'],
              ['conic', 'Conic'],
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

          <div className="options-label">Angle</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input type="range" min="0" max="360" value={angle} onChange={(event) => setAngle(Number(event.target.value))} />
            <span className="range-value">{angle}deg</span>
          </div>

          <label className="checkbox-row" style={{ marginBottom: 20 }}>
            <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />
            <span className="checkbox-label">Use repeating gradient</span>
          </label>

          <div className="options-label">Color Stops</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {stops.map((stop, index) => (
              <div
                key={`${stop.color}-${index}`}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={getPickerValue(stop.color)} onChange={(event) => setStops((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} style={{ width: 56, height: 42, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }} />
                  <input type="number" className="textarea" value={stop.position} min="0" max="100" onChange={(event) => setStops((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, position: Number(event.target.value) } : item))} style={{ minHeight: 'auto', padding: '12px 14px' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-ghost" onClick={() => setStops((current) => index > 0 ? current.map((item, itemIndex) => itemIndex === index - 1 ? current[index] : itemIndex === index ? current[index - 1] : item) : current)} disabled={index === 0}>Up</button>
                  <button type="button" className="btn-ghost" onClick={() => setStops((current) => index < current.length - 1 ? current.map((item, itemIndex) => itemIndex === index + 1 ? current[index] : itemIndex === index ? current[index + 1] : item) : current)} disabled={index === stops.length - 1}>Down</button>
                  <button type="button" className="btn-ghost" onClick={() => setStops((current) => current.length > 2 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} disabled={stops.length <= 2}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (stops.length >= 10) return;
              setStops((current) => [...current, { color: 'rgb(255, 255, 255)', position: 100 }]);
            }}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
            disabled={stops.length >= 10}
          >
            Add Stop
          </button>

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setType('linear');
        setAngle(90);
        setRepeat(false);
        setStops(DEFAULT_STOPS);
      }}
      copyValue={output}
      downloadConfig={{
        filename: 'gradient.css',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
