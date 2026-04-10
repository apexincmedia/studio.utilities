import { NextResponse } from 'next/server';

const COBALT_API = 'https://api.cobalt.tools/';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { url, format, quality } = body ?? {};

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Only http and https URLs are supported' }, { status: 400 });
  }

  const isAudioOnly = format === 'mp3' || format === 'audio';
  const audioFormat = ['mp3', 'ogg', 'wav', 'opus'].includes(format) ? format : 'mp3';

  let videoQuality = '720';
  if (quality) {
    const numMatch = String(quality).match(/\d+/);
    if (numMatch) {
      videoQuality = numMatch[0];
    }
  }

  const cobaltPayload = {
    url: parsedUrl.toString(),
    downloadMode: isAudioOnly ? 'audio' : 'auto',
    audioFormat,
    videoQuality,
    filenameStyle: 'pretty',
  };

  try {
    const cobaltRes = await fetch(COBALT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cobaltPayload),
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    });

    if (!cobaltRes.ok) {
      const errText = await cobaltRes.text();
      return NextResponse.json(
        { error: `Cobalt API error (${cobaltRes.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      return NextResponse.json(
        { error: data.error?.code || 'The media could not be retrieved. Check the URL and try again.' },
        { status: 422 }
      );
    }

    if (!data.url) {
      return NextResponse.json({ error: 'No download URL returned by media service' }, { status: 502 });
    }

    return NextResponse.json({
      downloadUrl: data.url,
      filename: data.filename || `download.${format || 'mp4'}`,
      status: data.status,
    });
  } catch (error) {
    const message = error?.name === 'TimeoutError'
      ? 'Request timed out — the media service took too long.'
      : `Download service unavailable: ${error?.message || 'Unknown error'}`;

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
