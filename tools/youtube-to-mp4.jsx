'use client';

import SocialDownloaderStub from '@/tools/_shared/social-downloader-stub';

export default function YoutubeToMp4() {
  return (
    <SocialDownloaderStub
      defaultFormat="mp4"
      formatOptions={[{ value: 'mp4', label: 'MP4' }]}
      iconName="Video"
      platformLabel="YouTube"
      qualityOptions={[
        { value: '144p', label: '144p' },
        { value: '360p', label: '360p' },
        { value: '480p', label: '480p' },
        { value: '720p', label: '720p' },
        { value: '1080p', label: '1080p' },
      ]}
      title="Paste a YouTube URL to prepare video download"
      subtitle="Analyze the link, choose a target resolution, and hand the final download request to your backend."
    />
  );
}
