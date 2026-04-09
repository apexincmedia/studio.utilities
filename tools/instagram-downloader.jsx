'use client';

import SocialDownloaderStub from '@/tools/_shared/social-downloader-stub';

export default function InstagramDownloader() {
  return (
    <SocialDownloaderStub
      defaultFormat="mp4"
      formatOptions={[{ value: 'mp4', label: 'MP4' }]}
      iconName="Video"
      platformLabel="Instagram"
      qualityOptions={[
        { value: '360p', label: '360p' },
        { value: '480p', label: '480p' },
        { value: '720p', label: '720p' },
        { value: '1080p', label: '1080p' },
      ]}
      title="Paste an Instagram post or reel URL"
      subtitle="Analyze the link, confirm the staged media card, and connect your backend when you’re ready to enable real downloads."
    />
  );
}
