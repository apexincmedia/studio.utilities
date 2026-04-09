'use client';

import ImageFormatConverter from '@/tools/_shared/image-format-converter';

export default function PngToJpg() {
  return (
    <ImageFormatConverter
      toolKey="jpg"
      title="Drop PNG images here"
      description="Convert PNG images into JPG files with a white background for transparency."
      defaultTarget="jpeg"
      allowedTargets={['jpeg']}
      acceptedFormats={['PNG']}
    />
  );
}
