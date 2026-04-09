'use client';

import { useEffect, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { formatDuration, getBaseFileName, normalizeTimestamp, runFfmpegJob } from '@/lib/ffmpeg-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

const TRIM_CONFIG = {
  audio: {
    accept: 'audio/*',
    iconName: 'Music',
    title: 'Drop audio to trim a clean excerpt',
    subtitle: 'Choose start and end points, then export a shortened clip from the original file.',
    previewTag: 'audio',
  },
  video: {
    accept: 'video/*',
    iconName: 'Video',
    title: 'Drop video to trim a shorter clip',
    subtitle: 'Preview the source video, set the trim points, and export a browser-generated clip.',
    previewTag: 'video',
  },
};

function PreviewPlayer({ kind, src, onLoadedMetadata }) {
  if (!src) return null;

  if (kind === 'audio') {
    return <audio controls src={src} onLoadedMetadata={onLoadedMetadata} style={{ width: '100%' }} />;
  }

  return (
    <video
      controls
      src={src}
      onLoadedMetadata={onLoadedMetadata}
      style={{ width: '100%', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}
    />
  );
}

export default function FfmpegMediaTrimmer({ kind = 'audio' }) {
  const config = TRIM_CONFIG[kind];
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    start: '00:00',
    end: '',
  });

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
  }, [previewUrl, result]);

  const outputName = useMemo(() => {
    if (!file) return '';
    const extension = file.name.split('.').pop() || (kind === 'audio' ? 'webm' : 'mp4');
    return `${getBaseFileName(file.name)}-trimmed.${extension}`;
  }, [file, kind]);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setDuration(0);
    setResult(null);
    setError(null);
    setProcessing(false);
    setProgress(0);
    setStatusText('');
    setOptions({
      start: '00:00',
      end: '',
    });
  };

  const handleTrim = async () => {
    if (!file) return;

    let startTime = '';
    let endTime = '';

    try {
      startTime = normalizeTimestamp(options.start);
      endTime = options.end ? normalizeTimestamp(options.end) : '';
    } catch (timeError) {
      setError(timeError.message);
      return;
    }

    if (!endTime) {
      setError('Enter an end time for the trimmed clip.');
      return;
    }

    setProcessing(true);
    setError(null);
    setStatusText('Loading FFmpeg…');
    setProgress(0);

    try {
      const extension = outputName.split('.').pop() || (kind === 'audio' ? 'webm' : 'mp4');
      const args = kind === 'video'
        ? ['-ss', startTime, '-to', endTime, '-i', file.name, '-c', 'copy', outputName]
        : ['-ss', startTime, '-to', endTime, '-i', file.name, '-c', 'copy', outputName];

      const generated = await runFfmpegJob({
        file,
        inputName: file.name,
        outputName,
        args,
        onProgress: (value) => {
          setStatusText('Trimming media…');
          setProgress(value);
        },
      });

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      setResult({
        blob: generated.blob,
        size: generated.blob.size,
        name: outputName,
        url: URL.createObjectURL(generated.blob),
        extension,
      });
      setProgress(100);
      setStatusText('Trim complete');
    } catch (trimError) {
      setError(trimError.message || 'Unable to trim that media file.');
      setProgress(0);
      setStatusText('');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setFile(null);
    setPreviewUrl('');
    setDuration(0);
    setResult(null);
    setProcessing(false);
    setProgress(0);
    setStatusText('');
    setError(null);
    setOptions({
      start: '00:00',
      end: '',
    });
  };

  const metrics = file
    ? [
        {
          label: 'Source',
          value: formatBytes(file.size),
          description: file.name,
          iconName: config.iconName,
        },
        {
          label: 'Duration',
          value: duration ? formatDuration(duration) : 'Preview',
          description: 'Use the player to confirm the clip timing',
          iconName: 'Clock',
        },
        {
          label: 'Output',
          value: result ? formatBytes(result.size) : 'Pending',
          description: result ? 'Trimmed file ready' : 'Run trim to export',
          tone: result ? 'success' : processing ? 'warning' : 'default',
          iconName: 'Scissors',
        },
      ]
    : [];

  return (
    <ToolLayout>
      <OutputPanel>
        {!file ? (
          <DropZone
            accept={config.accept}
            onFiles={handleFiles}
            title={config.title}
            subtitle={config.subtitle}
            icon={<Icon icon={ICON_MAP[config.iconName]} size={30} />}
          />
        ) : (
          <>
            <MetricGrid items={metrics} columns="repeat(3, minmax(0, 1fr))" marginBottom={16} />
            <ErrorCallout message={error} />

            {processing ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Icon icon={ICON_MAP.Loader2} size={16} className="spin" />
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{statusText || 'Trimming media…'}</div>
                </div>
                <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(Math.max(progress, 4), 100)}%`, height: '100%', background: 'var(--pill-bg)', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            ) : null}

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
                Source Preview
              </div>
              <PreviewPlayer
                kind={kind}
                src={previewUrl}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
              />
            </div>

            {result ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  padding: 16,
                }}
              >
                <div className="panel-label" style={{ marginBottom: 10 }}>
                  Trimmed Preview
                </div>
                <PreviewPlayer kind={kind} src={result.url} />
              </div>
            ) : (
              <EmptyState
                iconName={config.iconName}
                title="Preview the source, then export the trimmed section"
                message="Trim points use `mm:ss` or `hh:mm:ss` format. For the cleanest result, choose cut points that align with natural audio or video boundaries."
              />
            )}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">Start Time</div>
        <input
          className="input"
          value={options.start}
          onChange={(event) => setOptions((current) => ({ ...current, start: event.target.value }))}
          placeholder="00:00"
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">End Time</div>
        <input
          className="input"
          value={options.end}
          onChange={(event) => setOptions((current) => ({ ...current, end: event.target.value }))}
          placeholder={duration ? formatDuration(duration) : '00:30'}
          style={{ marginBottom: 16 }}
        />

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          FFmpeg.wasm trims locally in your browser. When container formats permit it, the command uses stream-copy semantics for faster exports without re-encoding the media.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleTrim}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Scissors} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Trimming...' : 'Trim Media'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, result.name)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Trimmed File
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!file && !result}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
