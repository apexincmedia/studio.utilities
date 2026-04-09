'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

let ffmpegInstance;
let ffmpegLoadPromise;
let progressCallback = null;

function getMimeTypeFromExtension(extension) {
  const normalized = extension.replace(/^\./, '').toLowerCase();

  return {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    gif: 'image/gif',
  }[normalized] || 'application/octet-stream';
}

function ensureFfmpegInstance() {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    ffmpegInstance.on('progress', ({ progress }) => {
      progressCallback?.(Math.round(progress * 100));
    });
  }

  return ffmpegInstance;
}

async function loadFfmpeg(onProgress) {
  const ffmpeg = ensureFfmpegInstance();
  progressCallback = onProgress || null;

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const coreURL = await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');
      const workerURL = await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript');

      await ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL,
      });

      return ffmpeg;
    })().catch((error) => {
      ffmpegLoadPromise = null;
      throw error;
    });
  }

  return ffmpegLoadPromise;
}

async function safeDeleteFile(ffmpeg, name) {
  if (!name) return;

  try {
    await ffmpeg.deleteFile(name);
  } catch {
    // Ignore cleanup failures in the in-memory filesystem.
  }
}

export function getBaseFileName(name = 'output') {
  return name.replace(/\.[^.]+$/, '') || 'output';
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function normalizeTimestamp(input = '') {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const totalSeconds = Math.max(0, Number.parseFloat(trimmed));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const secondString = seconds % 1
      ? seconds.toFixed(2).padStart(5, '0')
      : String(Math.floor(seconds)).padStart(2, '0');

    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${secondString}`
      : `${String(minutes).padStart(2, '0')}:${secondString}`;
  }

  if (/^\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error('Use mm:ss, hh:mm:ss, or raw seconds for time inputs.');
}

export async function runFfmpegJob({
  file,
  inputName,
  outputName,
  args,
  onProgress,
}) {
  const ffmpeg = await loadFfmpeg(onProgress);
  progressCallback = onProgress || null;

  await safeDeleteFile(ffmpeg, inputName);
  await safeDeleteFile(ffmpeg, outputName);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: getMimeTypeFromExtension(outputName.split('.').pop() || '') });

  await safeDeleteFile(ffmpeg, inputName);
  await safeDeleteFile(ffmpeg, outputName);

  return {
    blob,
    mimeType: getMimeTypeFromExtension(outputName.split('.').pop() || ''),
  };
}

export async function convertRecordedAudioToMp3(blob, onProgress) {
  const result = await runFfmpegJob({
    file: blob,
    inputName: 'recording.webm',
    outputName: 'recording.mp3',
    args: ['-i', 'recording.webm', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', 'recording.mp3'],
    onProgress,
  });

  return result.blob;
}
