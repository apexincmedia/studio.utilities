/**
 * Image Compressor — REFERENCE TOOL #2  (v4)
 *
 * ARCHETYPE: File-upload / File-download
 * Copy this file when building any tool that accepts file uploads and produces
 * downloadable output.
 *
 * Features:
 *   - Per-file compress, retry, and download
 *   - Download All when multiple files are done
 *   - Live estimated output size on quality slider move
 *   - Before/after comparison bar per file
 *   - Canvas API, zero dependencies, 100% client-side
 */

'use client';

import { useState, useCallback } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Button from '@/components/ui/Button';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';

// ── CONSTANTS ─────────────────────────────────────────────────────────
const FORMAT_MIME = {
  original: null,
  jpeg:     'image/jpeg',
  webp:     'image/webp',
  png:      'image/png',
};

const FORMAT_OPTIONS = [
  { value: 'original', label: 'Original',  desc: 'Same as input' },
  { value: 'jpeg',     label: 'JPEG',       desc: 'Best for photos' },
  { value: 'webp',     label: 'WebP',       desc: '~30% smaller than JPEG · best for web' },
  { value: 'png',      label: 'PNG',        desc: 'Lossless · perfect for graphics & text' },
];

const ACCEPTED_FORMATS = ['JPG', 'PNG', 'WebP', 'GIF', 'AVIF', 'HEIC'];

// ── PROCESSING LOGIC ──────────────────────────────────────────────────
async function compressImage(file, { quality, format, maxWidth }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { naturalWidth: w, naturalHeight: h } = img;
      if (maxWidth && w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      const mime = format === 'original' ? (file.type || 'image/jpeg') : FORMAT_MIME[format];
      const q    = mime === 'image/png' ? undefined : quality;

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve({ blob, mime, width: w, height: h });
        },
        mime,
        q
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

function formatBytes(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFilename(name, mime) {
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[mime];
  return ext ? `${name.replace(/\.[^/.]+$/, '')}-compressed.${ext}` : name;
}

function estimateSize(originalSize, quality, format) {
  if (format === 'png')      return originalSize * 0.82;
  if (format === 'original') return originalSize * (quality * 0.88 + 0.08);
  if (format === 'webp')     return originalSize * (quality * 0.60 + 0.04);
  return originalSize * (quality * 0.75 + 0.06);
}

function triggerDownload(url, filename) {
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
}

// ── FILE CARD ─────────────────────────────────────────────────────────
function FileCard({ entry, quality, format, onRemove, onCompressOne, onDownloadOne, disabled }) {
  const { file, thumb, status, result, error, originalSize } = entry;
  const savings  = result ? Math.max(0, Math.round((1 - result.size / originalSize) * 100)) : 0;
  const estBytes = status === 'pending' ? estimateSize(originalSize, quality, format) : null;

  return (
    <div style={{
      background:    'var(--surface)',
      border:        `1px solid ${status === 'error' ? 'var(--error)' : 'var(--border)'}`,
      borderRadius:  'var(--radius-md)',
      padding:       '14px',
      display:       'flex',
      flexDirection: 'column',
      gap:           '10px',
      transition:    'border-color var(--t-base)',
    }}>

      {/* ── Header: thumb + info + remove ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img
          src={thumb}
          alt={file.name}
          style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, background: 'var(--card)', flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filename */}
          <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {file.name}
          </div>

          {/* Size row */}
          {status === 'done' && result ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{formatBytes(originalSize)}</span>
              <Icon icon={ICON_MAP.ArrowRight} size={10} color="var(--faint)" />
              <span style={{ color: 'var(--text)' }}>{formatBytes(result.size)}</span>
              <span style={{
                color: '#4ADE80', background: 'var(--success-bg)', border: '1px solid var(--success)',
                borderRadius: 'var(--radius-pill)', padding: '1px 7px', fontSize: 10,
              }}>
                -{savings}%
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {formatBytes(originalSize)}
              {estBytes && status === 'pending' && (
                <span style={{ color: 'var(--faint)', marginLeft: 6 }}>→ ~{formatBytes(estBytes)} est.</span>
              )}
            </div>
          )}

          {/* Dimensions after */}
          {status === 'done' && result && (
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
              {result.width}×{result.height} · {result.mime.split('/')[1].toUpperCase()}
            </div>
          )}
        </div>

        {/* Status badge + remove button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {status === 'done' && (
            <span style={{ width: 20, height: 20, background: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={ICON_MAP.Check} size={11} color="#4ADE80" />
            </span>
          )}
          {status === 'processing' && <Icon icon={ICON_MAP.Loader2} size={16} color="var(--muted)" className="spin" />}
          {!disabled && (
            <button
              onClick={() => onRemove(entry.id)}
              aria-label="Remove file"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--faint)'}
            >
              <Icon icon={ICON_MAP.X} size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Comparison bar (done state) ── */}
      {status === 'done' && result && (
        <div>
          <div style={{ position: 'relative', height: 4, background: 'var(--card)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--border-hover)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(3, 100 - savings)}%`, background: '#4ADE80', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}

      {/* ── Processing shimmer ── */}
      {status === 'processing' && (
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--surface) 0%, var(--border-hover) 50%, var(--surface) 100%)', backgroundSize: '200% auto', animation: 'shimmer 1.2s linear infinite', borderRadius: 'var(--radius-pill)' }} />
      )}

      {/* ── Error ── */}
      {status === 'error' && error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: '#F87171' }}>
          <Icon icon={ICON_MAP.AlertCircle} size={13} />
          {error}
        </div>
      )}

      {/* ── Per-file actions ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(status === 'pending' || status === 'error') && (
          <button
            className="btn-ghost"
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 11, padding: '7px 12px' }}
            onClick={() => onCompressOne(entry.id)}
            disabled={disabled}
          >
            {status === 'error'
              ? <><Icon icon={ICON_MAP.RotateCw} size={12} /> Retry</>
              : <><Icon icon={ICON_MAP.Zap} size={12} /> Compress</>
            }
          </button>
        )}
        {status === 'done' && result && (
          <button
            className="btn-primary"
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 11, padding: '7px 12px' }}
            onClick={() => onDownloadOne(entry)}
          >
            <Icon icon={ICON_MAP.Download} size={12} />
            Download
          </button>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function ImageCompressor() {
  const [files, setFiles]           = useState([]);
  const [quality, setQuality]       = useState(0.8);
  const [format, setFormat]         = useState('original');
  const [maxWidth, setMaxWidth]     = useState('');
  const [processing, setProcessing] = useState(false);

  // ── Add files ─────────────────────────────────────────────────────
  const handleFiles = useCallback((newFiles) => {
    const entries = newFiles.map((f) => ({
      id:           `${f.name}-${f.lastModified}-${Math.random()}`,
      file:         f,
      thumb:        URL.createObjectURL(f),
      originalSize: f.size,
      status:       'pending',
      result:       null,
      error:        null,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  // ── Remove one ────────────────────────────────────────────────────
  const handleRemove = (id) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.thumb);
        if (entry.result?.url) URL.revokeObjectURL(entry.result.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // ── Core compress logic ───────────────────────────────────────────
  const runCompress = async (entriesToProcess) => {
    const mw = maxWidth ? parseInt(maxWidth, 10) : null;
    for (const entry of entriesToProcess) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'processing', error: null } : f));
      try {
        const { blob, mime, width, height } = await compressImage(entry.file, { quality, format, maxWidth: mw });
        if (entry.result?.url) URL.revokeObjectURL(entry.result.url);
        const resultUrl = URL.createObjectURL(blob);
        setFiles((prev) => prev.map((f) =>
          f.id === entry.id
            ? { ...f, status: 'done', result: { blob, mime, url: resultUrl, size: blob.size, width, height } }
            : f
        ));
      } catch (err) {
        setFiles((prev) => prev.map((f) =>
          f.id === entry.id ? { ...f, status: 'error', error: err.message } : f
        ));
      }
    }
  };

  // ── Compress individual ───────────────────────────────────────────
  const handleCompressOne = async (id) => {
    const entry = files.find((f) => f.id === id);
    if (!entry) return;
    setProcessing(true);
    await runCompress([entry]);
    setProcessing(false);
  };

  // ── Compress all pending ──────────────────────────────────────────
  const handleCompressAll = async () => {
    const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (!pending.length) return;
    setProcessing(true);
    await runCompress(pending);
    setProcessing(false);
  };

  const handleDownloadOne = (entry) => {
    if (!entry.result) return;
    triggerDownload(entry.result.url, getFilename(entry.file.name, entry.result.mime));
  };

  const handleDownloadAll = () => {
    files.filter((f) => f.status === 'done' && f.result).forEach((entry) => {
      triggerDownload(entry.result.url, getFilename(entry.file.name, entry.result.mime));
    });
  };

  const handleReset = () => {
    files.forEach((f) => {
      URL.revokeObjectURL(f.thumb);
      if (f.result?.url) URL.revokeObjectURL(f.result.url);
    });
    setFiles([]);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const pendingCount  = files.filter((f) => f.status === 'pending' || f.status === 'error').length;
  const doneFiles     = files.filter((f) => f.status === 'done');
  const totalBefore   = doneFiles.reduce((s, f) => s + f.originalSize, 0);
  const totalAfter    = doneFiles.reduce((s, f) => s + f.result.size, 0);
  const totalSaved    = totalBefore - totalAfter;
  const totalSavedPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;

  const refFile       = files.find((f) => f.status === 'pending') ?? files[0];
  const estimatedBytes = refFile ? estimateSize(refFile.originalSize, quality, format) : null;

  return (
    <ToolLayout>

      {/* ══ LEFT: Drop zone / file list ══════════════════════════════ */}
      <OutputPanel>
        {files.length === 0 ? (

          /* Empty state */
          <DropZone
            accept="image/*"
            multiple
            onFiles={handleFiles}
            title="Drop images here"
            subtitle="or click to browse"
            icon={<Icon icon={ICON_MAP.Upload} size={36} />}
          >
            <div className="drop-zone-formats">
              {ACCEPTED_FORMATS.map((f) => (
                <span key={f} className="drop-zone-format-pill">{f}</span>
              ))}
            </div>
          </DropZone>

        ) : (

          /* File list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((entry) => (
              <FileCard
                key={entry.id}
                entry={entry}
                quality={quality}
                format={format}
                onRemove={handleRemove}
                onCompressOne={handleCompressOne}
                onDownloadOne={handleDownloadOne}
                disabled={processing}
              />
            ))}

            {/* Add-more strip */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 44, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              cursor: 'pointer', color: 'var(--faint)', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'border-color var(--t-fast), color var(--t-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';       e.currentTarget.style.color = 'var(--faint)'; }}
            >
              <input type="file" accept="image/*" multiple onChange={e => handleFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
              <Icon icon={ICON_MAP.Plus} size={13} />
              Add more images
            </label>
          </div>
        )}
      </OutputPanel>

      {/* ══ RIGHT: Options panel ════════════════════════════════════ */}
      <OptionsPanel>

        {/* ── Summary callout ── */}
        {doneFiles.length > 0 && totalSaved > 0 && (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 18, color: '#4ADE80', marginBottom: 3 }}>
              Saved {formatBytes(totalSaved)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {formatBytes(totalBefore)} → {formatBytes(totalAfter)} · {totalSavedPct}% smaller
              {doneFiles.length > 1 && ` · ${doneFiles.length} files`}
            </div>
          </div>
        )}

        {/* ── Quality ── */}
        <div className="options-label">Compression Quality</div>
        <div className="range-wrap">
          <input
            type="range" min={0.05} max={1.0} step={0.05}
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
          />
          <span className="range-value" style={{ minWidth: 36 }}>{Math.round(quality * 100)}%</span>
        </div>

        {/* Quality hint + live estimate */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 8, marginBottom: 20 }}>
          <span style={{ color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {quality <= 0.3 ? 'Smallest file' : quality <= 0.6 ? 'Balanced' : quality <= 0.85 ? 'Recommended' : 'Near-lossless'}
          </span>
          {estimatedBytes !== null && (
            <span style={{ color: 'var(--text-dim)' }}>~{formatBytes(estimatedBytes)} est.</span>
          )}
        </div>

        <div className="panel-divider" />

        {/* ── Output format ── */}
        <div className="options-label">Output Format</div>
        <div className="radio-group" style={{ marginBottom: 20 }}>
          {FORMAT_OPTIONS.map(({ value, label, desc }) => (
            <label key={value} className="radio-row" style={{ cursor: 'pointer', padding: '6px 0' }}>
              <input
                type="radio" name="img-format"
                value={value} checked={format === value}
                onChange={() => setFormat(value)}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div className="radio-label">{label}</div>
                <div className="radio-desc">{desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="panel-divider" />

        {/* ── Max width ── */}
        <div className="options-label">Max Width (optional)</div>
        <input
          type="number" className="input" placeholder="e.g. 1920"
          value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)}
          style={{ borderRadius: 'var(--radius-md)' }}
          min={1}
        />
        <div style={{ fontSize: 11, color: 'var(--faint)', margin: '6px 0 20px', lineHeight: 1.5 }}>
          Scales down proportionally. Leave blank to keep original dimensions.
        </div>

        <div className="panel-divider" />

        {/* ── Actions ── */}
        {pendingCount > 0 && (
          <Button
            variant="primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 8 }}
            onClick={handleCompressAll}
            disabled={processing}
          >
            {processing
              ? <><Icon icon={ICON_MAP.Loader2} size={14} className="spin" /> Processing...</>
              : <><Icon icon={ICON_MAP.Zap} size={14} /> Compress {pendingCount > 1 ? `All (${pendingCount})` : 'Image'}</>
            }
          </Button>
        )}

        {doneFiles.length > 1 && (
          <Button
            variant="ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 8 }}
            onClick={handleDownloadAll}
            disabled={processing}
          >
            <Icon icon={ICON_MAP.Download} size={14} />
            Download All ({doneFiles.length})
          </Button>
        )}

        {files.length > 0 && (
          <Button
            variant="ghost"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            onClick={handleReset}
            disabled={processing}
          >
            <Icon icon={ICON_MAP.Trash2} size={13} />
            Clear All
          </Button>
        )}

        <div className="privacy-note">
          100% client-side · images never leave your device
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
