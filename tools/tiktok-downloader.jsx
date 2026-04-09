'use client';

import SocialDownloaderStub from '@/tools/_shared/social-downloader-stub';

export default function TiktokDownloader() {
  return (
    <SocialDownloaderStub
      defaultFormat="mp4"
      formatOptions={[{ value: 'mp4', label: 'MP4' }]}
      iconName="Video"
      platformLabel="TikTok"
      qualityOptions={[
        { value: '360p', label: '360p' },
        { value: '480p', label: '480p' },
        { value: '720p', label: '720p' },
        { value: '1080p', label: '1080p' },
      ]}
      title="Paste a TikTok URL to prepare a download request"
      subtitle="The interface is ready for post analysis, quality selection, and backend handoff for the actual download step."
    />
  );
}
