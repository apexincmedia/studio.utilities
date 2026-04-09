'use client';

import { useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

function normalizeInputUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Paste a valid media URL to continue.');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return new URL(trimmed).toString();
  }

  return new URL(`https://${trimmed}`).toString();
}

function hashString(input = '') {
  return input.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildPlaceholderInfo(url, platformLabel, format, quality) {
  const parsed = new URL(url);
  const hash = hashString(url);
  const minutes = 1 + (hash % 8);
  const seconds = String(hash % 60).padStart(2, '0');

  return {
    title: `${platformLabel} media ready for ${format.toUpperCase()} delivery`,
    creator: parsed.hostname.replace(/^www\./, ''),
    duration: `${minutes}:${seconds}`,
    qualityLabel: quality,
  };
}

function IntegrationModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg) 72%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 40,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon={ICON_MAP.AlertTriangle} size={18} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
              Server-side processing required
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              This feature is ready for API integration. Connect your backend at <strong>POST /api/download</strong> with <code>{'{ url, format, quality }'}</code> to enable downloads.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          <Icon icon={ICON_MAP.Check} size={14} />
          Close
        </button>
      </div>
    </div>
  );
}

export default function SocialDownloaderStub({
  defaultFormat,
  formatOptions,
  iconName = 'Video',
  platformLabel,
  qualityOptions,
  subtitle,
  title,
}) {
  const [url, setUrl] = useState('');
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [options, setOptions] = useState({
    format: defaultFormat,
    quality: qualityOptions[0]?.value || '',
  });

  const info = useMemo(
    () => (analyzedUrl ? buildPlaceholderInfo(analyzedUrl, platformLabel, options.format, options.quality) : null),
    [analyzedUrl, options.format, options.quality, platformLabel]
  );

  const handleAnalyze = () => {
    try {
      const normalized = normalizeInputUrl(url);
      setAnalyzedUrl(normalized);
      setError(null);
      setModalOpen(false);
    } catch (parseError) {
      setAnalyzedUrl('');
      setError(parseError.message || 'Enter a valid URL first.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setAnalyzedUrl('');
    setError(null);
    setModalOpen(false);
    setOptions({
      format: defaultFormat,
      quality: qualityOptions[0]?.value || '',
    });
  };

  return (
    <>
      <ToolLayout>
        <OutputPanel>
          {analyzedUrl ? (
            <>
              <MetricGrid
                items={[
                  {
                    label: 'Platform',
                    value: platformLabel,
                    description: info?.creator || 'Media source',
                    iconName,
                  },
                  {
                    label: 'Format',
                    value: options.format.toUpperCase(),
                    description: info?.qualityLabel || options.quality,
                    iconName: 'Download',
                  },
                  {
                    label: 'Duration',
                    value: info?.duration || '—',
                    description: 'Placeholder metadata ready for backend replacement',
                    iconName: 'Clock',
                  },
                ]}
                columns="repeat(3, minmax(0, 1fr))"
                marginBottom={16}
              />

              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--surface) 72%, var(--bg-elevated) 28%), color-mix(in srgb, var(--pill-bg) 16%, var(--surface) 84%))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Icon icon={ICON_MAP[iconName] ?? ICON_MAP.Video} size={42} />
                    <div style={{ fontSize: 12, marginTop: 10 }}>{platformLabel} Preview Placeholder</div>
                  </div>
                </div>

                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{info?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                    {info?.creator} • {info?.duration} • {options.quality}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                    The UI has already analyzed and staged the request. Connecting the download endpoint will replace this placeholder metadata with live media details from your backend.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              iconName={iconName}
              title={title}
              message={subtitle}
            />
          )}
        </OutputPanel>

        <OptionsPanel>
          <div className="options-label">Media URL</div>
          <input
            className="input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste a video or post URL..."
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Format</div>
          <select
            className="input"
            value={options.format}
            onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="options-label">Quality</div>
          <select
            className="input"
            value={options.quality}
            onChange={(event) => setOptions((current) => ({ ...current, quality: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            {qualityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ErrorCallout message={error} />

          <div className="privacy-note" style={{ marginBottom: 16 }}>
            This frontend mirrors a production downloader workflow on purpose, including URL entry, format/quality selection, and an analyzed media card. The only missing piece is the backend download service.
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={handleAnalyze}
            disabled={!url.trim()}
          >
            <Icon icon={ICON_MAP.Search} size={14} />
            Analyze
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={() => setModalOpen(true)}
            disabled={!analyzedUrl}
          >
            <Icon icon={ICON_MAP.Download} size={14} />
            Download
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleClear}
            disabled={!url && !analyzedUrl}
          >
            <Icon icon={ICON_MAP.Trash2} size={14} />
            Clear
          </button>
        </OptionsPanel>
      </ToolLayout>

      <IntegrationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
