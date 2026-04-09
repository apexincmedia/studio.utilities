'use client';

import ImageFormatConverter from '@/tools/_shared/image-format-converter';

export default function WebpConverter() {
  return (
    <ImageFormatConverter
      toolKey="webp"
      title="Drop images to convert with WebP"
      description="Convert images into WebP or export WebP files back into PNG or JPG formats."
      defaultTarget="webp"
      allowedTargets={['webp', 'png', 'jpeg']}
      acceptedFormats={['PNG', 'JPG', 'WebP']}
    />
  );
}
