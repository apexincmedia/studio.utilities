# Broken Tools Audit — Apex Studio Utilities

> Last audited: 2026-04-09. 170 tools live. Issues found across 15 tools in 4 categories.

---

## Summary

| # | Category | Tools Affected | Root Cause | Fix Path |
|---|---|---|---|---|
| A | CORS Proxy Dependency | 7 tools | Uses unreliable third-party `corsproxy.io` | Build `/api/proxy` Next.js route |
| B | Social Downloaders | 5 tools | `SocialDownloaderStub` — UI only, no real download | Build `/api/download` route via Cobalt API |
| C | PDF Security Stubs | 2 tools | `PdfSecurityStub` — pdf-lib encryption not wired up | Implement with `pdf-lib` (already installed) |
| D | Rate-limited External API | 1 tool | Google PageSpeed API hits rate limit without key | Add optional user API key input |

**Total: 15 tools need fixes.**  
All fixes are implementable — no new npm packages needed except for the Cobalt API integration.

---

## Category A — CORS Proxy Dependency (7 tools)

These tools call external URLs from the browser using `fetchViaCorsProxy()` in `lib/seo-web-utils.js`, which routes through `https://corsproxy.io/`. That third-party proxy is unreliable, rate-limited, and a single point of failure.

**The fix for all 7 is a single change:** build a Next.js API route at `app/api/proxy/route.js` and update `getCorsProxyUrl()` in `lib/seo-web-utils.js` to use `/api/proxy?url=...` instead of `corsproxy.io`. Every tool below is fixed automatically.

| Slug | File | External Service Called |
|---|---|---|
| `ip-lookup` | `tools/ip-lookup.jsx` | `http://ip-api.com/json/{ip}` via corsproxy.io |
| `whois-lookup` | `tools/whois-lookup.jsx` | `https://rdap.org/domain/{domain}` via corsproxy.io |
| `ssl-checker` | `tools/ssl-checker.jsx` | `https://crt.sh/?q={domain}&output=json` via corsproxy.io |
| `http-headers` | `tools/http-headers.jsx` | Any user-supplied URL via corsproxy.io |
| `redirect-checker` | `tools/redirect-checker.jsx` | User URL to trace redirect chain via corsproxy.io |
| `canonical-checker` | `tools/canonical-checker.jsx` | User URL to read HTML and inspect canonical tags via corsproxy.io |
| `link-extractor` | `tools/link-extractor.jsx` | User URL to scrape links (URL mode) via corsproxy.io |

**Relevant code in `lib/seo-web-utils.js`:**
```js
// Line 185 — this is what needs to change:
return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
// Change to:
return `/api/proxy?url=${encodeURIComponent(url)}`;
```

**New file to create: `app/api/proxy/route.js`**
```js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ApexStudioBot/1.0)' },
      redirect: 'follow',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'X-Final-Url': upstream.url,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
```

---

## Category B — Social Media Downloaders (5 tools)

All 5 use `SocialDownloaderStub` (`tools/_shared/social-downloader-stub.jsx`). The UI is fully built. The stub shows a modal saying "connect your backend at `POST /api/download`". The fix is to build that route.

**All stubs already call `POST /api/download` with `{ url, format, quality }` — the backend contract is already defined.**

| Slug | File | Platform | Formats |
|---|---|---|---|
| `youtube-to-mp3` | `tools/youtube-to-mp3.jsx` | YouTube | mp3 (128/192/320 kbps) |
| `youtube-to-mp4` | `tools/youtube-to-mp4.jsx` | YouTube | mp4 (144p–1080p) |
| `tiktok-downloader` | `tools/tiktok-downloader.jsx` | TikTok | mp4, mp3 |
| `instagram-downloader` | `tools/instagram-downloader.jsx` | Instagram | mp4, jpg |
| `twitter-video-downloader` | `tools/twitter-video-downloader.jsx` | Twitter/X | mp4, mp3 |

**Recommended implementation: Cobalt API**

[Cobalt](https://cobalt.tools) is a free, open-source social media downloader. Its public API works without authentication and supports YouTube, TikTok, Instagram, Twitter/X, and 20+ other platforms.

API endpoint: `POST https://api.cobalt.tools/`

Required headers:
```
Accept: application/json
Content-Type: application/json
```

Request body:
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "downloadMode": "auto",
  "audioFormat": "mp3",
  "videoQuality": "1080"
}
```

Response:
```json
{
  "status": "tunnel" | "redirect" | "error",
  "url": "https://...",  // download URL
  "filename": "video.mp4"
}
```

**New file to create: `app/api/download/route.js`**

This route receives `{ url, format, quality }` from the stub, maps them to Cobalt API parameters, and returns `{ downloadUrl, filename }` to the client. The stub's "Download" button then opens the returned URL.

**Also update `SocialDownloaderStub`** to actually call `POST /api/download` instead of opening the modal — replace the `handleDownload` flow: call the API route, get back `downloadUrl`, then use `window.open(downloadUrl, '_blank')` or anchor-click to trigger download.

---

## Category C — PDF Security Stubs (2 tools)

`pdf-lib` (v1.17.1) is already installed. It fully supports client-side password encryption and decryption. The stub comment says "cannot add password encryption yet" — this is incorrect. The fix is to replace the stub with a real implementation.

### `pdf-protect` (`tools/pdf-protect.jsx`)

**How to implement with pdf-lib:**
```js
import { PDFDocument } from 'pdf-lib';

const bytes = await file.arrayBuffer();
const pdfDoc = await PDFDocument.load(bytes);
const protectedBytes = await pdfDoc.save({
  userPassword: userPass,       // password to open the file
  ownerPassword: ownerPass,     // password to change permissions
  permissions: {
    printing: allowPrint ? 'highResolution' : 'none',
    modifying: false,
    copying: allowCopy,
    annotating: false,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: false,
  },
});
// download as protected PDF
```

UI options needed: user password field, owner password field (optional), allow printing toggle, allow copying toggle.

### `pdf-unlock` (`tools/pdf-unlock.jsx`)

**How to implement with pdf-lib:**
```js
import { PDFDocument } from 'pdf-lib';

const bytes = await file.arrayBuffer();
try {
  const pdfDoc = await PDFDocument.load(bytes, { password: enteredPassword });
  const unlockedBytes = await pdfDoc.save();  // saves without password
  // download as unlocked PDF
} catch (err) {
  if (err.message.includes('password') || err.message.includes('encrypted')) {
    setError('Incorrect password. Please try again.');
  } else {
    setError('Could not unlock this PDF. It may use unsupported encryption.');
  }
}
```

UI needed: password input field (reveal toggle), process button, clear button.

---

## Category D — Rate-Limited External API (1 tool)

### `page-speed-insights` (`tools/page-speed-insights.jsx`)

**Current behavior:** Calls `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...` directly. Works without an API key but Google imposes a rate limit of ~25 requests/day per IP without a key.

**Fix:** Add an optional "API Key" input field in the OptionsPanel. When present, append `&key={apiKey}` to the request URL. Show a notice below the field: "Get a free key from Google Cloud Console to remove rate limits."

The fetch URL change:
```js
const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`;
```

---

## Not Broken (Confirmed Working)

These tools were audited and confirmed client-side and functional:

- All FFmpeg.wasm tools: `audio-converter`, `audio-trimmer`, `video-converter`, `video-trimmer`, `video-to-audio`, `mp4-to-gif`, `gif-to-mp4`
- `background-remover` — uses `@imgly/background-removal` (WASM, client-side)
- `ocr-tool` — uses `tesseract.js` (WASM, client-side)
- `heic-to-jpg` — uses `heic2any` (client-side)
- `currency-converter` — uses Frankfurter API with localStorage cache fallback ✓
- `dns-lookup` — uses Google DNS over HTTPS directly (no proxy needed) ✓
- `my-ip` — uses ipify.org + ipapi.co (both support CORS) ✓
- All PDF tools using `pdf-lib` / `pdfjs-dist` ✓
- All text, developer, calculator, encoding/decoding tools ✓

## Stubs (Require Real Server Infrastructure — Out of Scope for Client-Side Fix)

These 4 tools use `BackendConversionStub` and require a server-side LibreOffice/Pandoc conversion pipeline. They are intentionally honest about needing a backend. Keep as stubs until a conversion microservice is set up.

| Slug | File | Reason |
|---|---|---|
| `numbers-to-excel` | `tools/numbers-to-excel.jsx` | Apple Numbers is a proprietary archive format — no viable client-side parser |
| `odt-to-pdf` | `tools/odt-to-pdf.jsx` | ODT→PDF requires full office layout engine |
| `powerpoint-to-pdf` | `tools/powerpoint-to-pdf.jsx` | PPTX rendering to PDF requires server-side rendering |
| `pages-to-pdf` | `tools/pages-to-pdf.jsx` | Apple Pages is a proprietary archive format |
