'use client';

const IMAGE_SIGNATURES = [
  { mime: 'image/png', extension: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', extension: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', extension: 'gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', extension: 'webp', ascii: 'RIFF', offset: 0, extraAscii: 'WEBP', extraOffset: 8 },
  { mime: 'image/bmp', extension: 'bmp', ascii: 'BM', offset: 0 },
];

export function stripDataUriPrefix(value = '') {
  return value.trim().replace(/^data:[^;,]+;base64,/i, '');
}

export function getMimeFromDataUri(value = '') {
  const match = value.trim().match(/^data:([^;,]+);base64,/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function decodeBase64ToBytes(value = '') {
  const clean = stripDataUriPrefix(value).replace(/\s+/g, '');
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function detectImageType(bytes = new Uint8Array()) {
  for (const signature of IMAGE_SIGNATURES) {
    if (signature.bytes) {
      const matches = signature.bytes.every((byte, index) => bytes[index] === byte);
      if (matches) {
        return { mime: signature.mime, extension: signature.extension };
      }
      continue;
    }

    const header = String.fromCharCode(...bytes.slice(signature.offset, signature.offset + signature.ascii.length));
    if (header !== signature.ascii) {
      continue;
    }

    if (signature.extraAscii) {
      const extra = String.fromCharCode(
        ...bytes.slice(signature.extraOffset, signature.extraOffset + signature.extraAscii.length)
      );
      if (extra !== signature.extraAscii) {
        continue;
      }
    }

    return { mime: signature.mime, extension: signature.extension };
  }

  return null;
}

export function bytesToBlob(bytes, mime = 'application/octet-stream') {
  return new Blob([bytes], { type: mime });
}

export async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read that image.'));
    reader.readAsDataURL(blob);
  });
}
