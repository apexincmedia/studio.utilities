# Apex Studio Utilities — Tool Implementation Tracker

## Instructions for Codex

1. **Read CLAUDE.md first** (project root) — contains critical rules and the 3-step contract.
2. **Read docs/CODEX_PLAYBOOK.md** — all archetypes, CSS classes, icon usage, patterns.
3. **Read docs/TOOL_SPECS.md** — per-tool logic, options, and dependencies.
4. **Read docs/DEPS_GUIDE.md** — which npm packages to install and how to use them.
5. Work through tools in the order listed below. Mark each `[ ]` → `[x]` as you complete it.
6. Run `npm run build` every 10 tools and fix any errors before continuing.
7. Do NOT skip the 3-step contract for any tool: (1) create file, (2) flip status, (3) register.
8. Never hardcode hex colors. Never import from lucide-react directly. Never use Tailwind.

## Progress

**170 / 170 tools live** — Update this line as you work.

---

## File Conversion (28 tools)

> Archetype B — File in / File out. Use pdfjs-dist for rendering, pdf-lib for manipulation.
> See docs/DEPS_GUIDE.md for setup details on each library.

- [x] `image-compressor` — Image Compressor *(LIVE — reference implementation)*
- [x] `pdf-to-png` — PDF to PNG | Arch: B | Dep: `pdfjs-dist`
- [x] `pdf-to-jpg` — PDF to JPG | Arch: B | Dep: `pdfjs-dist`
- [x] `pdf-merge` — PDF Merger | Arch: B | Dep: `pdf-lib`
- [x] `pdf-split` — PDF Splitter | Arch: B | Dep: `pdf-lib`
- [x] `pdf-compress` — PDF Compressor | Arch: B | Dep: `pdf-lib`
- [x] `pdf-rotate` — PDF Page Rotator | Arch: B | Dep: `pdf-lib`
- [x] `pdf-watermark` — PDF Watermark | Arch: B | Dep: `pdf-lib`
- [x] `pdf-protect` — PDF Protector | Arch: B | Dep: `pdf-lib`
- [x] `pdf-unlock` — PDF Unlocker | Arch: B | Dep: `pdf-lib`
- [x] `image-to-pdf` — Image to PDF | Arch: B | Dep: `pdf-lib`
- [x] `markdown-to-pdf` — Markdown to PDF | Arch: A→B | Dep: `marked`, `jspdf`
- [x] `html-to-pdf` — HTML to PDF | Arch: A→B | Dep: `jspdf`, `html2canvas`
- [x] `txt-to-pdf` — TXT to PDF | Arch: A→B | Dep: `jspdf`
- [x] `csv-to-json` — CSV to JSON | Arch: A | Dep: none
- [x] `json-to-csv` — JSON to CSV | Arch: A | Dep: none
- [x] `xml-to-json` — XML to JSON | Arch: A | Dep: `fast-xml-parser`
- [x] `json-to-xml` — JSON to XML | Arch: A | Dep: `fast-xml-parser`
- [x] `pdf-to-word` — PDF to Word | Arch: B | Dep: `pdfjs-dist` *(text extraction only — see specs)*
- [x] `pdf-to-excel` — PDF to Excel | Arch: B | Dep: `pdfjs-dist`, `xlsx` *(table extraction)*
- [x] `pdf-to-powerpoint` — PDF to PowerPoint | Arch: B | Dep: `pdfjs-dist` *(slides as images)*
- [x] `word-to-pdf` — Word to PDF | Arch: B | Dep: `mammoth`, `jspdf` *(limited — see specs)*
- [x] `excel-to-pdf` — Excel to PDF | Arch: B | Dep: `xlsx`, `jspdf`
- [x] `powerpoint-to-pdf` — PowerPoint to PDF | Arch: B | Dep: `pptxgenjs`*(see specs)*
- [x] `epub-to-pdf` — EPUB to PDF | Arch: B | Dep: `epubjs`, `jspdf`
- [x] `rtf-to-pdf` — RTF to PDF | Arch: B | Dep: `rtf.js`, `jspdf`
- [x] `odt-to-pdf` — ODT to PDF | Arch: B | Dep: `jspdf` *(limited — see specs)*
- [x] `numbers-to-excel` — Numbers to Excel | Arch: B | Dep: *(see specs)*
- [x] `pages-to-pdf` — Pages to PDF | Arch: B | Dep: *(see specs)*

---

## Image Tools (22 tools)

> Archetype B — File in / File out. Use Canvas API for most image ops.

- [x] `image-compressor` — Image Compressor *(LIVE — reference implementation)*
- [x] `image-resizer` — Image Resizer | Arch: B | Dep: none (Canvas API)
- [x] `image-cropper` — Image Cropper | Arch: B | Dep: none (Canvas API + drag UI)
- [x] `image-flip-rotate` — Image Flip & Rotate | Arch: B | Dep: none (Canvas API)
- [x] `image-watermark` — Image Watermark | Arch: B | Dep: none (Canvas API)
- [x] `jpg-to-png` — JPG to PNG | Arch: B | Dep: none (Canvas API)
- [x] `png-to-jpg` — PNG to JPG | Arch: B | Dep: none (Canvas API)
- [x] `webp-converter` — WebP Converter | Arch: B | Dep: none (Canvas API)
- [x] `avif-converter` — AVIF Converter | Arch: B | Dep: none (Canvas API)
- [x] `svg-to-png` — SVG to PNG | Arch: B | Dep: none (Canvas API)
- [x] `heic-to-jpg` — HEIC to JPG | Arch: B | Dep: `heic2any`
- [x] `image-to-base64` — Image to Base64 | Arch: B | Dep: none (FileReader)
- [x] `base64-to-image` — Base64 to Image | Arch: A | Dep: none (preview + download)
- [x] `png-to-base64` — PNG to Base64 | Arch: B | Dep: none (FileReader)
- [x] `favicon-generator` — Favicon Generator | Arch: B | Dep: `jszip` (Canvas + ZIP)
- [x] `gif-maker` — GIF Maker | Arch: B | Dep: `gif.js`
- [x] `image-upscaler` — AI Image Upscaler | Arch: B | Dep: none (CSS + Canvas upscale)
- [x] `background-remover` — Background Remover | Arch: B | Dep: `@imgly/background-removal`
- [x] `ocr-tool` — OCR Tool | Arch: B | Dep: `tesseract.js`
- [x] `png-to-svg` — PNG to SVG | Arch: B | Dep: `potrace` / `imagetracer`
- [x] `sprite-sheet-generator` — Sprite Sheet Generator | Arch: B | Dep: none (Canvas)
- [x] `image-metadata` — Image Metadata Viewer | Arch: E | Dep: `exifr`
- [x] `image-color-picker` — Color Picker | Arch: E | Dep: none (Canvas getImageData)

---

## Media & Downloaders (14 tools)

> Mixed archetypes. FFmpeg.wasm for audio/video conversion. Downloaders are UI-only stubs
> (server API required for actual download — implement full UI, `Download` shows integration note).

- [x] `audio-converter` — Audio Converter | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `video-converter` — Video Converter | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `mp4-to-gif` — MP4 to GIF | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `gif-to-mp4` — GIF to MP4 | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `video-to-audio` — Video to Audio | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `audio-trimmer` — Audio Trimmer | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `video-trimmer` — Video Trimmer | Arch: B | Dep: `@ffmpeg/ffmpeg`, `@ffmpeg/util`
- [x] `sound-recorder` — Sound Recorder | Arch: C | Dep: none (MediaRecorder API)
- [x] `screen-recorder` — Screen Recorder | Arch: C | Dep: none (Screen Capture API)
- [x] `youtube-to-mp3` — YouTube to MP3 | Arch: UI-stub | *See specs — URL form + quality picker*
- [x] `youtube-to-mp4` — YouTube to MP4 | Arch: UI-stub | *See specs — URL form + quality picker*
- [x] `tiktok-downloader` — TikTok Downloader | Arch: UI-stub | *URL form*
- [x] `instagram-downloader` — Instagram Downloader | Arch: UI-stub | *URL form*
- [x] `twitter-video-downloader` — Twitter/X Downloader | Arch: UI-stub | *URL form*

---

## Developer Tools (30 tools)

> Archetype A — Text in / Text out. Most are formatters / converters.

- [x] `json-formatter` — JSON Formatter | Arch: A | Dep: none (JSON.parse/stringify)
- [x] `yaml-to-json` — YAML to JSON | Arch: A | Dep: `js-yaml`
- [x] `json-to-yaml` — JSON to YAML | Arch: A | Dep: `js-yaml`
- [x] `xml-formatter` — XML Formatter | Arch: A | Dep: `fast-xml-parser`
- [x] `html-formatter` — HTML Formatter / Minifier | Arch: A | Dep: `prettier` (browser build)
- [x] `css-minifier` — CSS Minifier / Beautifier | Arch: A | Dep: `clean-css` (CDN) or manual
- [x] `js-minifier` — JS Minifier | Arch: A | Dep: `terser` (browser build)
- [x] `sql-formatter` — SQL Formatter | Arch: A | Dep: `sql-formatter`
- [x] `regex-tester` — Regex Tester | Arch: A | Dep: none (JS RegExp)
- [x] `cron-builder` — Cron Builder | Arch: C | Dep: `cronstrue`
- [x] `uuid-generator` — UUID Generator | Arch: C | Dep: none (crypto.randomUUID)
- [x] `hash-generator` — Hash Generator | Arch: A | Dep: none (SubtleCrypto API)
- [x] `color-converter` — Color Converter | Arch: D | Dep: none (math)
- [x] `diff-checker` — Diff Checker | Arch: A | Dep: `diff`
- [x] `markdown-to-html` — Markdown to HTML | Arch: A | Dep: `marked`
- [x] `html-to-markdown` — HTML to Markdown | Arch: A | Dep: `turndown`
- [x] `json-to-typescript` — JSON to TypeScript | Arch: A | Dep: `json-to-ts` or manual
- [x] `http-status-codes` — HTTP Status Reference | Arch: E | Dep: none (static data)
- [x] `api-response-formatter` — API Response Formatter | Arch: A | Dep: none (JSON tree)
- [x] `graphql-formatter` — GraphQL Formatter | Arch: A | Dep: `graphql` (format fn)
- [x] `toml-to-json` — TOML to JSON | Arch: A | Dep: `@iarna/toml`
- [x] `jwt-decoder` — JWT Decoder | Arch: A | Dep: none (Base64 decode)
- [x] `color-contrast-checker` — Color Contrast Checker | Arch: D | Dep: none (WCAG math)
- [x] `minifier-html-css-js` — Multi-Language Minifier | Arch: A | Dep: (see html/css/js minifier deps)
- [x] `htaccess-generator` — .htaccess Generator | Arch: C | Dep: none (template output)
- [x] `curl-to-code` — cURL to Code | Arch: A | Dep: `curlconverter`
- [x] `css-gradient-generator` — CSS Gradient Generator | Arch: C | Dep: none (live preview)
- [x] `css-box-shadow-generator` — CSS Box Shadow Generator | Arch: C | Dep: none
- [x] `css-flexbox-generator` — Flexbox Generator | Arch: C | Dep: none (live preview)
- [x] `dummy-data-generator` — Dummy Data Generator | Arch: C | Dep: `@faker-js/faker`

---

## Text Tools (18 tools)

> Archetype A — Text in / Text out. Pure JS, no dependencies needed.

- [x] `word-counter` — Word Counter | Arch: A | Dep: none
- [x] `case-converter` — Case Converter | Arch: A | Dep: none
- [x] `lorem-ipsum` — Lorem Ipsum Generator | Arch: C | Dep: none
- [x] `slug-generator` — Slug Generator | Arch: A | Dep: none
- [x] `duplicate-line-remover` — Duplicate Line Remover | Arch: A | Dep: none
- [x] `text-sorter` — Text Sorter | Arch: A | Dep: none
- [x] `whitespace-cleaner` — Whitespace Cleaner | Arch: A | Dep: none
- [x] `text-reverser` — Text Reverser | Arch: A | Dep: none
- [x] `text-diff` — Text Diff | Arch: A | Dep: `diff`
- [x] `readability-score` — Readability Score | Arch: A | Dep: none (formulas)
- [x] `find-and-replace` — Find & Replace | Arch: A | Dep: none
- [x] `text-truncator` — Text Truncator | Arch: A | Dep: none
- [x] `character-limit-checker` — Character Limit Checker | Arch: A | Dep: none
- [x] `list-randomizer` — List Randomizer | Arch: A | Dep: none
- [x] `number-extractor` — Number Extractor | Arch: A | Dep: none
- [x] `email-extractor` — Email Extractor | Arch: A | Dep: none
- [x] `text-to-speech` — Text to Speech | Arch: A | Dep: none (Web Speech API)
- [x] `speech-to-text` — Speech to Text | Arch: C | Dep: none (Web Speech API)

---

## Encoding & Decoding (16 tools)

> Mostly Archetype A. base64-encoder is the live reference implementation.

- [x] `base64-encoder` — Base64 Encoder / Decoder *(LIVE — reference implementation)*
- [x] `url-encoder` — URL Encoder / Decoder | Arch: A | Dep: none (encodeURIComponent)
- [x] `html-entities` — HTML Entity Encoder | Arch: A | Dep: none
- [x] `qr-code-generator` — QR Code Generator | Arch: C | Dep: `qrcode`
- [x] `qr-code-reader` — QR Code Reader | Arch: B | Dep: `jsQR`
- [x] `barcode-generator` — Barcode Generator | Arch: C | Dep: `jsbarcode`
- [x] `jwt-generator` — JWT Generator | Arch: C | Dep: none (SubtleCrypto HMAC)
- [x] `binary-converter` — Binary Converter | Arch: A | Dep: none
- [x] `hex-encoder` — Hex Encoder / Decoder | Arch: A | Dep: none
- [x] `morse-code` — Morse Code Translator | Arch: A | Dep: none (+ AudioContext for sound)
- [x] `png-to-base64` — PNG to Base64 | Arch: B | Dep: none (FileReader)
- [x] `rot13` — ROT13 Encoder | Arch: A | Dep: none
- [x] `caesar-cipher` — Caesar Cipher | Arch: A | Dep: none
- [x] `unicode-lookup` — Unicode Lookup | Arch: D/E | Dep: none (codePointAt)
- [x] `ascii-table` — ASCII Table | Arch: E | Dep: none (static table)
- [x] `text-to-binary` — Text to Binary | Arch: A | Dep: none

---

## Calculators (20 tools)

> Archetype D — Input fields, calculated output. No file I/O.

- [x] `percentage-calculator` — Percentage Calculator | Arch: D | Dep: none
- [x] `unit-converter` — Unit Converter | Arch: D | Dep: none (conversion tables)
- [x] `data-storage-converter` — Data Storage Converter | Arch: D | Dep: none
- [x] `number-base-converter` — Number Base Converter | Arch: D | Dep: none
- [x] `roman-numerals` — Roman Numeral Converter | Arch: D | Dep: none
- [x] `timestamp-converter` — Unix Timestamp Converter | Arch: D | Dep: none
- [x] `age-calculator` — Age Calculator | Arch: D | Dep: none
- [x] `date-calculator` — Date Calculator | Arch: D | Dep: none
- [x] `timezone-converter` — Time Zone Converter | Arch: D | Dep: none (Intl API)
- [x] `aspect-ratio-calculator` — Aspect Ratio Calculator | Arch: D | Dep: none
- [x] `bmi-calculator` — BMI Calculator | Arch: D | Dep: none
- [x] `tdee-calculator` — TDEE Calculator | Arch: D | Dep: none
- [x] `tip-calculator` — Tip Calculator | Arch: D | Dep: none
- [x] `gpa-calculator` — GPA Calculator | Arch: D | Dep: none
- [x] `mortgage-calculator` — Mortgage Calculator | Arch: D | Dep: none
- [x] `compound-interest` — Compound Interest Calculator | Arch: D | Dep: none
- [x] `electricity-cost-calculator` — Electricity Cost Calculator | Arch: D | Dep: none
- [x] `vat-calculator` — VAT Calculator | Arch: D | Dep: none
- [x] `scientific-calculator` — Scientific Calculator | Arch: D | Dep: none (eval-safe math)
- [x] `currency-converter` — Currency Converter | Arch: D | Dep: none (frankfurter.app API 🌐)

---

## Security & Network (12 tools)

> Mix of C (generators) and E (viewers/network). Client-side where possible, free APIs otherwise.

- [x] `password-generator` — Password Generator | Arch: C | Dep: none (crypto.getRandomValues)
- [x] `password-strength-checker` — Password Strength Checker | Arch: A | Dep: none
- [x] `random-token-generator` — Random Token Generator | Arch: C | Dep: none (SubtleCrypto)
- [x] `hash-generator` — Hash Generator | Arch: A | Dep: none (SubtleCrypto)
- [x] `file-hash-checker` — File Hash Checker | Arch: B | Dep: none (SubtleCrypto)
- [x] `user-agent-parser` — User Agent Parser | Arch: A | Dep: none (regex parse)
- [x] `my-ip` — What Is My IP | Arch: E | Dep: none (api.ipify.org 🌐)
- [x] `ip-lookup` — IP Lookup / Geolocation | Arch: E | Dep: none (ip-api.com 🌐)
- [x] `dns-lookup` — DNS Lookup | Arch: E | Dep: none (dns.google DoH 🌐)
- [x] `whois-lookup` — WHOIS Lookup | Arch: E | Dep: none (rdap.org 🌐)
- [x] `ssl-checker` — SSL Certificate Checker | Arch: E | Dep: none (fetch + parse 🌐)
- [x] `http-headers` — HTTP Header Viewer | Arch: E | Dep: none (corsproxy 🌐)
- [x] `open-port-checker` — Open Port Checker | Arch: E | Dep: none (fetch probe 🌐)

---

## SEO & Web (10 tools)

> Mix of C (generators) and E (network tools).

- [x] `meta-tag-generator` — Meta Tag Generator | Arch: C | Dep: none
- [x] `og-tag-generator` — Open Graph Generator | Arch: C | Dep: none
- [x] `robots-txt-generator` — Robots.txt Generator | Arch: C | Dep: none
- [x] `sitemap-generator` — XML Sitemap Generator | Arch: C | Dep: none
- [x] `utm-builder` — UTM Link Builder | Arch: C | Dep: none
- [x] `keyword-density` — Keyword Density Analyzer | Arch: A | Dep: none
- [x] `link-extractor` — Link Extractor | Arch: A | Dep: none (DOMParser)
- [x] `canonical-checker` — Canonical Tag Checker | Arch: E | Dep: none (fetch 🌐)
- [x] `redirect-checker` — Redirect Checker | Arch: E | Dep: none (fetch chain 🌐)
- [x] `page-speed-insights` — Page Speed Insights | Arch: E | Dep: none (PSI API 🌐)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[x]` | Implemented and live |
| `[ ]` | Not yet started |
| Arch: A | Text-in / Text-out |
| Arch: B | File-in / File-out |
| Arch: C | Generator (produces output from UI controls) |
| Arch: D | Calculator (numeric input → computed output) |
| Arch: E | Viewer / Reference / Network tool |
| 🌐 | Calls a free public API — no key required |
| Dep: | npm package to `npm install` before implementing |
