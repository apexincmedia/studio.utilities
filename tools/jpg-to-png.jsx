'use client';

import ImageFormatConverter from '@/tools/_shared/image-format-converter';

export default function JpgToPng() {
  return (
    <ImageFormatConverter
      toolKey="png"
      title="Drop JPG images here"
      description="Convert JPEG images into crisp PNG exports locally in your browser."
      defaultTarget="png"
      allowedTargets={['png']}
      acceptedFormats={['JPG', 'JPEG']}
    />
  );
}
