'use client';

import { useMemo, useState } from 'react';
import {
  EmptyState,
  MetricGrid,
  TextGeneratorTool,
} from '@/tools/_shared/text-tool-kit';

export default function CssFlexboxGenerator() {
  const [childCount, setChildCount] = useState(4);
  const [showChildPanel, setShowChildPanel] = useState(true);
  const [container, setContainer] = useState({
    direction: 'row',
    wrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'stretch',
    gap: 16,
  });
  const [child, setChild] = useState({
    grow: 1,
    shrink: 1,
    basis: '120px',
    alignSelf: 'auto',
  });

  const output = useMemo(() => {
    const containerCss = [
      '.container {',
      '  display: flex;',
      `  flex-direction: ${container.direction};`,
      `  flex-wrap: ${container.wrap};`,
      `  justify-content: ${container.justifyContent};`,
      `  align-items: ${container.alignItems};`,
      `  align-content: ${container.alignContent};`,
      `  gap: ${container.gap}px;`,
      '}',
    ];

    if (!showChildPanel) {
      return containerCss.join('\n');
    }

    return [
      ...containerCss,
      '',
      '.container > .item:first-child {',
      `  flex-grow: ${child.grow};`,
      `  flex-shrink: ${child.shrink};`,
      `  flex-basis: ${child.basis};`,
      `  align-self: ${child.alignSelf};`,
      '}',
    ].join('\n');
  }, [child, container, showChildPanel]);

  return (
    <TextGeneratorTool
      output={output}
      showEmptyState={false}
      emptyState={
        <EmptyState
          iconName="Layers"
          title="Visualize flexbox container and child settings"
          message="Tune layout properties and copy the generated CSS while watching the live flex preview update."
        />
      }
      outputRenderer={
        <>
          <MetricGrid
            items={[
              {
                label: 'Children',
                value: String(childCount),
                description: 'Demo items in the preview area',
                iconName: 'Layers',
              },
            ]}
            columns="1fr"
            marginBottom={16}
          />

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              marginBottom: 16,
              minHeight: 280,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: container.direction,
                flexWrap: container.wrap,
                justifyContent: container.justifyContent,
                alignItems: container.alignItems,
                alignContent: container.alignContent,
                gap: `${container.gap}px`,
                minHeight: 220,
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              {Array.from({ length: childCount }, (_, index) => (
                <div
                  key={`item-${index + 1}`}
                  style={{
                    width: 72,
                    minHeight: 72,
                    borderRadius: 'var(--radius-md)',
                    background: index === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: index === 0 ? 'var(--text)' : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    flexGrow: showChildPanel && index === 0 ? child.grow : 0,
                    flexShrink: showChildPanel && index === 0 ? child.shrink : 1,
                    flexBasis: showChildPanel && index === 0 ? child.basis : '72px',
                    alignSelf: showChildPanel && index === 0 ? child.alignSelf : 'auto',
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="panel-label">CSS Output</div>
          <textarea className="textarea" value={output} readOnly style={{ minHeight: 180 }} />
        </>
      }
      options={
        <>
          <div className="options-label">Direction</div>
          <select className="textarea" value={container.direction} onChange={(event) => setContainer((current) => ({ ...current, direction: event.target.value }))} style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}>
            <option value="row">row</option>
            <option value="column">column</option>
            <option value="row-reverse">row-reverse</option>
            <option value="column-reverse">column-reverse</option>
          </select>

          <div className="options-label">Wrap</div>
          <select className="textarea" value={container.wrap} onChange={(event) => setContainer((current) => ({ ...current, wrap: event.target.value }))} style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}>
            <option value="nowrap">nowrap</option>
            <option value="wrap">wrap</option>
            <option value="wrap-reverse">wrap-reverse</option>
          </select>

          {[
            ['justifyContent', 'Justify Content', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']],
            ['alignItems', 'Align Items', ['stretch', 'flex-start', 'center', 'flex-end', 'baseline']],
            ['alignContent', 'Align Content', ['stretch', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around']],
          ].map(([key, label, options]) => (
            <div key={key}>
              <div className="options-label">{label}</div>
              <select className="textarea" value={container[key]} onChange={(event) => setContainer((current) => ({ ...current, [key]: event.target.value }))} style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }}>
                {options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="options-label">Gap</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input type="range" min="0" max="48" value={container.gap} onChange={(event) => setContainer((current) => ({ ...current, gap: Number(event.target.value) }))} />
            <span className="range-value">{container.gap}px</span>
          </div>

          <div className="options-label">Demo Children</div>
          <div className="range-wrap" style={{ marginBottom: 16 }}>
            <input type="range" min="1" max="6" value={childCount} onChange={(event) => setChildCount(Number(event.target.value))} />
            <span className="range-value">{childCount}</span>
          </div>

          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={showChildPanel} onChange={(event) => setShowChildPanel(event.target.checked)} />
            <span className="checkbox-label">Show first-child flex properties</span>
          </label>

          {showChildPanel ? (
            <>
              <div className="options-label">First Child Basis</div>
              <input type="text" className="textarea" value={child.basis} onChange={(event) => setChild((current) => ({ ...current, basis: event.target.value }))} style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 12 }} />

              <div className="options-label">Grow / Shrink</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
                <input type="number" className="textarea" value={child.grow} onChange={(event) => setChild((current) => ({ ...current, grow: Number(event.target.value) }))} style={{ minHeight: 'auto', padding: '12px 14px' }} />
                <input type="number" className="textarea" value={child.shrink} onChange={(event) => setChild((current) => ({ ...current, shrink: Number(event.target.value) }))} style={{ minHeight: 'auto', padding: '12px 14px' }} />
              </div>

              <div className="options-label">Align Self</div>
              <select className="textarea" value={child.alignSelf} onChange={(event) => setChild((current) => ({ ...current, alignSelf: event.target.value }))} style={{ minHeight: 'auto', padding: '12px 14px', marginBottom: 16 }}>
                <option value="auto">auto</option>
                <option value="stretch">stretch</option>
                <option value="flex-start">flex-start</option>
                <option value="center">center</option>
                <option value="flex-end">flex-end</option>
              </select>
            </>
          ) : null}

          <div className="panel-divider" />
        </>
      }
      onClear={() => {
        setChildCount(4);
        setShowChildPanel(true);
        setContainer({
          direction: 'row',
          wrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'stretch',
          gap: 16,
        });
        setChild({
          grow: 1,
          shrink: 1,
          basis: '120px',
          alignSelf: 'auto',
        });
      }}
      copyValue={output}
      downloadConfig={{
        filename: 'flexbox.css',
        mimeType: 'text/plain;charset=utf-8',
        text: output,
        enabled: Boolean(output),
      }}
    />
  );
}
