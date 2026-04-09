'use client';

import { useEffect, useRef, useState } from 'react';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { downloadBlob, formatBytes } from '@/lib/tool-utils';
import { convertRecordedAudioToMp3, formatDuration } from '@/lib/ffmpeg-tool-utils';
import { EmptyState, ErrorCallout, MetricGrid } from '@/tools/_shared/text-tool-kit';

const RECORDER_CONFIG = {
  sound: {
    iconName: 'Mic',
    title: 'Capture audio directly in your browser',
    description: 'Use your microphone to record spoken notes, interviews, or quick takes. Live waveform preview helps confirm signal activity before you stop.',
  },
  screen: {
    iconName: 'Video',
    title: 'Record your screen and optionally include system audio',
    description: 'Capture demos, walkthroughs, and bug reports with native browser screen recording. When you stop, the recording is ready to preview and download.',
  },
};

export default function MediaRecorderTool({ mode = 'sound' }) {
  const config = RECORDER_CONFIG[mode];
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const animationRef = useRef(0);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const canvasRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState(
    mode === 'sound'
      ? { format: 'webm', channelMode: 'stereo' }
      : { includeAudio: true }
  );

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    audioContextRef.current?.close?.();
  }, [result]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const context = canvas.getContext('2d');
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'var(--bg-elevated)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / data.length;
    data.forEach((value, index) => {
      const height = (value / 255) * canvas.height;
      context.fillStyle = 'var(--pill-bg)';
      context.fillRect(index * barWidth, canvas.height - height, Math.max(1, barWidth - 1), height);
    });

    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  const cleanupLiveResources = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close?.();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  const handleStart = async () => {
    if (result?.url) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }

    setError(null);
    setElapsed(0);
    setProcessing(false);

    try {
      const stream = mode === 'sound'
        ? await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: options.channelMode === 'mono' ? 1 : 2,
            },
          })
        : await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: options.includeAudio,
          });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: mode === 'sound' ? 'audio/webm' : 'video/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const sourceBlob = new Blob(chunksRef.current, {
          type: mode === 'sound' ? 'audio/webm' : 'video/webm',
        });

        cleanupLiveResources();
        setRecording(false);

        if (mode === 'sound' && options.format === 'mp3') {
          setProcessing(true);

          try {
            const converted = await convertRecordedAudioToMp3(sourceBlob, () => {});
            const url = URL.createObjectURL(converted);
            setResult({
              blob: converted,
              url,
              size: converted.size,
              name: 'recording.mp3',
              previewKind: 'audio',
            });
          } catch (convertError) {
            setError(convertError.message || 'Unable to convert the recording to MP3.');
          } finally {
            setProcessing(false);
          }

          return;
        }

        const url = URL.createObjectURL(sourceBlob);
        setResult({
          blob: sourceBlob,
          url,
          size: sourceBlob.size,
          name: mode === 'sound' ? 'recording.webm' : 'screen-recording.webm',
          previewKind: mode === 'sound' ? 'audio' : 'video',
        });
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setElapsed((current) => current + 1);
      }, 1000);

      if (mode === 'sound') {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 128;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        drawWaveform();
      }
    } catch (recordError) {
      cleanupLiveResources();
      setRecording(false);
      setError(recordError.message || 'Unable to start the recorder.');
    }
  };

  const handleStop = () => {
    recorderRef.current?.stop?.();
  };

  const handleClear = () => {
    cleanupLiveResources();
    recorderRef.current = null;

    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setRecording(false);
    setProcessing(false);
    setElapsed(0);
    setResult(null);
    setError(null);
  };

  const metrics = [
    {
      label: 'Mode',
      value: mode === 'sound' ? 'Microphone' : 'Screen',
      description: recording ? 'Recording live' : 'Ready to capture',
      tone: recording ? 'warning' : 'default',
      iconName: config.iconName,
    },
    {
      label: 'Duration',
      value: formatDuration(elapsed),
      description: recording ? 'Recording timer' : 'Elapsed time resets each session',
      iconName: 'Clock',
    },
    {
      label: 'Output',
      value: result ? formatBytes(result.size) : 'Pending',
      description: result ? result.name : processing ? 'Preparing final file…' : 'No recording yet',
      tone: result ? 'success' : processing ? 'warning' : 'default',
      iconName: 'Archive',
    },
  ];

  return (
    <ToolLayout>
      <OutputPanel>
        <MetricGrid items={metrics} columns="repeat(3, minmax(0, 1fr))" marginBottom={16} />
        <ErrorCallout message={error} />

        {mode === 'sound' ? (
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
              Live Waveform
            </div>
            <canvas
              ref={canvasRef}
              width={720}
              height={180}
              style={{
                width: '100%',
                height: 180,
                display: 'block',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
              }}
            />
          </div>
        ) : null}

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
              Recording Preview
            </div>
            {result.previewKind === 'audio' ? (
              <audio controls src={result.url} style={{ width: '100%' }} />
            ) : (
              <video controls src={result.url} style={{ width: '100%', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }} />
            )}
          </div>
        ) : (
          <EmptyState
            iconName={config.iconName}
            title={config.title}
            message={config.description}
          />
        )}
      </OutputPanel>

      <OptionsPanel>
        {mode === 'sound' ? (
          <>
            <div className="options-label">Output Format</div>
            <select
              className="input"
              value={options.format}
              onChange={(event) => setOptions((current) => ({ ...current, format: event.target.value }))}
              style={{ marginBottom: 16 }}
            >
              <option value="webm">WebM (native)</option>
              <option value="mp3">MP3 via FFmpeg</option>
            </select>

            <div className="options-label">Channels</div>
            <select
              className="input"
              value={options.channelMode}
              onChange={(event) => setOptions((current) => ({ ...current, channelMode: event.target.value }))}
              style={{ marginBottom: 16 }}
            >
              <option value="stereo">Stereo</option>
              <option value="mono">Mono</option>
            </select>
          </>
        ) : (
          <label className="checkbox-row" style={{ marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={options.includeAudio}
              onChange={(event) => setOptions((current) => ({ ...current, includeAudio: event.target.checked }))}
            />
            <span className="checkbox-label">Include audio when available</span>
          </label>
        )}

        <div className="privacy-note" style={{ marginBottom: 16 }}>
          {mode === 'sound'
            ? 'Microphone access is requested only when you start recording. MP3 export uses FFmpeg.wasm after capture, which takes longer on the first conversion.'
            : 'Screen capture is handled by your browser. Stopping the stream ends the recording immediately and keeps the generated file local to this tab.'}
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={recording ? handleStop : handleStart}
          disabled={processing}
        >
          <Icon icon={recording ? ICON_MAP.X : processing ? ICON_MAP.Loader2 : ICON_MAP[config.iconName]} size={14} className={processing ? 'spin' : ''} />
          {recording ? 'Stop Recording' : processing ? 'Processing...' : 'Start Recording'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={() => result && downloadBlob(result.blob, result.name)}
          disabled={!result}
        >
          <Icon icon={ICON_MAP.Download} size={14} />
          Download Recording
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleClear}
          disabled={!recording && !result && !processing}
        >
          <Icon icon={ICON_MAP.Trash2} size={14} />
          Clear
        </button>
      </OptionsPanel>
    </ToolLayout>
  );
}
