'use client';

import PdfRasterTool from '@/tools/_shared/pdf-raster-tool';

export default function PdfToPng() {
  return (
    <PdfRasterTool
      mode="png"
      title="Drop a PDF to export PNG pages"
      subtitle="Render every page of a PDF into crisp PNG images with adjustable DPI and downloadable previews."
    />
  );
}
