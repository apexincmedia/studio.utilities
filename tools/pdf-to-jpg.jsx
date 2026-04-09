'use client';

import PdfRasterTool from '@/tools/_shared/pdf-raster-tool';

export default function PdfToJpg() {
  return (
    <PdfRasterTool
      mode="jpg"
      title="Drop a PDF to export JPG pages"
      subtitle="Render every PDF page into compressed JPG images with adjustable DPI, quality, and per-page previews."
    />
  );
}
