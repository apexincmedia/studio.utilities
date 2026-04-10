import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isBlockedHost(hostname = '') {
  if (!hostname) return true;

  const normalized = hostname.toLowerCase();
  const blockedPrefixes = ['127.', '10.', '192.168.', '169.254.', '::1'];

  if (normalized === 'localhost') return true;
  if (blockedPrefixes.some((prefix) => normalized.startsWith(prefix))) return true;

  const ipv4Match = normalized.match(/^172\.(\d{1,3})\./);
  if (ipv4Match) {
    const octet = Number.parseInt(ipv4Match[1], 10);
    if (octet >= 16 && octet <= 31) {
      return true;
    }
  }

  return normalized.endsWith('.local');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only http and https URLs are supported' }, { status: 400 });
  }

  if (isBlockedHost(targetUrl.hostname)) {
    return NextResponse.json({ error: 'Private addresses are not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ApexStudioBot/1.0; +https://apexstudioutilities.com)',
        Accept: 'text/html,application/json,application/xml,text/plain,*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'X-Final-Url': upstream.url,
        'X-Proxy-Status': String(upstream.status),
      },
    });
  } catch (error) {
    const message = error?.name === 'TimeoutError'
      ? 'Request timed out after 12s'
      : error?.message || 'Proxy request failed';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
