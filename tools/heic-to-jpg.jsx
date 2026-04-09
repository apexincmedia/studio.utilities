'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

function getEntryId(file) {
  return `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

function getOutputName(name, format) {
  const base = name.replace(/\.[^/.]+$/, '');
  return `${base}-converted.${format === 'jpeg' ? 'jpg' : 'png'}`;
}

function isHeicFile(file) {
  return (
    file.type.includes('heic') ||
    file.type.includes('heif') ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

function HeicFileCard({ entry, onRetry, onRemove, onDownload, disabled }) {
  return (
    <div
      style={{
        border: `1px solid ${entry.status === 'error' ? 'var(--error)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {entry.result?.url ? (
            <img
              src={entry.result.url}
              alt={entry.file.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Icon icon={ICON_MAP.FileImage} size={22} color="var(--text-dim)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text)',
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {entry.file.name}
          </div>

          {entry.result ? (
            <div style={{ fontSize: 12, color: 'var(--text)' }}>
              {formatBytes(entry.originalSize)} {'->'} {formatBytes(entry.result.size)}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatBytes(entry.originalSize)}</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          disabled={disabled}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--faint)',
            padding: 4,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Icon icon={ICON_MAP.X} size={14} />
        </button>
      </div>

      {entry.error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--error-bg)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--error)',
          }}
        >
          <Icon icon={ICON_MAP.AlertCircle} size={13} />
          {entry.error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8 }}>
        {(entry.status === 'pending' || entry.status === 'error') ? (
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onRetry(entry.id)}
            disabled={disabled}
          >
            <Icon icon={entry.status === 'error' ? ICON_MAP.RotateCw : ICON_MAP.Zap} size={12} />
            {entry.status === 'error' ? 'Retry' : 'Convert'}
          </button>
        ) : null}

        {entry.status === 'processing' ? (
          <div
            style={{
              flex: 1,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <Icon icon={ICON_MAP.Loader2} size={14} className="spin" />
            Processing...
          </div>
        ) : null}

        {entry.result ? (
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onDownload(entry)}
          >
            <Icon icon={ICON_MAP.Download} size={12} />
            Download
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function HeicToJpg() {
  const [entries, setEntries] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    format: 'jpeg',
    quality: 0.85,
  });

  const handleFiles = (files) => {
    const nextEntries = files.map((file) => ({
      id: getEntryId(file),
      file,
      originalSize: file.size,
      status: 'pending',
      error: isHeicFile(file) ? null : 'This file does not look like a HEIC/HEIF image.',
      result: null,
    }));

    setEntries((current) => [...current, ...nextEntries]);
  };

  const convertEntry = async (entry) => {
    const [{ default: heic2any }] = await Promise.all([import('heic2any')]);
    const converted = await heic2any({
      blob: entry.file,
      toType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality: options.quality,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;

    if (!(blob instanceof Blob)) {
      throw new Error('The HEIC file could not be converted.');
    }

    return {
      blob,
      url: URL.createObjectURL(blob),
      size: blob.size,
      format: options.format,
    };
  };

  const runEntries = async (targetEntries) => {
    for (const entry of targetEntries) {
      if (!isHeicFile(entry.file)) {
        continue;
      }

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: 'processing', error: null } : item
        )
      );

      try {
        const result = await convertEntry(entry);
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: 'done', result } : item
          )
        );
      } catch (convertError) {
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: 'error',
                  error: convertError.message || 'Unable to convert that HEIC file.',
                }
              : item
          )
        );
      }
    }
  };

  const handleConvertAll = async () => {
    const targetEntries = entries.filter(
      (entry) => (entry.status === 'pending' || entry.status === 'error') && isHeicFile(entry.file)
    );

    if (!targetEntries.length) return;

    setProcessing(true);
    setError(null);

    try {
      await runEntries(targetEntries);
    } catch (batchError) {
      setError(batchError.message || 'Unable to convert the selected files.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryOne = async (id) => {
    const entry = entries.find((item) => item.id === id);
    if (!entry) return;
    setProcessing(true);
    setError(null);
    await runEntries([entry]);
    setProcessing(false);
  };

  const handleRemove = (id) => {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry?.result?.url) {
        URL.revokeObjectURL(entry.result.url);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleClear = () => {
    entries.forEach((entry) => {
      if (entry.result?.url) {
        URL.revokeObjectURL(entry.result.url);
      }
    });
    setEntries([]);
    setError(null);
  };

  const doneEntries = entries.filter((entry) => entry.result);
  const totalBefore = doneEntries.reduce((sum, entry) => sum + entry.originalSize, 0);
  const totalAfter = doneEntries.reduce((sum, entry) => sum + entry.result.size, 0);
  const pendingCount = entries.filter((entry) => entry.status === 'pending' || entry.status === 'error').length;

  const summaryItems = useMemo(
    () => [
      {
        label: 'Converted',
        value: String(doneEntries.length),
        description: 'HEIC files finished in this batch',
        iconName: 'CheckCircle2',
      },
      {
        label: 'Output',
        value: doneEntries.length ? `${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)}` : options.format.toUpperCase(),
        description: doneEntries.length ? 'Before and after output size' : 'Current target format',
        tone: doneEntries.length ? 'success' : 'default',
        iconName: 'FileImage',
      },
    ],
    [doneEntries.length, options.format, totalAfter, totalBefore]
  );

  return (
    <ToolLayout>
      <OutputPanel>
        {!entries.length ? (
          <DropZone
            accept=".heic,.heif,image/heic,image/heif"
            multiple
            onFiles={handleFiles}
            title="Drop HEIC images to convert"
            subtitle="Convert iPhone HEIC and HEIF files into JPG or PNG locally in your browser."
            icon={<Icon icon={ICON_MAP.FileImage} size={30} />}
          >
            <div className="drop-zone-formats">
              {['HEIC', 'HEIF'].map((format) => (
                <span key={format} className="drop-zone-format-pill">
                  {format}
                </span>
              ))}
            </div>
          </DropZone>
        ) : (
          <>
            <MetricGrid items={summaryItems} columns="repeat(2, minmax(0, 1fr))" marginBottom={16} />
            <ErrorCallout message={error} />

            <div style={{ display: 'grid', gap: 10 }}>
              {entries.map((entry) => (
                <HeicFileCard
                  key={entry.id}
                  entry={entry}
                  onRetry={handleRetryOne}
                  onRemove={handleRemove}
                  onDownload={(item) => downloadBlob(item.result.blob, getOutputName(item.file.name, item.result.format))}
                  disabled={processing}
                />
              ))}
            </div>
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Output Format</div>
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          {[
            ['jpeg', 'JPG'],
            ['png', 'PNG'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mode-btn${options.format === value ? ' active' : ''}`}
              onClick={() => setOptions((current) => ({ ...current, format: value }))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="options-label">Quality</div>
        <div className="range-wrap" style={{ marginBottom: 20 }}>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={options.quality}
            onChange={(event) => setOptions((current) => ({ ...current, quality: Number(event.target.value) }))}
            disabled={options.format !== 'jpeg'}
          />
          <span className="range-value">{Math.round(options.quality * 100)}%</span>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleConvertAll}
          disabled={!pendingCount || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Converting...' : `Convert ${pendingCount > 1 ? `All (${pendingCount})` : 'File'}`}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() =>
            doneEntries.forEach((entry) =>
              downloadBlob(entry.result.blob, getOutputName(entry.file.name, entry.result.format))
            )
          }
          disabled={!doneEntries.length}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download All
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!entries.length}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>

        <div className="privacy-note">
          HEIC conversion is memory-intensive for large files, so this tool processes the batch sequentially to stay stable.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
