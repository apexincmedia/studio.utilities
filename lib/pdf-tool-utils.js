'use client';

import { readAsArrayBuffer } from '@/lib/tool-utils';

let pdfJsPromise;
let pdfLibPromise;

export function isPdfFile(file) {
  if (!file) return false;
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function getPdfBaseName(name = 'document.pdf') {
  return name.replace(/\.pdf$/i, '') || 'document';
}

export async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist/build/pdf').then((module) => {
      const pdfjs = module.default ?? module;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

export async function loadPdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import('pdf-lib');
  }

  return pdfLibPromise;
}

export async function getPdfPageCount(file) {
  const { PDFDocument } = await loadPdfLib();
  const bytes = await readAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(bytes);
  return pdfDoc.getPageCount();
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to export that rendered PDF page.'));
          return;
        }

        resolve(blob);
      },
      mime,
      mime === 'image/jpeg' ? quality : undefined
    );
  });
}

export async function renderPdfToImages(file, { dpi = 150, format = 'png', quality = 0.88, onProgress } = {}) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await readAsArrayBuffer(file);
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages = [];
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.({ pageNumber, totalPages: pdf.numPages });

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: dpi / 72 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext('2d');
      if (mime === 'image/jpeg') {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await canvasToBlob(canvas, mime, quality);

      pages.push({
        pageNumber,
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        mime,
      });

      if (typeof page.cleanup === 'function') {
        page.cleanup();
      }
    }
  } finally {
    if (typeof pdf.cleanup === 'function') {
      pdf.cleanup();
    }
    if (typeof pdf.destroy === 'function') {
      pdf.destroy();
    }
  }

  return {
    pageCount: pdf.numPages,
    pages,
  };
}

export function cleanupResultUrls(items = []) {
  items.forEach((item) => {
    if (item?.url) {
      URL.revokeObjectURL(item.url);
    }
  });
}

export async function createZipBlob(files = []) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.blob);
  });

  return zip.generateAsync({ type: 'blob' });
}

function parseRangeToken(token, totalPages) {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error('Range input contains an empty value.');
  }

  if (!trimmed.includes('-')) {
    const page = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      throw new Error(`Page ${trimmed} is outside the document range.`);
    }
    return [page - 1];
  }

  const [startRaw, endRaw] = trimmed.split('-').map((part) => part.trim());
  const start = Number.parseInt(startRaw, 10);
  const end = Number.parseInt(endRaw, 10);
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error(`Range "${trimmed}" is not valid.`);
  }

  const from = Math.min(start, end);
  const to = Math.max(start, end);

  if (from < 1 || to > totalPages) {
    throw new Error(`Range "${trimmed}" is outside the document range.`);
  }

  return Array.from({ length: to - from + 1 }, (_, index) => from - 1 + index);
}

export function parsePageSelection(input, totalPages) {
  if (!input.trim()) {
    throw new Error('Enter one or more pages or ranges.');
  }

  const indices = input
    .split(',')
    .flatMap((token) => parseRangeToken(token, totalPages));

  return [...new Set(indices)].sort((left, right) => left - right);
}

export function parseSplitGroups(input, totalPages) {
  if (!input.trim()) {
    throw new Error('Enter one or more ranges like 1-3,5,7-9.');
  }

  return input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const indices = parseRangeToken(token, totalPages);
      return {
        label: token.replace(/\s+/g, ''),
        indices,
      };
    });
}
