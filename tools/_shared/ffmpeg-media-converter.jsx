'use client';

import { useEffect, useMemo, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { getBaseFileName, normalizeTimestamp, runFfmpegJob } from '@/lib/ffmpeg-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

const TOOL_CONFIG = {
  'audio-converter': {
    accept: 'audio/*',
    iconName: 'Music',
    title: 'Drop audio to convert it in your browser',
    subtitle: 'Convert audio files with FFmpeg.wasm. The first run downloads the FFmpeg core once, then the browser cache handles reuse.',
    inputKind: 'audio',
    outputKind: 'audio',
    initialOptions: {
      format: 'mp3',
      bitrate: '192k',
    },
    renderOptions(options, setOptions) {
      return (
        <>
          <div className="options-label">Output Format</div>
          <select
            className="input"
            value={options.format}
            onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
          </select>

          <div className="options-label">Bitrate</div>
          <select
            className="input"
            value={options.bitrate}
            onChange={(event) => setOptions((current) => ({ ...current, bitrate: event.target.value }))}
            style={{ marginBottom: 16 }}
            disabled={options.format === 'wav' || options.format === 'flac'}
          >
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="320k">320 kbps</option>
          </select>
        </>
      );
    },
    getOutputName(file, options) {
      return `${getBaseFileName(file.name)}.${options.format}`;
    },
    buildArgs(file, options, outputName) {
      if (options.format === 'wav') {
        return ['-i', file.name, '-vn', '-c:a', 'pcm_s16le', outputName];
      }

      if (options.format === 'flac') {
        return ['-i', file.name, '-vn', '-c:a', 'flac', outputName];
      }

      if (options.format === 'aac') {
        return ['-i', file.name, '-vn', '-c:a', 'aac', '-b:a', options.bitrate, outputName];
      }

      if (options.format === 'ogg') {
        return ['-i', file.name, '-vn', '-c:a', 'libvorbis', '-b:a', options.bitrate, outputName];
      }

      return ['-i', file.name, '-vn', '-ar', '44100', '-ac', '2', '-b:a', options.bitrate, outputName];
    },
  },
  'video-converter': {
    accept: 'video/*',
    iconName: 'Video',
    title: 'Drop video to transcode it with FFmpeg.wasm',
    subtitle: 'Convert common video formats and optionally scale the output down for lighter files.',
    inputKind: 'video',
    outputKind: 'video',
    initialOptions: {
      format: 'mp4',
      resolution: 'original',
      crf: '23',
    },
    renderOptions(options, setOptions) {
      return (
        <>
          <div className="options-label">Output Format</div>
          <select
            className="input"
            value={options.format}
            onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
            <option value="webm">WEBM</option>
            <option value="avi">AVI</option>
          </select>

          <div className="options-label">Resolution</div>
          <select
            className="input"
            value={options.resolution}
            onChange={(event) => setOptions((current) => ({ ...current, resolution: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="original">Original</option>
            <option value="1080">1080p</option>
            <option value="720">720p</option>
            <option value="480">480p</option>
          </select>

          <div className="options-label">CRF</div>
          <input
            className="input"
            type="range"
            min="18"
            max="32"
            value={options.crf}
            onChange={(event) => setOptions((current) => ({ ...current, crf: event.target.value }))}
            style={{ marginBottom: 8 }}
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
            Lower CRF means higher quality. Current target: {options.crf}
          </div>
        </>
      );
    },
    getOutputName(file, options) {
      return `${getBaseFileName(file.name)}.${options.format}`;
    },
    buildArgs(file, options, outputName) {
      const args = ['-i', file.name];

      if (options.resolution !== 'original') {
        args.push('-vf', `scale=-2:${options.resolution}`);
      }

      if (options.format === 'webm') {
        args.push('-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', options.crf, '-c:a', 'libopus');
        return [...args, outputName];
      }

      if (options.format === 'avi') {
        args.push('-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'mp3', '-b:a', '128k');
        return [...args, outputName];
      }

      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', options.crf, '-c:a', 'aac', '-b:a', '128k');
      return [...args, outputName];
    },
  },
  'video-to-audio': {
    accept: 'video/*',
    iconName: 'Music',
    title: 'Drop video to extract the audio track',
    subtitle: 'Strip video and keep only the audio in your selected output format.',
    inputKind: 'video',
    outputKind: 'audio',
    initialOptions: {
      format: 'mp3',
      bitrate: '192k',
    },
    renderOptions(options, setOptions) {
      return (
        <>
          <div className="options-label">Output Format</div>
          <select
            className="input"
            value={options.format}
            onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="aac">AAC</option>
          </select>

          <div className="options-label">Bitrate</div>
          <select
            className="input"
            value={options.bitrate}
            onChange={(event) => setOptions((current) => ({ ...current, bitrate: event.target.value }))}
            style={{ marginBottom: 16 }}
            disabled={options.format === 'wav'}
          >
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="320k">320 kbps</option>
          </select>
        </>
      );
    },
    getOutputName(file, options) {
      return `${getBaseFileName(file.name)}.${options.format}`;
    },
    buildArgs(file, options, outputName) {
      if (options.format === 'wav') {
        return ['-i', file.name, '-vn', '-c:a', 'pcm_s16le', outputName];
      }

      if (options.format === 'aac') {
        return ['-i', file.name, '-vn', '-c:a', 'aac', '-b:a', options.bitrate, outputName];
      }

      return ['-i', file.name, '-vn', '-c:a', 'libmp3lame', '-b:a', options.bitrate, outputName];
    },
  },
  'mp4-to-gif': {
    accept: 'video/*',
    iconName: 'Film',
    title: 'Drop a video clip to turn it into GIF',
    subtitle: 'Trim the section you want, control frame rate, and render an animated GIF entirely in the browser.',
    inputKind: 'video',
    outputKind: 'image',
    initialOptions: {
      start: '00:00',
      end: '',
      fps: '15',
      width: '480',
    },
    renderOptions(options, setOptions) {
      return (
        <>
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
            placeholder="00:05"
            style={{ marginBottom: 16 }}
          />

          <div className="options-label">Frame Rate</div>
          <select
            className="input"
            value={options.fps}
            onChange={(event) => setOptions((current) => ({ ...current, fps: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="10">10 fps</option>
            <option value="15">15 fps</option>
            <option value="24">24 fps</option>
          </select>

          <div className="options-label">Width</div>
          <select
            className="input"
            value={options.width}
            onChange={(event) => setOptions((current) => ({ ...current, width: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="320">320 px</option>
            <option value="480">480 px</option>
            <option value="640">640 px</option>
          </select>
        </>
      );
    },
    getOutputName(file) {
      return `${getBaseFileName(file.name)}.gif`;
    },
    buildArgs(file, options, outputName) {
      const args = [];
      const start = options.start ? normalizeTimestamp(options.start) : '';
      const end = options.end ? normalizeTimestamp(options.end) : '';

      if (start) {
        args.push('-ss', start);
      }

      args.push('-i', file.name);

      if (end) {
        args.push('-to', end);
      }

      args.push('-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos`, '-loop', '0', outputName);
      return args;
    },
  },
  'gif-to-mp4': {
    accept: 'image/gif,.gif',
    iconName: 'Video',
    title: 'Drop a GIF to turn it into lightweight video',
    subtitle: 'Convert animated GIFs to MP4 or WEBM for easier sharing and smaller file sizes.',
    inputKind: 'image',
    outputKind: 'video',
    initialOptions: {
      format: 'mp4',
      fps: '24',
    },
    renderOptions(options, setOptions) {
      return (
        <>
          <div className="options-label">Output Format</div>
          <select
            className="input"
            value={options.format}
            onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="mp4">MP4</option>
            <option value="webm">WEBM</option>
          </select>

          <div className="options-label">FPS</div>
          <select
            className="input"
            value={options.fps}
            onChange={(event) => setOptions((current) => ({ ...current, fps: event.target.value }))}
            style={{ marginBottom: 16 }}
          >
            <option value="12">12 fps</option>
            <option value="24">24 fps</option>
            <option value="30">30 fps</option>
          </select>
        </>
      );
    },
    getOutputName(file, options) {
      return `${getBaseFileName(file.name)}.${options.format}`;
    },
    buildArgs(file, options, outputName) {
      if (options.format === 'webm') {
        return ['-i', file.name, '-r', options.fps, '-c:v', 'libvpx-vp9', outputName];
      }

      return ['-i', file.name, '-r', options.fps, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', outputName];
    },
  },
};

function PreviewCard({ label, kind, src, name }) {
  if (!src) return null;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        padding: 16,
      }}
    >
      <div className="panel-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      {kind === 'audio' ? (
        <audio controls src={src} style={{ width: '100%' }} />
      ) : null}
      {kind === 'video' ? (
        <video controls src={src} style={{ width: '100%', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }} />
      ) : null}
      {kind === 'image' ? (
        <img src={src} alt={name} style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block', background: 'var(--bg-elevated)' }} />
      ) : null}
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>{name}</div>
    </div>
  );
}

export default function FfmpegMediaConverter({ mode }) {
  const config = TOOL_CONFIG[mode];
  const [file, setFile] = useState(null);
  const [inputUrl, setInputUrl] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);
  const [options, setOptions] = useState(config.initialOptions);

  useEffect(() => () => {
    if (inputUrl) {
      URL.revokeObjectURL(inputUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
  }, [inputUrl, result]);

  const handleFiles = async (files) => {
    const nextFile = files[0];
    if (!nextFile) return;

    if (inputUrl) {
      URL.revokeObjectURL(inputUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setFile(nextFile);
    setInputUrl(URL.createObjectURL(nextFile));
    setResult(null);
    setError(null);
    setProgress(0);
    setStatusText('');
  };

  const handleConvert = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);
    setStatusText('Loading FFmpeg…');

    try {
      const outputName = config.getOutputName(file, options);
      const generated = await runFfmpegJob({
        file,
        inputName: file.name,
        outputName,
        args: config.buildArgs(file, options, outputName),
        onProgress: (value) => {
          setStatusText('Processing media…');
          setProgress(value);
        },
      });

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      const blobUrl = URL.createObjectURL(generated.blob);
      setResult({
        blob: generated.blob,
        size: generated.blob.size,
        name: outputName,
        url: blobUrl,
      });
      setStatusText('Conversion complete');
      setProgress(100);
    } catch (convertError) {
      setError(convertError.message || 'Unable to convert that media file.');
      setStatusText('');
      setProgress(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (inputUrl) {
      URL.revokeObjectURL(inputUrl);
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setFile(null);
    setInputUrl('');
    setResult(null);
    setProcessing(false);
    setProgress(0);
    setStatusText('');
    setError(null);
    setOptions(config.initialOptions);
  };

  const metricItems = useMemo(() => {
    if (!file) return [];

    return [
      {
        label: 'Source',
        value: formatBytes(file.size),
        description: file.name,
        iconName: config.iconName,
      },
      {
        label: 'Status',
        value: processing ? `${progress}%` : result ? 'Ready' : 'Idle',
        description: statusText || 'Select output options, then run the conversion',
        tone: result ? 'success' : processing ? 'warning' : 'default',
        iconName: processing ? 'Loader2' : 'Zap',
      },
      {
        label: 'Output',
        value: result ? formatBytes(result.size) : 'Pending',
        description: result ? result.name : 'No converted file yet',
        tone: result ? 'success' : 'default',
        iconName: 'Archive',
      },
    ];
  }, [config.iconName, file, processing, progress, result, statusText]);

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
            <MetricGrid items={metricItems} columns="repeat(3, minmax(0, 1fr))" marginBottom={16} />
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
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{statusText || 'Processing media…'}</div>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(Math.max(progress, 4), 100)}%`,
                      height: '100%',
                      background: 'var(--pill-bg)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <PreviewCard label="Source Preview" kind={config.inputKind} src={inputUrl} name={file.name} />
              {result ? <PreviewCard label="Converted Preview" kind={config.outputKind} src={result.url} name={result.name} /> : null}
            </div>

            {!result ? (
              <EmptyState
                iconName={config.iconName}
                title="Ready to transcode in the browser"
                message="FFmpeg.wasm downloads its core on first use, then runs conversion locally. Large videos can take a while, but nothing leaves your device."
              />
            ) : null}
          </>
        )}
      </OutputPanel>

      <OptionsPanel>
        {config.renderOptions(options, setOptions)}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          FFmpeg.wasm downloads a large core on first use and processes the file locally in your browser. Keep this tab open until the conversion finishes.
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleConvert}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Zap} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Processing...' : 'Convert File'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, result.name)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Result
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
