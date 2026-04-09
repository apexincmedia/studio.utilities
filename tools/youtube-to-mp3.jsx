'use client';

import SocialDownloaderStub from '@/tools/_shared/social-downloader-stub';

export default function YoutubeToMp3() {
  return (
    <SocialDownloaderStub
      defaultFormat="mp3"
      formatOptions={[{ value: 'mp3', label: 'MP3' }]}
      iconName="Music"
      platformLabel="YouTube"
      qualityOptions={[
        { value: '128 kbps', label: '128 kbps' },
        { value: '192 kbps', label: '192 kbps' },
        { value: '320 kbps', label: '320 kbps' },
      ]}
      title="Paste a YouTube URL to prepare audio download"
      subtitle="Choose the target bitrate, analyze the link, and stage the request for backend download processing."
    />
  );
}
