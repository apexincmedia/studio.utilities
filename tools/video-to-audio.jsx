'use client';

import FfmpegMediaConverter from '@/tools/_shared/ffmpeg-media-converter';

export default function VideoToAudio() {
  return <FfmpegMediaConverter mode="video-to-audio" />;
}
