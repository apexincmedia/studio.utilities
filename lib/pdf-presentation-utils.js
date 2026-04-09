'use client';

import { readAsDataURL } from '@/lib/tool-utils';
import { cleanupResultUrls, renderPdfToImages } from '@/lib/pdf-tool-utils';

let pptxGenPromise;

function loadPptxGenJs() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PowerPoint export only runs in the browser.'));
  }

  if (window.PptxGenJS) {
    return Promise.resolve(window.PptxGenJS);
  }

  if (!pptxGenPromise) {
    pptxGenPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-pptxgenjs="true"]');

      if (existing) {
        existing.addEventListener('load', () => resolve(window.PptxGenJS), { once: true });
        existing.addEventListener('error', () => reject(new Error('Unable to load the PowerPoint export library.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = '/pptxgen.min.js';
      script.async = true;
      script.dataset.pptxgenjs = 'true';
      script.onload = () => resolve(window.PptxGenJS);
      script.onerror = () => reject(new Error('Unable to load the PowerPoint export library.'));
      document.head.appendChild(script);
    });
  }

  return pptxGenPromise;
}

export async function buildPdfPowerPointBlob(file, { dpi = 144, slideSize = 'widescreen' } = {}) {
  const PptxGenJS = await loadPptxGenJs();
  const presentation = new PptxGenJS();
  const rendered = await renderPdfToImages(file, { dpi, format: 'png' });
  const slideWidth = slideSize === 'standard' ? 10 : 13.333;
  const slideHeight = 7.5;

  presentation.layout = slideSize === 'standard' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';
  presentation.author = 'Apex Studio Utilities';
  presentation.subject = 'PDF to PowerPoint export';
  presentation.title = file.name.replace(/\.pdf$/i, '');

  try {
    for (const page of rendered.pages) {
      const imageData = await readAsDataURL(page.blob);
      const slide = presentation.addSlide();
      const widthRatio = slideWidth / page.width;
      const heightRatio = slideHeight / page.height;
      const scale = Math.min(widthRatio, heightRatio);
      const width = page.width * scale;
      const height = page.height * scale;
      const x = (slideWidth - width) / 2;
      const y = (slideHeight - height) / 2;

      slide.addImage({
        data: imageData,
        x,
        y,
        w: width,
        h: height,
      });
    }

    const blob = await presentation.write({ outputType: 'blob', compression: true });

    return {
      blob,
      slideCount: rendered.pageCount,
    };
  } finally {
    cleanupResultUrls(rendered.pages);
  }
}
