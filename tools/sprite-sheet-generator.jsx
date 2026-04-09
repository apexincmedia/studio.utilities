'use client';

import { useCallback, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, downloadText, useCopyState } from '@/lib/tool-utils';
import { ErrorCallout, EmptyState, MetricGrid } from '@/tools/_shared/text-tool-kit';
import { cleanupImageEntries } from '@/tools/_shared/image-batch-tool';
import {
  canvasToBlob,
  createCanvas,
  createImageEntries,
  loadImageFromFile,
} from '@/lib/image-tool-utils';

const COLUMN_OPTIONS = [
  ['auto', 'Auto'],
  ['2', '2 columns'],
  ['4', '4 columns'],
  ['6', '6 columns'],
];

const SCALE_OPTIONS = [
  ['1', '1x'],
  ['2', '2x'],
  ['3', '3x'],
];

function slugifyName(name) {
  return name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sprite';
}

function getColumnCount(mode, total) {
  if (!total) return 0;
  if (mode === 'auto') {
    return Math.max(1, Math.ceil(Math.sqrt(total)));
  }

  return Math.max(1, Number.parseInt(mode, 10) || 1);
}

function buildSpriteCss(items) {
  const blocks = [
    '.sprite {',
    "  background-image: url('sprite-sheet.png');",
    '  background-repeat: no-repeat;',
    '  display: inline-block;',
    '}',
  ];

  items.forEach((item) => {
    blocks.push(
      [
        `.sprite-${item.className} {`,
        `  width: ${item.width}px;`,
        `  height: ${item.height}px;`,
        `  background-position: -${item.x}px -${item.y}px;`,
        '}',
      ].join('\n')
    );
  });

  return blocks.join('\n\n');
}

async function buildSpriteSheet(entries, options) {
  const loaded = [];

  try {
    for (const entry of entries) {
      const imageAsset = await loadImageFromFile(entry.file);
      loaded.push({ ...imageAsset, file: entry.file });
    }

    const scale = Math.max(1, Number.parseInt(options.scale, 10) || 1);
    const padding = Math.max(0, Number.parseInt(options.padding, 10) || 0);
    const columns = getColumnCount(options.columns, loaded.length);
    const rows = Math.ceil(loaded.length / columns);
    const items = loaded.map(({ image, file }) => ({
      fileName: file.name,
      className: slugifyName(file.name),
      width: Math.max(1, Math.round(image.naturalWidth * scale)),
      height: Math.max(1, Math.round(image.naturalHeight * scale)),
      image,
    }));

    const cellWidth = Math.max(...items.map((item) => item.width));
    const cellHeight = Math.max(...items.map((item) => item.height));
    const sheetWidth = cellWidth * columns + padding * Math.max(0, columns - 1);
    const sheetHeight = cellHeight * rows + padding * Math.max(0, rows - 1);

    if (sheetWidth > 16384 || sheetHeight > 16384) {
      throw new Error('That sprite sheet would exceed common browser canvas limits. Reduce the scale or upload fewer images.');
    }

    const canvas = createCanvas(sheetWidth, sheetHeight);
    const context = canvas.getContext('2d');

    const spriteItems = items.map((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellX = column * (cellWidth + padding);
      const cellY = row * (cellHeight + padding);
      const x = cellX + Math.round((cellWidth - item.width) / 2);
      const y = cellY + Math.round((cellHeight - item.height) / 2);

      context.drawImage(item.image, x, y, item.width, item.height);

      return {
        fileName: item.fileName,
        className: item.className,
        width: item.width,
        height: item.height,
        x,
        y,
      };
    });

    const blob = await canvasToBlob(canvas, 'image/png');
    const css = buildSpriteCss(spriteItems);

    return {
      blob,
      url: URL.createObjectURL(blob),
      size: blob.size,
      css,
      items: spriteItems,
      columns,
      rows,
      width: sheetWidth,
      height: sheetHeight,
    };
  } finally {
    loaded.forEach((item) => item.revoke());
  }
}

export default function SpriteSheetGenerator() {
  const [entries, setEntries] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, copy] = useCopyState();
  const [options, setOptions] = useState({
    columns: 'auto',
    padding: '16',
    scale: '1',
  });

  const resetResult = useCallback(() => {
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }, []);

  const handleFiles = useCallback(async (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const nextEntries = await createImageEntries(imageFiles);

    resetResult();
    setError(null);
    setEntries((current) => [...current, ...nextEntries]);
  }, [resetResult]);

  const handleRemove = (id) => {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry) {
        cleanupImageEntries([entry]);
      }
      return current.filter((item) => item.id !== id);
    });
    resetResult();
  };

  const handleGenerate = async () => {
    if (!entries.length) return;

    setProcessing(true);
    setError(null);
    resetResult();

    try {
      const generated = await buildSpriteSheet(entries, options);
      setResult(generated);
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate the sprite sheet.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    cleanupImageEntries(entries);
    resetResult();
    setEntries([]);
    setProcessing(false);
    setError(null);
    setOptions({
      columns: 'auto',
      padding: '16',
      scale: '1',
    });
  };

  const pendingLayout = useMemo(() => {
    const count = entries.length;
    const columns = getColumnCount(options.columns, count);
    const rows = columns ? Math.ceil(count / columns) : 0;

    return { columns, rows };
  }, [entries.length, options.columns]);

  return (
    <ToolLayout>
      <OutputPanel>
        {!entries.length ? (
          <DropZone
            accept="image/*"
            multiple
            onFiles={handleFiles}
            title="Drop images to build a sprite sheet"
            subtitle="Pack multiple images into one PNG and export matching CSS background-position rules."
            icon={<Icon icon={ICON_MAP.Layers} size={30} />}
          />
        ) : (
          <>
            <MetricGrid
              items={[
                {
                  label: 'Frames',
                  value: String(entries.length),
                  description: 'Images queued for packing',
                  iconName: 'Image',
                },
                {
                  label: 'Grid',
                  value: result ? `${result.columns} x ${result.rows}` : `${pendingLayout.columns} x ${pendingLayout.rows}`,
                  description: result ? `${result.width} x ${result.height} output` : 'Planned sheet layout',
                  tone: result ? 'success' : 'default',
                  iconName: 'Layers',
                },
                {
                  label: 'Scale',
                  value: `${options.scale}x`,
                  description: `${options.padding}px gap between cells`,
                  iconName: 'Maximize2',
                },
              ]}
              columns="repeat(3, minmax(0, 1fr))"
              marginBottom={16}
            />

            <ErrorCallout message={error} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                marginBottom: result ? 16 : 0,
              }}
            >
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 112,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={entry.thumb}
                      alt={entry.file.name}
                      style={{ maxWidth: '100%', maxHeight: 112, objectFit: 'contain', display: 'block' }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 4,
                      }}
                    >
                      {entry.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {slugifyName(entry.file.name)}
                      {entry.dimensions ? ` · ${entry.dimensions.width}x${entry.dimensions.height}` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleRemove(entry.id)}
                    disabled={processing}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {!result ? (
              <EmptyState
                iconName="Layers"
                title="Generate the combined sprite sheet"
                message="Tune the grid, padding, and scale in the options panel, then build one PNG plus ready-to-paste CSS classes."
              />
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
                    Sprite Sheet Preview
                  </div>
                  <img
                    src={result.url}
                    alt="Generated sprite sheet preview"
                    style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
                    {result.width} x {result.height} · {result.items.length} sprites · {result.size.toLocaleString()} bytes
                  </div>
                </div>

                <div className="panel-label">Generated CSS</div>
                <textarea
                  className="textarea"
                  value={result.css}
                  readOnly
                  style={{ minHeight: 220 }}
                />
              </>
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Columns</div>
        <select
          className="input"
          value={options.columns}
          onChange={(event) => {
            resetResult();
            setOptions((current) => ({ ...current, columns: event.target.value }));
          }}
          style={{ marginBottom: 16 }}
        >
          {COLUMN_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="options-label">Padding (px)</div>
        <input
          type="number"
          className="input"
          min="0"
          max="128"
          value={options.padding}
          onChange={(event) => {
            resetResult();
            setOptions((current) => ({ ...current, padding: event.target.value }));
          }}
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">Output Scale</div>
        <select
          className="input"
          value={options.scale}
          onChange={(event) => {
            resetResult();
            setOptions((current) => ({ ...current, scale: event.target.value }));
          }}
          style={{ marginBottom: 20 }}
        >
          {SCALE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          CSS classes are named from the original filenames, and the sprite sheet is generated entirely in your browser.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleGenerate}
          disabled={!entries.length || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Generating...' : result ? 'Regenerate Sheet' : 'Generate Sheet'}
        </button>

        <button
          type="button"
          className={`copy-btn${copied ? ' copied' : ''}`}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => copy(result?.css || '')}
          disabled={!result?.css}
        >
          <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
          {copied ? 'Copied' : 'Copy CSS'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadText(result.css, 'sprite-sheet.css', 'text/css;charset=utf-8')}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download CSS
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, 'sprite-sheet.png')}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.FileImage} size={14} />
          Download PNG
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!entries.length && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
