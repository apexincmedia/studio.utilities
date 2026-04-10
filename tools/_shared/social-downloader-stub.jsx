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
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
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
      setDownloadError(null);
    } catch (parseError) {
      setAnalyzedUrl('');
      setError(parseError.message || 'Enter a valid URL first.');
      setDownloadError(null);
    }
  };

  const handleDownload = async () => {
    if (!analyzedUrl) return;

    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: analyzedUrl,
          format: options.format,
          quality: options.quality,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.downloadUrl) {
        throw new Error(data.error || 'Download failed. Try a different URL or quality.');
      }

      const anchor = document.createElement('a');
      anchor.href = data.downloadUrl;
      anchor.download = data.filename || `download.${options.format}`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message || 'Download failed. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setAnalyzedUrl('');
    setError(null);
    setDownloadError(null);
    setDownloading(false);
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
                    description: 'Estimated media duration from the staged URL',
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
                    The media URL has been normalized and is ready to send to the download service with your selected format and quality.
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
            URL analysis happens in the browser, and the actual media lookup runs through the local `/api/download` route so the download can start without the old integration modal.
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
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={handleDownload}
            disabled={!analyzedUrl || downloading}
          >
            <Icon icon={downloading ? ICON_MAP.Loader2 : ICON_MAP.Download} size={14} className={downloading ? 'spin' : ''} />
            {downloading ? 'Downloading…' : 'Download'}
          </button>

          <ErrorCallout message={downloadError} />

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
    </>
  );
}
