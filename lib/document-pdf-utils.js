'use client';

import { loadImageFromFile } from '@/lib/image-tool-utils';

const PAGE_SIZES = {
  a4: 'a4',
  letter: 'letter',
  a3: 'a3',
};

const MARGIN_PRESETS = {
  none: 0,
  tight: 8,
  normal: 14,
  wide: 22,
  small: 8,
  medium: 14,
};

async function loadJsPdf() {
  const module = await import('jspdf');
  return module.jsPDF;
}

function getMarginMm(preset) {
  return MARGIN_PRESETS[preset] ?? MARGIN_PRESETS.normal;
}

function getPageFormat(pageSize) {
  return PAGE_SIZES[pageSize] ?? 'a4';
}

function pixelsToMillimeters(value) {
  return (value * 25.4) / 96;
}

function fitWithinBox(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}

async function imageToPdfSource(file) {
  const { image, revoke } = await loadImageFromFile(file);

  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    const format = file.type === 'image/jpeg' ? 'JPEG' : 'PNG';
    const dataUrl = canvas.toDataURL(format === 'JPEG' ? 'image/jpeg' : 'image/png', 0.92);

    return {
      name: file.name,
      width,
      height,
      format,
      dataUrl,
    };
  } finally {
    revoke();
  }
}


export async function buildImagePdf(files, {
  pageSize = 'a4',
  margin = 'medium',
  orientation = 'auto',
} = {}) {
  const jsPDF = await loadJsPdf();
  const images = await Promise.all(files.map((file) => imageToPdfSource(file)));
  if (!images.length) {
    throw new Error('Add at least one image before generating the PDF.');
  }

  const marginMm = getMarginMm(margin);

  function resolvePageConfig(image) {
    if (pageSize === 'fit') {
      const widthMm = pixelsToMillimeters(image.width);
      const heightMm = pixelsToMillimeters(image.height);
      return {
        format: [widthMm, heightMm],
        orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
      };
    }

    if (orientation === 'auto') {
      return {
        format: getPageFormat(pageSize),
        orientation: image.width >= image.height ? 'landscape' : 'portrait',
      };
    }

    return {
      format: getPageFormat(pageSize),
      orientation,
    };
  }

  const firstPage = resolvePageConfig(images[0]);
  const doc = new jsPDF({
    unit: 'mm',
    format: firstPage.format,
    orientation: firstPage.orientation,
  });

  images.forEach((image, index) => {
    const pageConfig = resolvePageConfig(image);
    if (index > 0) {
      doc.addPage(pageConfig.format, pageConfig.orientation);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageSize === 'fit' ? pageWidth : pageWidth - marginMm * 2;
    const usableHeight = pageSize === 'fit' ? pageHeight : pageHeight - marginMm * 2;
    const fitted = fitWithinBox(pixelsToMillimeters(image.width), pixelsToMillimeters(image.height), usableWidth, usableHeight);
    const x = pageSize === 'fit' ? 0 : (pageWidth - fitted.width) / 2;
    const y = pageSize === 'fit' ? 0 : (pageHeight - fitted.height) / 2;

    doc.addImage(image.dataUrl, image.format, x, y, fitted.width, fitted.height, undefined, 'FAST');
  });

  return {
    blob: doc.output('blob'),
    pageCount: images.length,
  };
}

export async function renderHtmlToPdfBlob(htmlContent, {
  pageSize = 'a4',
  orientation = 'portrait',
  margin = 'normal',
  fontSize = 12,
} = {}) {
  const jsPDF = await loadJsPdf();
  const marginMm = getMarginMm(margin);
  const doc = new jsPDF({
    unit: 'mm',
    format: getPageFormat(pageSize),
    orientation,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginMm * 2;

  // Inline styles so jsPDF's html() renderer picks them up regardless of page CSS
  const styledHtml = `<div style="width:900px;font-family:Georgia,'Times New Roman',serif;font-size:${fontSize}px;line-height:1.7;color:rgb(17,24,39);background:white;box-sizing:border-box;padding:0"><style>*{box-sizing:border-box}img,svg,video{max-width:100%;height:auto}table{width:100%;border-collapse:collapse}th,td{border:1px solid rgb(209,213,219);padding:6px 8px;vertical-align:top}pre,code{white-space:pre-wrap;word-break:break-word}blockquote{border-left:4px solid rgb(209,213,219);padding-left:12px;margin-left:0;color:rgb(75,85,99)}</style>${htmlContent}</div>`;

  return new Promise((resolve, reject) => {
    doc.html(styledHtml, {
      callback: (pdfDoc) => resolve(pdfDoc.output('blob')),
      x: marginMm,
      y: marginMm,
      width: contentWidth,
      windowWidth: 900,
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },
    });
  });
}

export async function buildTextPdfBlob(text, {
  pageSize = 'a4',
  fontSize = 12,
  lineHeight = 1.5,
} = {}) {
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF({
    unit: 'mm',
    format: getPageFormat(pageSize),
    orientation: 'portrait',
  });
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeightMm = fontSize * 0.352778 * lineHeight;

  doc.setFont('times', 'normal');
  doc.setFontSize(fontSize);

  let y = margin;
  const paragraphs = text.split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    const lines = paragraph
      ? doc.splitTextToSize(paragraph, pageWidth - margin * 2)
      : [''];

    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage(getPageFormat(pageSize), 'portrait');
        y = margin;
      }

      doc.text(line || ' ', margin, y);
      y += lineHeightMm;
    });
  });

  return doc.output('blob');
}
