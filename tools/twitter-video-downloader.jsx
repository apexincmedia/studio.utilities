'use client';

import SocialDownloaderStub from '@/tools/_shared/social-downloader-stub';

export default function TwitterVideoDownloader() {
  return (
    <SocialDownloaderStub
      defaultFormat="mp4"
      formatOptions={[{ value: 'mp4', label: 'MP4' }]}
      iconName="Video"
      platformLabel="Twitter/X"
      qualityOptions={[
        { value: '360p', label: '360p' },
        { value: '480p', label: '480p' },
        { value: '720p', label: '720p' },
        { value: '1080p', label: '1080p' },
      ]}
      title="Paste a Twitter or X post URL"
      subtitle="This frontend is ready for analyze/download flows, with the actual media extraction intentionally reserved for your backend service."
    />
  );
}
