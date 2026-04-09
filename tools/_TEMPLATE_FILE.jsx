/**
 * ─────────────────────────────────────────────────────────────────────
 * [TOOL NAME] — FILE ARCHETYPE TEMPLATE
 * ─────────────────────────────────────────────────────────────────────
 *
 * ARCHETYPE: File-in / File-out
 * Use for: converters, compressors, editors, extractors, any tool that
 * accepts file uploads and produces downloadable output.
 *
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────
 * 1. Replace every [PLACEHOLDER] with real values.
 * 2. Implement processFile() with your tool's actual logic.
 * 3. Adjust accepted formats, options, and output filename logic.
 * 4. Remove this comment block before shipping.
 *
 * DO NOT
 * ──────
 * ✗ Hardcode any hex colors — use CSS custom properties
 * ✗ Import icons directly from lucide-react — use ICON_MAP
 * ✗ Use Tailwind — use the CSS classes from styles/globals.css
 * ✗ Make server calls — all logic must be 100% client-side
 * ✗ Change the ToolLayout / OutputPanel / OptionsPanel structure
 *
 * See docs/CODEX_PLAYBOOK.md for the full guide.
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useCallback } from 'react';
import ToolLayout  from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Button      from '@/components/ui/Button';
import DropZone    from '@/components/ui/DropZone';
import Icon        from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { formatBytes, downloadBlob } from '@/lib/tool-utils';

// ── CONSTANTS ─────────────────────────────────────────────────────────
// TODO: update to match your tool's accepted and output formats
const ACCEPTED_FORMATS = ['JPG', 'PNG', 'WebP'];  // shown in drop zone
const ACCEPT_MIME      = 'image/*';                // passed to <input accept>

// ── PROCESSING LOGIC ─────────────────────────────────────────────────
// Replace this with your tool's actual logic.
// Must return { blob: Blob, extension: string, width?: number, height?: number }
// Throw an Error with a user-friendly message on failure.

async function processFile(file, options) {
  // TODO: implement
  // options is the full options state object
  throw new Error('Not implemented yet');
}

// ── OUTPUT FILENAME ───────────────────────────────────────────────────
function getOutputFilename(originalName, extension) {
  const base = originalName.replace(/\.[^/.]+$/, '');
  return `${base}-output.${extension}`;  // TODO: adjust suffix
}

// ── FILE CARD ─────────────────────────────────────────────────────────
// Per-file card showing status, comparison, and download button.
function FileCard({ entry, onRemove, onProcessOne, onDownloadOne, disabled }) {
  const { file, status, result, error, originalSize } = entry;
  const savings = result?.size
    ? Math.max(0, Math.round((1 - result.size / originalSize) * 100))
    : 0;

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${status === 'error' ? 'var(--error)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', padding: '14px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'border-color var(--t-base)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Thumbnail — remove if not an image tool */}
        {entry.thumb && (
          <img src={entry.thumb} alt={file.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, background: 'var(--card)', flexShrink: 0 }} />
        )}

        {/* No thumbnail — use generic icon instead */}
        {!entry.thumb && (
          <div style={{ width: 52, height: 52, background: 'var(--card)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon icon={ICON_MAP.FileImage} size={22} color="var(--text-dim)" />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {file.name}
          </div>
          {status === 'done' && result ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{formatBytes(originalSize)}</span>
              <Icon icon={ICON_MAP.ArrowRight} size={10} color="var(--faint)" />
              <span style={{ color: 'var(--text)' }}>{formatBytes(result.size)}</span>
              {savings > 0 && (
                <span style={{ color: '#4ADE80', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius-pill)', padding: '1px 7px', fontSize: 10 }}>
                  -{savings}%
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatBytes(originalSize)}</div>
          )}
          {status === 'done' && result?.label && (
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{result.label}</div>
          )}
        </div>

        {/* Status icon + remove */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {status === 'done' && (
            <span style={{ width: 20, height: 20, background: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={ICON_MAP.Check} size={11} color="#4ADE80" />
            </span>
          )}
          {status === 'processing' && <Icon icon={ICON_MAP.Loader2} size={16} color="var(--muted)" className="spin" />}
          {!disabled && (
            <button onClick={() => onRemove(entry.id)} aria-label="Remove"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--faint)'}
            >
              <Icon icon={ICON_MAP.X} size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Comparison bar (done state) */}
      {status === 'done' && savings > 0 && (
        <div style={{ position: 'relative', height: 4, background: 'var(--card)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--border-hover)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(3, 100 - savings)}%`, background: '#4ADE80', transition: 'width 0.6s ease' }} />
        </div>
      )}

      {/* Processing shimmer */}
      {status === 'processing' && (
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--surface) 0%, var(--border-hover) 50%, var(--surface) 100%)', backgroundSize: '200% auto', animation: 'shimmer 1.2s linear infinite', borderRadius: 'var(--radius-pill)' }} />
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: '#F87171' }}>
          <Icon icon={ICON_MAP.AlertCircle} size={13} />
          {error}
        </div>
      )}

      {/* Per-file actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(status === 'pending' || status === 'error') && (
          <button className="btn-ghost"
            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 11, padding: '7px 12px' }}
            onClick={() => onProcessOne(entry.id)} disabled={disabled}
          >
            {status === 'error'
              ? <><Icon icon={ICON_MAP.RotateCw} size={12} /> Retry</>
              : <><Icon icon={ICON_MAP.Zap} size={12} /> Convert</>  // TODO: rename verb
            }
          </button>
        )}
        {status === 'done' && result && (
          <button className="btn-primary"
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
export default function ToolNameHere() {  // TODO: rename component
  const [files, setFiles]       = useState([]);
  const [processing, setProcessing] = useState(false);

  // ── Tool-specific options — add your own ──────────────────────────
  // const [quality, setQuality] = useState(0.8);
  // const [format,  setFormat]  = useState('jpeg');

  // ── Add files ─────────────────────────────────────────────────────
  const handleFiles = useCallback((newFiles) => {
    const entries = newFiles.map((f) => ({
      id:           `${f.name}-${f.lastModified}-${Math.random()}`,
      file:         f,
      thumb:        f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      originalSize: f.size,
      status:       'pending',
      result:       null,
      error:        null,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  // ── Remove one file ───────────────────────────────────────────────
  const handleRemove = (id) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.thumb) URL.revokeObjectURL(entry.thumb);
      if (entry?.result?.url) URL.revokeObjectURL(entry.result.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  // ── Core processing ───────────────────────────────────────────────
  const runProcess = async (entriesToProcess) => {
    for (const entry of entriesToProcess) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'processing', error: null } : f));
      try {
        // TODO: pass your options here
        const { blob, extension, ...extra } = await processFile(entry.file, {});
        if (entry.result?.url) URL.revokeObjectURL(entry.result.url);
        const resultUrl = URL.createObjectURL(blob);
        setFiles((prev) => prev.map((f) =>
          f.id === entry.id
            ? { ...f, status: 'done', result: { blob, url: resultUrl, size: blob.size, extension, ...extra } }
            : f
        ));
      } catch (err) {
        setFiles((prev) => prev.map((f) =>
          f.id === entry.id ? { ...f, status: 'error', error: err.message } : f
        ));
      }
    }
  };

  const handleProcessOne = async (id) => {
    const entry = files.find((f) => f.id === id);
    if (!entry) return;
    setProcessing(true);
    await runProcess([entry]);
    setProcessing(false);
  };

  const handleProcessAll = async () => {
    const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (!pending.length) return;
    setProcessing(true);
    await runProcess(pending);
    setProcessing(false);
  };

  const handleDownloadOne = (entry) => {
    if (!entry.result) return;
    downloadBlob(entry.result.blob, getOutputFilename(entry.file.name, entry.result.extension));
  };

  const handleDownloadAll = () => {
    files.filter((f) => f.status === 'done' && f.result).forEach((entry) => {
      downloadBlob(entry.result.blob, getOutputFilename(entry.file.name, entry.result.extension));
    });
  };

  const handleReset = () => {
    files.forEach((f) => {
      if (f.thumb) URL.revokeObjectURL(f.thumb);
      if (f.result?.url) URL.revokeObjectURL(f.result.url);
    });
    setFiles([]);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length;
  const doneFiles    = files.filter((f) => f.status === 'done');

  return (
    <ToolLayout>

      {/* ── LEFT: Drop zone / file list ──────────────────────────── */}
      <OutputPanel>
        {files.length === 0 ? (
          <DropZone
            accept={ACCEPT_MIME}
            multiple
            onFiles={handleFiles}
            title="Drop files here"        // TODO: tool-specific
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((entry) => (
              <FileCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
                onProcessOne={handleProcessOne}
                onDownloadOne={handleDownloadOne}
                disabled={processing}
              />
            ))}

            {/* Add-more strip */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 44, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              cursor: 'pointer', color: 'var(--faint)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'border-color var(--t-fast), color var(--t-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--faint)'; }}
            >
              <input type="file" accept={ACCEPT_MIME} multiple onChange={e => handleFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
              <Icon icon={ICON_MAP.Plus} size={13} />
              Add more files
            </label>
          </div>
        )}
      </OutputPanel>

      {/* ── RIGHT: Options panel ─────────────────────────────────── */}
      <OptionsPanel>

        {/* ── Tool-specific options ── */}
        {/* EXAMPLE quality slider:
        <div className="options-label">Quality</div>
        <div className="range-wrap">
          <input type="range" min={0.1} max={1.0} step={0.05} value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))} />
          <span className="range-value">{Math.round(quality * 100)}%</span>
        </div>
        <div className="panel-divider" />
        */}

        {/* EXAMPLE format radio:
        <div className="options-label">Output Format</div>
        <div className="radio-group" style={{ marginBottom: 20 }}>
          {['jpeg', 'webp', 'png'].map((fmt) => (
            <label key={fmt} className="radio-row" style={{ cursor: 'pointer', padding: '6px 0' }}>
              <input type="radio" name="output-format" value={fmt}
                checked={format === fmt} onChange={() => setFormat(fmt)} style={{ flexShrink: 0 }} />
              <div className="radio-label">{fmt.toUpperCase()}</div>
            </label>
          ))}
        </div>
        <div className="panel-divider" />
        */}

        {/* ── Actions ── */}
        {pendingCount > 0 && (
          <Button variant="primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 8 }}
            onClick={handleProcessAll} disabled={processing}
          >
            {processing
              ? <><Icon icon={ICON_MAP.Loader2} size={14} className="spin" /> Processing...</>
              : <><Icon icon={ICON_MAP.Zap} size={14} /> Convert {pendingCount > 1 ? `All (${pendingCount})` : 'File'}</>  // TODO: rename verb
            }
          </Button>
        )}

        {doneFiles.length > 1 && (
          <Button variant="ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 8 }}
            onClick={handleDownloadAll} disabled={processing}
          >
            <Icon icon={ICON_MAP.Download} size={14} />
            Download All ({doneFiles.length})
          </Button>
        )}

        {files.length > 0 && (
          <Button variant="ghost"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            onClick={handleReset} disabled={processing}
          >
            <Icon icon={ICON_MAP.Trash2} size={13} />
            Clear All
          </Button>
        )}

        <div className="privacy-note">
          100% client-side · files never leave this device
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
