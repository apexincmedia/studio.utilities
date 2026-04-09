'use client';

import ImageFormatConverter from '@/tools/_shared/image-format-converter';

export default function AvifConverter() {
  return (
    <ImageFormatConverter
      toolKey="avif"
      title="Drop images to convert with AVIF"
      description="Convert images into AVIF when the browser supports it, or export AVIF files back to PNG, JPG, or WebP."
      defaultTarget="avif"
      allowedTargets={['avif', 'png', 'jpeg', 'webp']}
      acceptedFormats={['PNG', 'JPG', 'WebP', 'AVIF']}
    />
  );
}
