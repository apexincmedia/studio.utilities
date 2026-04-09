# Apex Studio Utilities — Dependencies Guide for Codex

> Before implementing any tool that lists a dependency, install it first.
> Run `npm install [package]` then verify `npm run build` still passes.
> All packages listed here are client-safe (no Node.js-only APIs).

---

## Quick Install Reference

```bash
# PDF tools
npm install pdf-lib pdfjs-dist jspdf html2canvas

# Document conversion
npm install mammoth marked turndown @iarna/toml js-yaml fast-xml-parser

# Image tools
npm install heic2any tesseract.js exifr jszip gif.js @imgly/background-removal

# Video/audio
npm install @ffmpeg/ffmpeg @ffmpeg/util

# QR / barcodes
npm install qrcode jsQR jsbarcode

# Developer tools
npm install sql-formatter graphql diff curlconverter cronstrue @faker-js/faker

# Data formats
npm install xlsx

# Misc
npm install @faker-js/faker
```

---

## Package Details

---

### `pdf-lib`
**Used by:** pdf-merge, pdf-split, pdf-compress, pdf-rotate, pdf-watermark, pdf-protect, pdf-unlock
**Install:** `npm install pdf-lib`

```js
import { PDFDocument, degrees, rgb } from 'pdf-lib';

// Load a PDF from ArrayBuffer
const pdfDoc = await PDFDocument.load(arrayBuffer);

// Get pages
const pages = pdfDoc.getPages();
const page = pages[0];

// Save as Uint8Array → Blob → download
const pdfBytes = await pdfDoc.save();
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
downloadBlob(blob, 'output.pdf');
```

**Key APIs:**
- `PDFDocument.create()` — new blank PDF
- `PDFDocument.load(bytes, { password })` — load existing (password optional)
- `PDFDocument.copyPages(srcDoc, indices)` — copy pages between docs
- `page.drawText(text, { x, y, size, opacity, rotate: degrees(45) })`
- `page.setRotation(degrees(90))`
- `pdfDoc.encrypt({ userPassword, ownerPassword, permissions })`
- `pdfDoc.save({ useObjectStreams: true })` — compressed save

---

### `pdfjs-dist`
**Used by:** pdf-to-png, pdf-to-jpg, pdf-to-word, pdf-to-excel, pdf-to-powerpoint
**Install:** `npm install pdfjs-dist`

```js
import * as pdfjsLib from 'pdfjs-dist';

// MUST set worker before any usage
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Load PDF
const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

// Render a page to canvas
const page = await pdf.getPage(1); // 1-indexed
const viewport = page.getViewport({ scale: 2 }); // scale = DPI/72
const canvas = document.createElement('canvas');
canvas.width = viewport.width;
canvas.height = viewport.height;
await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
const dataUrl = canvas.toDataURL('image/png');

// Extract text
const textContent = await page.getTextContent();
const text = textContent.items.map((item) => item.str).join(' ');
```

**Version note:** Use v3.x (not v4+) — v4 changed the API significantly.

---

### `jspdf`
**Used by:** txt-to-pdf, markdown-to-pdf, html-to-pdf, excel-to-pdf, image-to-pdf, word-to-pdf
**Install:** `npm install jspdf`

```js
import { jsPDF } from 'jspdf';

const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });

// Add text
doc.setFontSize(12);
doc.text('Hello world', 20, 20); // x, y in mm from top-left

// Add image (data URL)
doc.addImage(dataUrl, 'JPEG', 10, 10, 190, 0); // x, y, width, height(0=auto)

// New page
doc.addPage();

// Save
doc.save('output.pdf');
// OR get Blob:
const blob = doc.output('blob');
```

**html() method** (requires html2canvas):
```js
await doc.html(htmlElement, { callback: (doc) => doc.save('output.pdf'), x: 10, y: 10, width: 190 });
```

---

### `html2canvas`
**Used by:** html-to-pdf, word-to-pdf (via jsPDF html method)
**Install:** `npm install html2canvas`

```js
import html2canvas from 'html2canvas';

const canvas = await html2canvas(document.getElementById('target'), {
  scale: 2,          // 2× for sharper output
  useCORS: true,     // allow cross-origin images
  backgroundColor: '#ffffff',
});
const imgData = canvas.toDataURL('image/png');
```

---

### `mammoth`
**Used by:** word-to-pdf
**Install:** `npm install mammoth`

```js
import mammoth from 'mammoth';

// arrayBuffer from FileReader
const result = await mammoth.convertToHtml({ arrayBuffer });
const html = result.value; // HTML string
const warnings = result.messages; // any conversion warnings
```

**Note:** Only supports `.docx`, not legacy `.doc`. Converts to HTML only — 
you then render to PDF via jsPDF html() method. Complex formatting may not preserve.

---

### `marked`
**Used by:** markdown-to-html, markdown-to-pdf
**Install:** `npm install marked`

```js
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });
const html = marked.parse(markdownString);
```

---

### `turndown`
**Used by:** html-to-markdown
**Install:** `npm install turndown`

```js
import TurndownService from 'turndown';

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});
const markdown = td.turndown(htmlString);
```

---

### `js-yaml`
**Used by:** yaml-to-json, json-to-yaml
**Install:** `npm install js-yaml`

```js
import * as yaml from 'js-yaml';

// YAML → JS object
const obj = yaml.load(yamlString);

// JS object → YAML
const yamlStr = yaml.dump(obj, { indent: 2 });
```

---

### `fast-xml-parser`
**Used by:** xml-to-json, json-to-xml, xml-formatter
**Install:** `npm install fast-xml-parser`

```js
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// XML → JSON
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const result = parser.parse(xmlString);

// JSON → XML
const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true });
const xmlOut = builder.build(jsonObj);
```

---

### `@iarna/toml`
**Used by:** toml-to-json
**Install:** `npm install @iarna/toml`

```js
import TOML from '@iarna/toml';

const obj = TOML.parse(tomlString);
const json = JSON.stringify(obj, null, 2);
```

---

### `xlsx`
**Used by:** excel-to-pdf, pdf-to-excel, numbers-to-excel
**Install:** `npm install xlsx`

```js
import * as XLSX from 'xlsx';

// Read from ArrayBuffer
const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Sheet → array of arrays
const aoa = XLSX.utils.sheet_to_aoa(sheet);

// Sheet → HTML table string
const html = XLSX.utils.sheet_to_html(sheet);

// Write workbook → download
const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), 'output.xlsx');
```

---

### `heic2any`
**Used by:** heic-to-jpg
**Install:** `npm install heic2any`

```js
import heic2any from 'heic2any';

// file: File object (the HEIC file)
const resultBlob = await heic2any({
  blob: file,
  toType: 'image/jpeg',
  quality: 0.85,
});
downloadBlob(resultBlob, 'output.jpg');
```

**Note:** heic2any is slow for large files (>5MB). Show a spinner and a "Processing…" message.
For batch, process files sequentially to avoid memory issues.

---

### `tesseract.js`
**Used by:** ocr-tool
**Install:** `npm install tesseract.js`

```js
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(
  imageFile,      // File | Blob | URL | canvas | ImageData
  'eng',          // language code
  {
    logger: (m) => {
      if (m.status === 'recognizing text') setProgress(m.progress);
    },
  }
);
```

**Available languages:** eng, fra, deu, spa, ita, por, chi_sim, chi_tra, jpn, kor, ara, rus...
Downloads language data on first use. Cache is automatic via IndexedDB.

---

### `exifr`
**Used by:** image-metadata
**Install:** `npm install exifr`

```js
import exifr from 'exifr';

const exif = await exifr.parse(file); // returns a flat object of EXIF data
// exif.Make, exif.Model, exif.FocalLength, exif.GPSLatitude, exif.GPSLongitude...

// Or parse specific tags only:
const gps = await exifr.gps(file); // { latitude, longitude }
```

---

### `jszip`
**Used by:** favicon-generator (batch ZIP download), pdf-to-png (multi-page ZIP)
**Install:** `npm install jszip`

```js
import JSZip from 'jszip';
import { downloadBlob } from '@/lib/tool-utils';

const zip = new JSZip();
zip.file('icon-32.png', pngBlob);
zip.file('icon-192.png', largePngBlob);
const zipBlob = await zip.generateAsync({ type: 'blob' });
downloadBlob(zipBlob, 'favicons.zip');
```

---

### `gif.js`
**Used by:** gif-maker
**Install:** `npm install gif.js`

```js
// gif.js requires its worker to be in /public/
// Copy: node_modules/gif.js/dist/gif.worker.js → public/gif.worker.js

import GIF from 'gif.js';

const gif = new GIF({
  workers: 2,
  quality: 10,           // 1=best, 30=worst
  workerScript: '/gif.worker.js',
  width: 480,
  height: 270,
});

// Add frames (canvas elements)
gif.addFrame(canvas1, { delay: 100 }); // delay in ms
gif.addFrame(canvas2, { delay: 100 });

gif.on('finished', (blob) => {
  downloadBlob(blob, 'output.gif');
});
gif.render();
```

**Setup step:** After `npm install gif.js`, add this to your implementation:
```js
// In the component, copy the worker to public if not already there
// You can verify by visiting /gif.worker.js in the browser
```

---

### `@imgly/background-removal`
**Used by:** background-remover
**Install:** `npm install @imgly/background-removal`

```js
import { removeBackground } from '@imgly/background-removal';

// file: File object (the input image)
const resultBlob = await removeBackground(file);
// resultBlob is a PNG with transparent background

downloadBlob(resultBlob, 'no-background.png');
```

**Note:** Downloads ~50MB WASM model on first use. Show a loading state:
```js
// The library fires progress events — you can listen to them
// First load is slow; subsequent uses are cached in the browser
```

---

### `@ffmpeg/ffmpeg` + `@ffmpeg/util`
**Used by:** audio-converter, video-converter, mp4-to-gif, gif-to-mp4, video-to-audio, audio-trimmer, video-trimmer
**Install:** `npm install @ffmpeg/ffmpeg @ffmpeg/util`

```js
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Initialize (do once, store in ref)
const ffmpeg = new FFmpeg();

// Load FFmpeg core (~25MB WASM download on first use)
await ffmpeg.load({
  coreURL: await toBlobURL(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    'text/javascript'
  ),
  wasmURL: await toBlobURL(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    'application/wasm'
  ),
});

// Track progress
ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)));

// Write input file
await ffmpeg.writeFile('input.mp4', await fetchFile(file));

// Run FFmpeg command
await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', 'output.mp3']);

// Read output
const data = await ffmpeg.readFile('output.mp3');
const blob = new Blob([data.buffer], { type: 'audio/mp3' });
downloadBlob(blob, 'output.mp3');
```

**Next.js config requirement** — add to `next.config.js` for cross-origin isolation (required for FFmpeg.wasm):
```js
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};
```

**Common FFmpeg commands:**

```bash
# Audio conversion
-i input.webm -c:a libmp3lame -b:a 192k output.mp3
-i input.mp3 -c:a pcm_s16le output.wav
-i input.mp3 -c:a aac -b:a 192k output.aac

# Video conversion
-i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4
-i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 output.webm

# Extract audio
-i input.mp4 -vn -c:a libmp3lame output.mp3

# Trim (fast, no re-encode)
-ss 00:00:10 -to 00:00:30 -i input.mp4 -c copy output.mp4

# MP4 to GIF
-i input.mp4 -vf "fps=15,scale=480:-1" -loop 0 output.gif

# GIF to MP4
-i input.gif -movflags faststart -pix_fmt yuv420p output.mp4
```

---

### `qrcode`
**Used by:** qr-code-generator
**Install:** `npm install qrcode`

```js
import QRCode from 'qrcode';

// Render to canvas
await QRCode.toCanvas(canvasElement, text, {
  errorCorrectionLevel: 'M', // L / M / Q / H
  width: 300,
  color: { dark: '#000000', light: '#ffffff' },
});

// Get as data URL
const dataUrl = await QRCode.toDataURL(text, { width: 300 });

// Get as SVG string
const svg = await QRCode.toString(text, { type: 'svg' });
```

---

### `jsQR`
**Used by:** qr-code-reader
**Install:** `npm install jsqr`

```js
import jsQR from 'jsqr';

// Get ImageData from canvas
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const code = jsQR(imageData.data, imageData.width, imageData.height);
if (code) {
  console.log(code.data); // the decoded QR content
}
```

---

### `jsbarcode`
**Used by:** barcode-generator
**Install:** `npm install jsbarcode`

```js
import JsBarcode from 'jsbarcode';

// Render to SVG element
JsBarcode(svgElement, '1234567890128', {
  format: 'EAN13',
  width: 2,
  height: 80,
  displayValue: true,
  fontSize: 14,
});

// Render to canvas
JsBarcode(canvasElement, value, { format: 'CODE128' });
```

**Formats:** CODE128, EAN13, EAN8, UPCA, CODE39, ITF14, MSI, Pharmacode

---

### `sql-formatter`
**Used by:** sql-formatter
**Install:** `npm install sql-formatter`

```js
import { format } from 'sql-formatter';

const formatted = format(rawSql, {
  language: 'postgresql', // 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'bigquery'
  tabWidth: 2,
  keywordCase: 'upper',
});
```

---

### `graphql`
**Used by:** graphql-formatter
**Install:** `npm install graphql`

```js
import { parse, print } from 'graphql';

try {
  const formatted = print(parse(rawGraphQL));
} catch (e) {
  // e.message contains syntax error details
}
```

---

### `diff`
**Used by:** diff-checker, text-diff
**Install:** `npm install diff`

```js
import * as Diff from 'diff';

// Line-by-line diff
const changes = Diff.diffLines(oldText, newText);
// changes: Array<{ value: string, added?: true, removed?: true }>

// Word diff
const wordChanges = Diff.diffWords(oldText, newText);
```

---

### `curlconverter`
**Used by:** curl-to-code
**Install:** `npm install curlconverter`

```js
import { toJavaScript, toPython, toPhp, toRuby, toGo } from 'curlconverter';

const jsCode    = toJavaScript(curlCommand);
const pyCode    = toPython(curlCommand);
const phpCode   = toPhp(curlCommand);
const rubyCode  = toRuby(curlCommand);
const goCode    = toGo(curlCommand);
```

---

### `cronstrue`
**Used by:** cron-builder
**Install:** `npm install cronstrue`

```js
import cronstrue from 'cronstrue';

const description = cronstrue.toString('*/5 * * * *');
// → "Every 5 minutes"

// Options
cronstrue.toString('0 9 * * 1-5', { use24HourTimeFormat: true, locale: 'en' });
```

---

### `@faker-js/faker`
**Used by:** dummy-data-generator
**Install:** `npm install @faker-js/faker`

```js
import { faker } from '@faker-js/faker';

// Generate one record
const record = {
  id:      faker.string.uuid(),
  name:    faker.person.fullName(),
  email:   faker.internet.email(),
  phone:   faker.phone.number(),
  company: faker.company.name(),
  address: faker.location.streetAddress(),
  city:    faker.location.city(),
  country: faker.location.country(),
  date:    faker.date.past().toISOString(),
  url:     faker.internet.url(),
  ip:      faker.internet.ip(),
  number:  faker.number.int({ min: 1, max: 1000 }),
  boolean: faker.datatype.boolean(),
};

// Generate bulk
const rows = Array.from({ length: 500 }, () => ({ ... }));
```

---

### No-dependency APIs (free, keyless)

These are public APIs used directly in tool components. No npm install needed.

| Tool | API | Endpoint |
|------|-----|----------|
| currency-converter | frankfurter.app | `https://api.frankfurter.app/latest?from=USD` |
| my-ip | ipify.org | `https://api.ipify.org?format=json` |
| ip-lookup | ip-api.com | `http://ip-api.com/json/{ip}` (HTTP only, no HTTPS on free tier) |
| dns-lookup | Google DoH | `https://dns.google/resolve?name={domain}&type=A` |
| whois-lookup | rdap.org | `https://rdap.org/domain/{domain}` |
| http-headers | corsproxy.io | `https://corsproxy.io/?{encodedUrl}` |
| redirect-checker | corsproxy.io | same proxy, check `X-Final-URL` header |
| canonical-checker | corsproxy.io | same proxy, parse HTML for `<link rel="canonical">` |
| link-extractor | corsproxy.io | same proxy, parse HTML for all `<a href>` |
| page-speed-insights | Google PSI | `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile` (no key for basic) |
| ssl-checker | crt.sh | `https://crt.sh/?q={domain}&output=json` |

---

## Pure-JS implementations (no npm package)

Some algorithms are simple enough to implement inline:

### MD5 (for hash-generator — not in SubtleCrypto)
```js
// Use this compact MD5 implementation (public domain):
// https://gist.github.com/jhoff/5685978 — copy inline into your tool file
// Or npm install md5 (32KB) if you prefer a package
```

### SubtleCrypto hashing (SHA-256, SHA-512)
```js
async function hashText(text, algorithm = 'SHA-256') {
  const bytes  = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
// algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
```

### SubtleCrypto HMAC (for JWT signing)
```js
async function signHmac(secret, data, algorithm = 'SHA-256') {
  const enc = new TextEncoder();
  const key  = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: algorithm }, false, ['sign']);
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  // Base64url encode the signature
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

### Fisher-Yates shuffle (for list-randomizer)
```js
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

### UUID v4 (built-in — no package needed)
```js
const uuid = crypto.randomUUID(); // native, available in all modern browsers
```

---

## next.config.js updates needed

Some tools require changes to `next.config.js`:

### FFmpeg.wasm (audio-converter, video-converter, etc.)
Requires COOP/COEP headers for SharedArrayBuffer:
```js
// next.config.js
const nextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    }];
  },
};
export default nextConfig;
```

### gif.js worker file
Copy worker to public after install:
```bash
cp node_modules/gif.js/dist/gif.worker.js public/gif.worker.js
```
Add this to `package.json` scripts for reproducibility:
```json
"postinstall": "cp node_modules/gif.js/dist/gif.worker.js public/gif.worker.js"
```
