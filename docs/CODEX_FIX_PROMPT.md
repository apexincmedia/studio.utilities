# Master Fix Prompt — Apex Studio Utilities

> Feed this entire document to Codex as a single prompt. It covers all 15 broken tools across 4 fix groups. Complete every fix, then run `npm run build`. It must pass with 0 errors before you are done.

---

## Context

This is a Next.js 15 App Router project (`/Users/olusegunabitoye/Downloads/Apex Studio Utilities`). All tools must run entirely client-side in the browser — **except** for Next.js API routes in `app/api/`, which run on the server. No external npm packages may be added.

All existing CSS tokens and classes from `styles/globals.css` must be used. No hardcoded hex values. No Tailwind. Import icons from `@/lib/icons` via `ICON_MAP` only.

There are **4 fix groups** below. Complete them in order. After all 4 are done, run `npm run build` and confirm 0 errors.

---

## Fix Group 1 — CORS Proxy: Replace corsproxy.io with internal Next.js route

**Problem:** 7 tools use `fetchViaCorsProxy()` in `lib/seo-web-utils.js`, which routes requests through the unreliable third-party `https://corsproxy.io/`. Replace it with a reliable internal proxy API route.

**This single fix repairs all 7 tools simultaneously:**
`ip-lookup`, `whois-lookup`, `ssl-checker`, `http-headers`, `redirect-checker`, `canonical-checker`, `link-extractor`

### Step 1 — Create `app/api/proxy/route.js`

```js
import { NextResponse } from 'next/server';

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

  // Block requests to private/local IP ranges
  const blocked = ['localhost', '127.', '10.', '192.168.', '172.16.', '::1'];
  if (blocked.some((prefix) => targetUrl.hostname.startsWith(prefix) || targetUrl.hostname === 'localhost')) {
    return NextResponse.json({ error: 'Private addresses are not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ApexStudioBot/1.0; +https://apexstudioutilities.com)',
        Accept: 'text/html,application/json,application/xml,text/plain,*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Final-Url': upstream.url,
        'X-Proxy-Status': String(upstream.status),
      },
    });
  } catch (err) {
    const message = err.name === 'TimeoutError' ? 'Request timed out after 12s' : err.message;
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
```

### Step 2 — Update `lib/seo-web-utils.js`

Find this function (around line 183–195):
```js
function getCorsProxyUrl(url) {
  return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
}
```

Replace with:
```js
function getCorsProxyUrl(url) {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}
```

That's the only change needed in `seo-web-utils.js`. The `fetchViaCorsProxy` function already uses `getCorsProxyUrl` internally, so all 7 tools are fixed automatically.

---

## Fix Group 2 — Social Downloaders: Implement `POST /api/download` using Cobalt API

**Problem:** 5 tools use `SocialDownloaderStub` which shows a modal saying "connect backend at POST /api/download". The contract is already defined — implement the route and wire the stub to actually use it.

**Tools fixed:** `youtube-to-mp3`, `youtube-to-mp4`, `tiktok-downloader`, `instagram-downloader`, `twitter-video-downloader`

### Step 1 — Create `app/api/download/route.js`

```js
import { NextResponse } from 'next/server';

const COBALT_API = 'https://api.cobalt.tools/';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { url, format, quality } = body;

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  // Map Apex format/quality → Cobalt API params
  const isAudioOnly = format === 'mp3' || format === 'audio';
  const audioFormat = ['mp3', 'ogg', 'wav', 'opus'].includes(format) ? format : 'mp3';

  // quality is either "128 kbps" / "320 kbps" (audio) or "720p" / "1080p" (video)
  let videoQuality = '720';
  if (quality) {
    const numMatch = quality.match(/\d+/);
    if (numMatch) videoQuality = numMatch[0];
  }

  const cobaltPayload = {
    url,
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
    });

    if (!cobaltRes.ok) {
      const errText = await cobaltRes.text();
      return NextResponse.json(
        { error: `Cobalt API error (${cobaltRes.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await cobaltRes.json();

    // Cobalt returns { status: 'tunnel' | 'redirect' | 'error', url, filename }
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
  } catch (err) {
    const message = err.name === 'TimeoutError'
      ? 'Request timed out — the media service took too long.'
      : `Download service unavailable: ${err.message}`;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

### Step 2 — Update `tools/_shared/social-downloader-stub.jsx`

The stub currently opens `IntegrationModal` when the Download button is clicked. Replace that flow so it actually calls `POST /api/download` and triggers a real download.

**Changes to make in `social-downloader-stub.jsx`:**

1. Add `downloading` and `downloadError` state alongside the existing state.

2. Replace the `handleDownload` (or the Download button `onClick`) with:
```js
const handleDownload = async () => {
  if (!analyzedUrl) return;
  setDownloading(true);
  setDownloadError(null);

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: analyzedUrl,
        format: options.format,
        quality: options.quality,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.downloadUrl) {
      throw new Error(data.error || 'Download failed. Try a different URL or quality.');
    }

    // Trigger download via anchor click
    const anchor = document.createElement('a');
    anchor.href = data.downloadUrl;
    anchor.download = data.filename || `download.${options.format}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (err) {
    setDownloadError(err.message);
  } finally {
    setDownloading(false);
  }
};
```

3. Update the Download button:
```jsx
<button
  type="button"
  className="btn-primary"
  style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
  onClick={handleDownload}
  disabled={!analyzedUrl || downloading}
>
  <Icon icon={downloading ? ICON_MAP.Loader2 : ICON_MAP.Download} size={14} className={downloading ? 'spin' : ''} />
  {downloading ? 'Downloading…' : 'Download'}
</button>
```

4. Show `downloadError` below the Download button using `<ErrorCallout message={downloadError} />`.

5. **Remove the `IntegrationModal` component and all its usage** — it is no longer needed.

6. Also remove the `modalOpen` state and `setModalOpen` references.

---

## Fix Group 3 — PDF Security: Implement pdf-protect and pdf-unlock with pdf-lib

`pdf-lib` (v1.17.1) is already installed. It supports client-side password encryption. Replace both stub implementations with real ones.

### `tools/pdf-protect.jsx` — Full replacement

Delete the current one-liner that wraps `PdfSecurityStub` and replace with a full implementation:

```jsx
'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { formatBytes, downloadBlob } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout } from '@/tools/_shared/text-tool-kit';

export default function PdfProtect() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    userPassword: '',
    ownerPassword: '',
    allowPrinting: true,
    allowCopying: false,
  });

  const handleFiles = (files) => {
    const f = files[0];
    if (!f || f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setDone(false);
    setError(null);
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!options.userPassword) {
      setError('Enter at least a user password.');
      return;
    }
    setProcessing(true);
    setError(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const protectedBytes = await pdfDoc.save({
        userPassword: options.userPassword,
        ownerPassword: options.ownerPassword || options.userPassword,
        permissions: {
          printing: options.allowPrinting ? 'highResolution' : 'none',
          modifying: false,
          copying: options.allowCopying,
          annotating: false,
          fillingForms: true,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });

      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(new Blob([protectedBytes], { type: 'application/pdf' }), `${baseName}_protected.pdf`);
      setDone(true);
    } catch (err) {
      setError(`Could not protect PDF: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setDone(false);
    setError(null);
    setOptions({ userPassword: '', ownerPassword: '', allowPrinting: true, allowCopying: false });
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {file ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon icon={ICON_MAP.FileText} size={24} color="var(--muted)" />
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
            </div>
            {done && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--success)',
                }}
              >
                <Icon icon={ICON_MAP.CheckCircle2} size={15} />
                PDF protected and downloaded successfully.
              </div>
            )}
          </div>
        ) : (
          <DropZone onFiles={handleFiles} accept=".pdf,application/pdf">
            <EmptyState iconName="Lock" title="Drop a PDF to protect it" message="Your file is never uploaded — encryption runs entirely in your browser." />
          </DropZone>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">User Password <span style={{ color: 'var(--error)' }}>*</span></div>
        <input
          className="input"
          type="password"
          placeholder="Password to open the PDF"
          value={options.userPassword}
          onChange={(e) => setOptions((s) => ({ ...s, userPassword: e.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">Owner Password <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></div>
        <input
          className="input"
          type="password"
          placeholder="Defaults to user password"
          value={options.ownerPassword}
          onChange={(e) => setOptions((s) => ({ ...s, ownerPassword: e.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <div className="options-label">Permissions</div>
        <label className="checkbox-row" style={{ marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={options.allowPrinting}
            onChange={(e) => setOptions((s) => ({ ...s, allowPrinting: e.target.checked }))}
          />
          <span className="checkbox-label">Allow printing</span>
        </label>
        <label className="checkbox-row" style={{ marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={options.allowCopying}
            onChange={(e) => setOptions((s) => ({ ...s, allowCopying: e.target.checked }))}
          />
          <span className="checkbox-label">Allow copying text</span>
        </label>

        <ErrorCallout message={error} />

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleProtect}
          disabled={!file || processing || !options.userPassword}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Lock} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Protecting…' : 'Protect PDF'}
        </button>

        <button type="button" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleClear} disabled={!file && !done}>
          <Icon icon={ICON_MAP.Trash2} size={14} /> Clear
        </button>

        <div className="privacy-note" style={{ marginTop: 16 }}>
          All encryption is done locally in your browser using PDF 1.7 standard encryption. No data leaves your device.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
```

### `tools/pdf-unlock.jsx` — Full replacement

```jsx
'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '@/components/tool/ToolLayout';
import OutputPanel from '@/components/tool/OutputPanel';
import OptionsPanel from '@/components/tool/OptionsPanel';
import DropZone from '@/components/ui/DropZone';
import Icon from '@/components/ui/Icon';
import { ICON_MAP } from '@/lib/icons';
import { formatBytes, downloadBlob } from '@/lib/tool-utils';
import { EmptyState, ErrorCallout } from '@/tools/_shared/text-tool-kit';

export default function PdfUnlock() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = (files) => {
    const f = files[0];
    if (!f || f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setDone(false);
    setError(null);
  };

  const handleUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, {
        password: password || undefined,
        ignoreEncryption: false,
      });
      const unlockedBytes = await pdfDoc.save();

      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(new Blob([unlockedBytes], { type: 'application/pdf' }), `${baseName}_unlocked.pdf`);
      setDone(true);
    } catch (err) {
      if (err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('encrypted') || err.message.toLowerCase().includes('decrypt')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(`Could not unlock this PDF: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPassword('');
    setDone(false);
    setError(null);
  };

  return (
    <ToolLayout>
      <OutputPanel>
        {file ? (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon icon={ICON_MAP.FileText} size={24} color="var(--muted)" />
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
            </div>
            {done && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  color: 'var(--success)',
                }}
              >
                <Icon icon={ICON_MAP.CheckCircle2} size={15} />
                PDF unlocked and downloaded successfully.
              </div>
            )}
          </div>
        ) : (
          <DropZone onFiles={handleFiles} accept=".pdf,application/pdf">
            <EmptyState iconName="Key" title="Drop a password-protected PDF" message="Enter the password below and we'll remove it. Everything runs in your browser." />
          </DropZone>
        )}
      </OutputPanel>

      <OptionsPanel>
        <div className="options-label">PDF Password</div>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            className="input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter the PDF password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0,
            }}
          >
            <Icon icon={showPassword ? ICON_MAP.EyeOff : ICON_MAP.Eye} size={16} />
          </button>
        </div>

        <ErrorCallout message={error} />

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
          onClick={handleUnlock}
          disabled={!file || processing}
        >
          <Icon icon={processing ? ICON_MAP.Loader2 : ICON_MAP.Key} size={14} className={processing ? 'spin' : ''} />
          {processing ? 'Unlocking…' : 'Unlock PDF'}
        </button>

        <button type="button" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleClear} disabled={!file && !done}>
          <Icon icon={ICON_MAP.Trash2} size={14} /> Clear
        </button>

        <div className="privacy-note" style={{ marginTop: 16 }}>
          Decryption runs entirely in your browser using pdf-lib. If the PDF uses 256-bit AES encryption (PDF 2.0), it may not be supported.
        </div>
      </OptionsPanel>
    </ToolLayout>
  );
}
```

---

## Fix Group 4 — Page Speed Insights: Add Optional API Key

**File:** `tools/page-speed-insights.jsx`

**Change:** In the OptionsPanel, add an optional API key input field and pass it into the fetch URL.

### Step 1 — Add state

```js
const [apiKey, setApiKey] = useState('');
```

### Step 2 — Update the fetch URL

Find where the `fetch` call to `googleapis.com/pagespeedonline` is made. Add the key when present:

```js
const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}${apiKey.trim() ? `&key=${encodeURIComponent(apiKey.trim())}` : ''}`;
```

### Step 3 — Add the input field to OptionsPanel

Add this after the URL input and before the Strategy selector:

```jsx
<div className="options-label">
  API Key <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
</div>
<input
  className="input"
  type="password"
  placeholder="Google API key — removes rate limits"
  value={apiKey}
  onChange={(e) => setApiKey(e.target.value)}
  style={{ marginBottom: 6 }}
/>
<div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
  Without a key, Google limits requests to ~25/day per IP.{' '}
  <a
    href="https://developers.google.com/speed/docs/insights/v5/get-started"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: 'var(--text-dim)' }}
  >
    Get a free key →
  </a>
</div>
```

---

## Verification Checklist

After completing all 4 fix groups:

1. `npm run build` — must produce **0 errors**, **170+ pages**.
2. Visit `/tools/ip-lookup` — look up an IP. Should return location data (no CORS error, no "corsproxy.io" in network tab).
3. Visit `/tools/youtube-to-mp3` — paste a YouTube URL, click Analyze, click Download — should actually trigger a file download (not show the integration modal).
4. Visit `/tools/pdf-protect` — upload a PDF, enter a password, click Protect — should download a password-protected PDF.
5. Visit `/tools/pdf-unlock` — upload a protected PDF, enter the password, click Unlock — should download an unlocked PDF.
6. Visit `/tools/page-speed-insights` — check that an API key field is visible in the OptionsPanel. Test without a key — tool should still work (just shows rate limit notice when Google throttles).

---

## Files to Create or Modify

| Action | File |
|---|---|
| CREATE | `app/api/proxy/route.js` |
| CREATE | `app/api/download/route.js` |
| MODIFY | `lib/seo-web-utils.js` — line ~185, `getCorsProxyUrl()` |
| MODIFY | `tools/_shared/social-downloader-stub.jsx` — replace modal with real download flow |
| REPLACE | `tools/pdf-protect.jsx` — full implementation |
| REPLACE | `tools/pdf-unlock.jsx` — full implementation |
| MODIFY | `tools/page-speed-insights.jsx` — add apiKey state + input + inject into fetch URL |

**Total: 2 new files, 5 modified files. No new npm packages.**
