'use client';

import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { formatBytes } from '@/lib/tool-utils';
import { cleanupImageEntry, getSavingsPercent } from '@/lib/image-tool-utils';

export function ImageBatchFileCard({
  entry,
  actionLabel = 'Process',
  onRemove,
  onProcessOne,
  onDownloadOne,
  disabled = false,
  detailRenderer,
}) {
  const savings = entry.result?.size
    ? getSavingsPercent(entry.originalSize, entry.result.size)
    : 0;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${entry.status === 'error' ? 'var(--error)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img
          src={entry.thumb}
          alt={entry.file.name}
          style={{
            width: 56,
            height: 56,
            objectFit: 'cover',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 4,
            }}
          >
            {entry.file.name}
          </div>

          {entry.status === 'done' && entry.result ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>
                {formatBytes(entry.originalSize)}
              </span>
              <Icon icon={ICON_MAP.ArrowRight} size={10} color="var(--faint)" />
              <span style={{ color: 'var(--text)' }}>{formatBytes(entry.result.size)}</span>
              {savings > 0 ? (
                <span
                  style={{
                    color: 'var(--success)',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '1px 7px',
                    fontSize: 10,
                  }}
                >
                  -{savings}%
                </span>
              ) : null}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {formatBytes(entry.originalSize)}
            </div>
          )}

          {entry.dimensions ? (
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>
              {entry.dimensions.width}x{entry.dimensions.height}
              {entry.result?.width && entry.result?.height
                ? ` -> ${entry.result.width}x${entry.result.height}`
                : ''}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {entry.status === 'done' ? (
            <span
              style={{
                width: 20,
                height: 20,
                background: 'var(--success-bg)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon={ICON_MAP.Check} size={11} color="var(--success)" />
            </span>
          ) : null}

          {entry.status === 'processing' ? (
            <Icon icon={ICON_MAP.Loader2} size={16} className="spin" color="var(--muted)" />
          ) : null}

          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: 'var(--faint)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon icon={ICON_MAP.X} size={14} />
          </button>
        </div>
      </div>

      {entry.status === 'error' && entry.error ? (
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

      {detailRenderer ? detailRenderer(entry) : null}

      <div style={{ display: 'flex', gap: 8 }}>
        {(entry.status === 'pending' || entry.status === 'error') && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onProcessOne(entry.id)}
            disabled={disabled}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon icon={entry.status === 'error' ? ICON_MAP.RotateCw : ICON_MAP.Zap} size={12} />
            {entry.status === 'error' ? 'Retry' : actionLabel}
          </button>
        )}

        {entry.status === 'done' && entry.result ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => onDownloadOne(entry)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon icon={ICON_MAP.Download} size={12} />
            Download
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ImageBatchOutputPanel({
  files,
  onFiles,
  onRemove,
  onProcessOne,
  onDownloadOne,
  processing = false,
  acceptedFormats = ['JPG', 'PNG', 'WebP'],
  accept = 'image/*',
  emptyTitle = 'Drop images here',
  emptySubtitle = 'or click to browse',
  actionLabel = 'Process',
  detailRenderer,
}) {
  if (!files.length) {
    return (
      <DropZone
        accept={accept}
        multiple
        onFiles={onFiles}
        title={emptyTitle}
        subtitle={emptySubtitle}
        icon={<Icon icon={ICON_MAP.Upload} size={36} />}
      >
        <div className="drop-zone-formats">
          {acceptedFormats.map((format) => (
            <span key={format} className="drop-zone-format-pill">
              {format}
            </span>
          ))}
        </div>
      </DropZone>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {files.map((entry) => (
        <ImageBatchFileCard
          key={entry.id}
          entry={entry}
          actionLabel={actionLabel}
          onRemove={onRemove}
          onProcessOne={onProcessOne}
          onDownloadOne={onDownloadOne}
          disabled={processing}
          detailRenderer={detailRenderer}
        />
      ))}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 44,
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          color: 'var(--faint)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
          style={{ display: 'none' }}
        />
        <Icon icon={ICON_MAP.Plus} size={13} />
        Add more images
      </label>
    </div>
  );
}

export function cleanupImageEntries(entries = []) {
  entries.forEach((entry) => cleanupImageEntry(entry));
}
