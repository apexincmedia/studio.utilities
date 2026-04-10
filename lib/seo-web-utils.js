export const STOP_WORDS = new Set([
  'a',
  'about',
  'above',
  'after',
  'again',
  'against',
  'all',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'below',
  'between',
  'both',
  'but',
  'by',
  'can',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'during',
  'each',
  'few',
  'for',
  'from',
  'further',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'me',
  'more',
  'most',
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'now',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
]);

export function ensureUrlProtocol(input = '') {
  const trimmed = input.trim();
  if (!trimmed) return '';

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return '';
    }
  }
}

export function getDomainFromUrl(input = '') {
  const normalized = ensureUrlProtocol(input);
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function normalizeComparableUrl(input = '') {
  const normalized = ensureUrlProtocol(input);
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    url.hash = '';
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return normalized;
  }
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeXml(value = '') {
  return escapeHtml(value);
}

export function buildCorsProxyUrl(url = '') {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

export async function fetchViaCorsProxy(url, init = {}) {
  const response = await fetch(buildCorsProxyUrl(url), {
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}.`);
  }

  return response;
}

export function rowsToCsv(rows = [], columns = []) {
  const headerLine = columns.map((column) => `"${String(column.label).replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((row) =>
    columns
      .map((column) => `"${String(row[column.key] ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );

  return [headerLine, ...lines].join('\n');
}

export function extractCanonicalFromHtml(html = '') {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return document
    .querySelector('link[rel~="canonical" i]')
    ?.getAttribute('href')
    ?.trim() ?? '';
}

export function extractCanonicalFromHeader(headerValue = '') {
  const match = headerValue.match(/<([^>]+)>\s*;\s*rel="?canonical"?/i);
  return match?.[1]?.trim() ?? '';
}

export function extractLinksFromHtml(html = '', baseUrl = '') {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const baseHref =
    document.querySelector('base[href]')?.getAttribute('href')?.trim() ||
    ensureUrlProtocol(baseUrl);
  const baseOrigin = baseHref ? new URL(baseHref).origin : '';

  return Array.from(document.querySelectorAll('a[href]')).map((anchor, index) => {
    const href = anchor.getAttribute('href')?.trim() ?? '';
    const resolvedUrl = baseHref ? new URL(href, baseHref).toString() : href;
    const type =
      !baseOrigin || !resolvedUrl.startsWith('http')
        ? 'relative'
        : new URL(resolvedUrl).origin === baseOrigin
          ? 'internal'
          : 'external';

    return {
      id: `${resolvedUrl}-${index}`,
      href,
      url: resolvedUrl,
      text: anchor.textContent?.replace(/\s+/g, ' ').trim() || '(no anchor text)',
      type,
    };
  });
}

export function formatPercent(value, digits = 1) {
  return `${value.toFixed(digits)}%`;
}
