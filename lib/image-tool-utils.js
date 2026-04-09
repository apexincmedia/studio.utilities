'use client';

export const IMAGE_OUTPUT_FORMATS = {
  original: { mime: null, extension: null, label: 'Original' },
  jpeg: { mime: 'image/jpeg', extension: 'jpg', label: 'JPG' },
  png: { mime: 'image/png', extension: 'png', label: 'PNG' },
  webp: { mime: 'image/webp', extension: 'webp', label: 'WebP' },
  avif: { mime: 'image/avif', extension: 'avif', label: 'AVIF' },
};

export function getOutputMime(file, format = 'original') {
  if (format === 'original') {
    return file.type || 'image/png';
  }

  return IMAGE_OUTPUT_FORMATS[format]?.mime ?? 'image/png';
}

export function getOutputExtension(file, format = 'original') {
  if (format === 'original') {
    const nameExtension = file.name.split('.').pop()?.toLowerCase();
    return nameExtension || 'png';
  }

  return IMAGE_OUTPUT_FORMATS[format]?.extension ?? 'png';
}

export function getOutputFilename(originalName, suffix, format, file) {
  const base = originalName.replace(/\.[^/.]+$/, '');
  const extension = getOutputExtension(file ?? { name: originalName, type: '' }, format);
  return `${base}-${suffix}.${extension}`;
}

export function isLossyMime(mime = '') {
  return ['image/jpeg', 'image/webp', 'image/avif'].includes(mime);
}

export function supportsCanvasMime(mime = 'image/png') {
  const canvas = document.createElement('canvas');
  const dataUrl = canvas.toDataURL(mime);
  return dataUrl.startsWith(`data:${mime}`);
}

export function fillCanvasBackground(context, width, height, color = 'white') {
  context.save();
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to export the image in this browser.'));
          return;
        }

        resolve(blob);
      },
      mime,
      isLossyMime(mime) ? quality : undefined
    );
  });
}

export async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        revoke: () => URL.revokeObjectURL(url),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the selected image.'));
    };
    image.src = url;
  });
}

export async function readImageDimensions(file) {
  const { width, height, revoke } = await loadImageFromFile(file);
  revoke();
  return { width, height };
}

export async function createImageEntry(file) {
  const thumb = URL.createObjectURL(file);

  try {
    const dimensions = await readImageDimensions(file);

    return {
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      thumb,
      originalSize: file.size,
      status: 'pending',
      result: null,
      error: null,
      dimensions,
    };
  } catch {
    return {
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      thumb,
      originalSize: file.size,
      status: 'pending',
      result: null,
      error: null,
      dimensions: null,
    };
  }
}

export async function createImageEntries(files = []) {
  return Promise.all(files.map((file) => createImageEntry(file)));
}

export function cleanupImageEntry(entry) {
  if (entry.thumb) {
    URL.revokeObjectURL(entry.thumb);
  }

  if (entry.result?.url) {
    URL.revokeObjectURL(entry.result.url);
  }
}

export function getSavingsPercent(before, after) {
  if (!before || !after || after >= before) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 100));
}

export function drawContain(context, image, targetWidth, targetHeight) {
  const ratio = Math.min(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
  const width = Math.round(image.naturalWidth * ratio);
  const height = Math.round(image.naturalHeight * ratio);
  const x = Math.round((targetWidth - width) / 2);
  const y = Math.round((targetHeight - height) / 2);
  context.drawImage(image, x, y, width, height);
}

export function drawCover(context, image, targetWidth, targetHeight) {
  const ratio = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
  const width = Math.round(image.naturalWidth * ratio);
  const height = Math.round(image.naturalHeight * ratio);
  const x = Math.round((targetWidth - width) / 2);
  const y = Math.round((targetHeight - height) / 2);
  context.drawImage(image, x, y, width, height);
}
