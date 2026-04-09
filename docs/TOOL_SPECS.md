# Apex Studio Utilities — Per-Tool Implementation Specs

> Reference for Codex. Each entry tells you what the tool does, what archetype to use,
> which library handles the heavy lifting, key options to expose, and gotchas to avoid.
>
> Always check docs/DEPS_GUIDE.md for library setup before implementing.
> Always use tools/_TEMPLATE_[ARCH].jsx as your starting base.

---

## FILE CONVERSION

### csv-to-json
**Arch:** A · **Dep:** none
**Logic:** Split by newline, first row = headers, remaining rows = data. Handle quoted fields (RFC 4180), custom delimiters (`,` `;` `\t`). Return array of objects.
**Options:** Delimiter (auto-detect/comma/semicolon/tab), Trim whitespace checkbox
**Output:** Prettified JSON with 2-space indent. Download as `.json`.
**Notes:** Auto-detect delimiter by checking which of `,;|\t` appears most in the first line.

### json-to-csv
**Arch:** A · **Dep:** none
**Logic:** Parse JSON array, extract all keys as headers (union of all object keys). For nested objects, use dot-notation key flattening (`address.city`). Quote values containing commas/newlines.
**Options:** Flatten nested (checkbox), Include header row (checkbox)
**Output:** CSV text. Download as `.csv`.
**Notes:** If input is a single object (not array), wrap it in an array. Show row count after processing.

### xml-to-json
**Arch:** A · **Dep:** `fast-xml-parser`
**Logic:** `new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' }).parse(input)`. Prettify with `JSON.stringify(result, null, 2)`.
**Options:** Preserve attributes (checkbox), Parse numbers (checkbox)
**Notes:** Wrap in try/catch — show red error panel on parse failure.

### json-to-xml
**Arch:** A · **Dep:** `fast-xml-parser`
**Logic:** `new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_' }).build(JSON.parse(input))`. Add XML declaration at top.
**Options:** Root element name (text input, default: `root`), Pretty print (checkbox)
**Notes:** Handle invalid JSON with red error panel.

### markdown-to-pdf
**Arch:** A→B · **Dep:** `marked`, `jspdf`
**Logic:** `marked.parse(input)` → HTML string → inject into a hidden div → use `html2canvas` to render → add to `jsPDF` page. OR use jsPDF's `html()` method.
**Options:** Page size (A4/Letter), Font size (10/12/14), Margins (tight/normal/wide)
**Output:** Download as `.pdf`.
**Notes:** jsPDF works for basic formatted text. Complex layouts may not render perfectly — that's acceptable.

### html-to-pdf
**Arch:** A→B · **Dep:** `jspdf`, `html2canvas`
**Logic:** Render the HTML input into a hidden iframe or div → `html2canvas(element)` → add canvas image to `jsPDF` page.
**Options:** Page size (A4/Letter/A3), Orientation (portrait/landscape)
**Output:** Download as `.pdf`.
**Notes:** Sandboxed rendering — styles from globals.css will not apply to the rendered HTML.

### txt-to-pdf
**Arch:** A→B · **Dep:** `jspdf`
**Logic:** Split input by newlines → `doc.text(line, margin, y)` for each line, incrementing y. New page when y exceeds page height.
**Options:** Font size (10-18), Page size (A4/Letter), Line height (1.2/1.5/2.0)
**Output:** Download as `.pdf`.

### pdf-to-png / pdf-to-jpg
**Arch:** B · **Dep:** `pdfjs-dist`
**Logic:** Load PDF bytes into `pdfjsLib.getDocument()`. For each page: `page.render({ canvasContext, viewport })`. Export canvas as `canvas.toDataURL('image/png')` or `'image/jpeg'`. Download all pages as individual files or a ZIP.
**Options:** Resolution DPI (72/150/300 — multiply viewport scale by DPI/72), Output format (PNG/JPG), JPEG quality slider (for JPG)
**Notes:** Set `workerSrc` to CDN: `pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'`. Show per-page thumbnail previews. Batch download uses `jszip` + `downloadBlob`.

### pdf-merge
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** Accept multiple PDF files (drag-to-reorder). Load each as `PDFDocument.load(bytes)`. Create a new `PDFDocument`, iterate files, copy all pages with `newDoc.copyPages(src, srcDoc.getPageIndices())`, add them all. `await newDoc.save()` → download.
**Options:** Drag-to-reorder file list (sortable list UI)
**Notes:** Show file list with page count badges. Sort order determines merge order.

### pdf-split
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** Load PDF. Mode 1: split to individual pages — create one PDFDocument per page. Mode 2: split by range — parse range input (`1-3,5,7-9`), create one doc per range.
**Options:** Mode radio (Every page / Custom ranges), Range input field
**Output:** Individual `.pdf` files — offer ZIP download when 3+ files.
**Notes:** Page numbering is 1-based in UI, 0-based in pdf-lib API.

### pdf-compress
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** Re-save the PDF via pdf-lib with lower image quality. `PDFDocument.load(bytes)`. For each embedded image, re-encode at lower quality. `doc.save({ useObjectStreams: true })`.
**Options:** Compression level radio (Light / Standard / Aggressive — maps to JPEG quality 85/70/50)
**Notes:** pdf-lib compression is limited — show "best-effort client-side compression" in trust badge area. Show before/after file size.

### pdf-rotate
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** Load PDF. Apply rotation: `page.setRotation(degrees({ degrees: 90 }))`. Options to rotate all or selected page range.
**Options:** Rotation (90° CW / 180° / 90° CCW), Target (All pages / Range input)

### pdf-watermark
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** Load PDF. For each page, draw text or image on the page at a given position. Use `page.drawText(text, { x, y, size, opacity, rotate })`.
**Options:** Mode (Text / Image), Text input, Font size, Opacity slider, Position (center/diagonal/top-left/etc.), Angle (-45° diagonal is common default)
**Notes:** For diagonal watermark: use `rotate: degrees(-45)`, position at center of page.

### pdf-protect
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** `PDFDocument.load(bytes)` → `doc.encrypt({ userPassword: '...', ownerPassword: '...', permissions: { ... } })` → `doc.save()`.
**Options:** User password (can be empty), Owner password (required), Permissions checkboxes (allow print, copy, edit)
**Notes:** pdf-lib uses 128-bit RC4 — note this in the UI.

### pdf-unlock
**Arch:** B · **Dep:** `pdf-lib`
**Logic:** `PDFDocument.load(bytes, { password: enteredPassword })` → `doc.save()` without encryption.
**Options:** Password input field
**Notes:** If no password provided, try loading without one (owner-restricted PDFs may open). Show error clearly if password incorrect.

### image-to-pdf
**Arch:** B · **Dep:** `jspdf`
**Logic:** Accept multiple images (JPG/PNG/WEBP). For each, use `URL.createObjectURL` to load, then `doc.addImage(dataUrl, format, x, y, w, h)`. One image per page. `doc.save()`.
**Options:** Page size (A4/Letter/Fit to image), Margins (none/small/medium), Page orientation (auto/portrait/landscape)
**Notes:** "Fit to image" makes the PDF page the same size as the image.

### pdf-to-word
**Arch:** B · **Dep:** `pdfjs-dist`
**Logic:** Extract text content from each PDF page via `page.getTextContent()`. Preserve line breaks. Generate a `.txt` file or a basic `.docx` using the `docx` library.
**Options:** Output format radio (Plain TXT / Basic DOCX)
**Notes:** True PDF→Word with formatting preservation requires server-side processing. This is a best-effort text extraction. Show a note: "Complex layouts and formatting may not be preserved. For advanced conversion, use a desktop PDF editor."

### pdf-to-excel
**Arch:** B · **Dep:** `pdfjs-dist`, `xlsx`
**Logic:** Extract text content. Attempt to detect table structure by analyzing x-positions of text items (items with similar y = same row, sorted by x = columns). Build 2D array → `xlsx.utils.aoa_to_sheet()` → workbook → download.
**Options:** Detect tables automatically (checkbox), Output format (XLSX/CSV)
**Notes:** Table detection is heuristic. Show note about limitations. Works best on PDFs with clean table layouts.

### pdf-to-powerpoint
**Arch:** B · **Dep:** `pdfjs-dist`, `pptxgenjs`
**Logic:** Render each PDF page to a canvas image (like pdf-to-png). Add each canvas image as a full-slide image in a new pptxgenjs presentation. `pres.addSlide().addImage({ path: dataUrl, ... })`.
**Options:** Resolution DPI, Slide size (16:9 / 4:3)
**Notes:** Slides will be image-based (not editable text). Show this disclaimer.

### word-to-pdf
**Arch:** B · **Dep:** `mammoth`
**Logic:** `mammoth.convertToHtml({ arrayBuffer })` → get HTML string → use jsPDF html() method to render to PDF.
**Options:** Page size (A4/Letter)
**Notes:** mammoth converts .docx to HTML. Complex Word styles will not be preserved. Show disclaimer. Only accepts .docx (not older .doc).

### excel-to-pdf
**Arch:** B · **Dep:** `xlsx`, `jspdf`
**Logic:** `xlsx.read(arrayBuffer)`. For each sheet, convert to HTML table via `xlsx.utils.sheet_to_html()`. Render HTML table to PDF via jsPDF html() or html2canvas.
**Options:** Sheet selector (if multiple), Orientation (portrait/landscape), Scale

### powerpoint-to-pdf
**Arch:** B · **Dep:** `pptxgenjs` does not read PPTX. Use note approach.
**Logic:** This is extremely difficult client-side. Best approach: accept .pptx, extract slide images if possible, or show a professional "upload and convert" UI that calls out to a placeholder API endpoint. Implement full UI stub with a clear note: "PPTX→PDF requires server processing. UI ready for API integration at POST /api/convert/pptx-to-pdf."
**Options:** Full form UI with file drop, page count display, convert button

### epub-to-pdf
**Arch:** B · **Dep:** `epubjs`, `jspdf`
**Logic:** `new Epub(arrayBuffer)` → iterate chapters → render each chapter HTML → jsPDF html() to add pages.
**Notes:** epubjs uses dynamic import. Best-effort conversion — complex EPUB layouts may not preserve perfectly.

### rtf-to-pdf
**Arch:** B · **Dep:** manual RTF parser or `rtf.js`
**Logic:** Parse RTF to HTML (basic tags only), then jsPDF html(). RTF is complex — limit to basic text + bold/italic.
**Notes:** Best-effort. Show disclaimer.

### odt-to-pdf / numbers-to-excel / pages-to-pdf
**Arch:** B · **Dep:** No mature client-side library exists.
**Logic:** Implement a polished UI stub: file dropzone, metadata display (file name, size, type), and a "Convert" button that shows: "This format requires server-side processing. The UI is complete and ready for API integration at POST /api/convert/[format]-to-[target]."
**Notes:** Do NOT fake conversion. The UI should look professional and production-ready. The convert button should show a professional "Coming soon — server integration needed" modal.

---

## IMAGE TOOLS

### image-resizer
**Arch:** B · **Dep:** none
**Logic:** Load image onto canvas, drawImage at new dimensions. Respect aspect ratio by default.
**Options:** Width + Height inputs with lock-ratio toggle, Scale % input, Fit mode (exact/contain/cover), Output format (original/JPG/PNG/WEBP), Quality slider (for JPEG/WEBP)
**Notes:** Show current dimensions in the dropzone after loading. Batch mode: apply same settings to all files.

### image-cropper
**Arch:** B · **Dep:** none
**Logic:** Load image into an `<img>` element. Overlay a draggable/resizable crop rect using mouse events. On crop: draw the cropped region onto a canvas, export.
**Options:** Aspect ratio presets (Free / 1:1 / 16:9 / 4:3 / 3:2), Exact pixel input fields, Output format
**Notes:** Draw the crop overlay with CSS — a semi-transparent dark overlay outside the selection. Show current crop dimensions live.

### image-flip-rotate
**Arch:** B · **Dep:** none
**Logic:** Load image to canvas. For flip H: `ctx.scale(-1, 1); ctx.drawImage(img, -w, 0)`. For flip V: `ctx.scale(1, -1)`. For rotation: use `ctx.rotate(angle)` with translated origin.
**Options:** Quick buttons: Flip H, Flip V, Rotate 90° CW, Rotate 90° CCW, Rotate 180°. Custom angle input (0-360).
**Notes:** Allow combining operations (flip + rotate). Show live preview.

### image-watermark
**Arch:** B · **Dep:** none
**Logic:** Load base image to canvas. For text watermark: `ctx.fillText(text, x, y)`. For image watermark: load watermark image, `ctx.drawImage(wmImg, x, y, w, h)`.
**Options:** Mode (Text / Image), Text input + font size + color, Image upload for logo, Position (9 positions: TL/TC/TR/ML/MC/MR/BL/BC/BR), Opacity slider, Padding from edge
**Notes:** Batch: apply same watermark to multiple uploaded images.

### jpg-to-png / png-to-jpg / webp-converter / avif-converter
**Arch:** B · **Dep:** none
**Logic:** Load image via FileReader, draw to canvas, export as target format: `canvas.toDataURL('image/png')`, `'image/jpeg'`, `'image/webp'`.
**Options:** Quality slider (for lossy formats), Output format selector (these all share similar logic — `webp-converter` and `avif-converter` are bidirectional)
**Notes:** Check browser support for AVIF: `canvas.toDataURL('image/avif')` — if empty result, show "AVIF not supported in this browser." For JPG: set white background before drawing (PNG alpha → white).

### svg-to-png
**Arch:** B · **Dep:** none
**Logic:** Read SVG text via FileReader. Create a Blob URL, load in an Image, draw to canvas at target resolution. `URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))`.
**Options:** Output width (px), Scale multiplier (1×/2×/3×/4×), Background (transparent/white/custom color), Output format (PNG/JPG)
**Notes:** Transparent background on PNG is supported natively.

### heic-to-jpg
**Arch:** B · **Dep:** `heic2any`
**Logic:** `heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })` → Blob → download.
**Options:** Quality slider, Output format (JPG/PNG), Batch support
**Notes:** heic2any is slow for large files — show a progress indicator. Warn if file doesn't appear to be HEIC.

### image-to-base64 / png-to-base64
**Arch:** B · **Dep:** none
**Logic:** FileReader `readAsDataURL(file)` → result is the full Base64 data URI. Show in output textarea. Show character count. Offer copy and download buttons.
**Options:** Include data URI prefix (checkbox, default on), Format (full URI / raw base64 only)
**Notes:** Large images produce very long strings — warn above ~500KB.

### base64-to-image
**Arch:** A · **Dep:** none
**Logic:** Strip optional data URI prefix if present. `atob(b64)` → detect format from first bytes (magic numbers). Show `<img src={dataUrl}>` preview. Offer download with correct extension.
**Options:** none (auto-detect format)
**Notes:** Magic bytes: JPEG = `FF D8`, PNG = `89 50 4E 47`, GIF = `47 49 46`, WEBP = check RIFF header.

### favicon-generator
**Arch:** B · **Dep:** `jszip`
**Logic:** Load source image to canvas. Resize to multiple sizes: 16×16, 32×32, 48×48, 64×64, 128×128, 180×180 (Apple Touch), 192×192 (Android). Export each as PNG dataURL. Package all into a ZIP + generate an HTML snippet with all `<link>` tags.
**Options:** Source image upload, Preview grid showing all sizes
**Notes:** ICO format creation client-side is complex — deliver multiple PNGs + the HTML snippet. Show a note: "Most modern browsers and tools accept PNG favicons."

### gif-maker
**Arch:** B · **Dep:** `gif.js`
**Logic:** Accept multiple images (or video frames). Use gif.js to encode frames into an animated GIF. `const gif = new GIF({ workers: 2, quality: 10 })`. Add each frame: `gif.addFrame(canvas, { delay: 100 })`. `gif.render()` → Blob.
**Options:** Frame delay (ms), Loop (infinite / count), Resize output (width px), Quality (1-10)
**Notes:** gif.js requires a worker file — copy `gif.worker.js` to `/public/gif.worker.js` and set `workerScript: '/gif.worker.js'` in options.

### image-upscaler
**Arch:** B · **Dep:** none
**Logic:** Use canvas to upscale with `imageSmoothingQuality = 'high'` and CSS `image-rendering`. For "AI" upscaling without a model: draw image at 2× or 4× size, apply an unsharp mask effect (draw to canvas, apply sharpen kernel via `ctx.getImageData`).
**Options:** Scale factor (2× / 4×), Sharpening (none/light/strong)
**Notes:** True AI upscaling (like real-esrgan) requires WebGL and a model download — too heavy for this project. Implement canvas-based bicubic upscale + sharpening. Label the feature "Enhanced Upscaler" not "AI" to be accurate.

### background-remover
**Arch:** B · **Dep:** `@imgly/background-removal`
**Logic:** `import { removeBackground } from '@imgly/background-removal'` → `removeBackground(imageFile)` → Blob (PNG with transparent background).
**Options:** Output format (PNG with transparency / JPEG with white bg / JPEG with custom bg color)
**Notes:** First run downloads a ~50MB WASM model. Show a loading state with "Loading AI model (first use only)…" progress indicator.

### ocr-tool
**Arch:** B · **Dep:** `tesseract.js`
**Logic:** `Tesseract.recognize(imageFile, 'eng', { logger: m => updateProgress(m.progress) })` → `data.text`.
**Options:** Language selector (eng/fra/deu/spa/chi_sim etc), Output mode (plain text / with confidence scores), Preserve layout (checkbox)
**Notes:** First run downloads language data (~10MB). Show progress bar during recognition. Support multiple file uploads (process sequentially).

### png-to-svg
**Arch:** B · **Dep:** `imagetracer` or `potrace-wasm`
**Logic:** Use ImageTracer.js (client-side) to convert raster to vector paths. `ImageTracer.imageToSVG(canvas, svgString => ...)`.
**Options:** Number of colors (2/4/8/16), Smoothing, Line threshold
**Notes:** Works best on logos/icons with clear edges. For photos, result will be very large and complex. Show a preview of the SVG output.

### sprite-sheet-generator
**Arch:** B · **Dep:** none
**Logic:** Accept multiple images. Calculate grid layout (auto-pack or n-column). Draw all images onto one large canvas. Output the combined PNG + a CSS file with background-position rules for each sprite.
**Options:** Columns (auto/2/4/6), Padding between sprites (px), Output scale
**Notes:** Name CSS classes after original filenames (strip extension, slugify).

### image-metadata
**Arch:** E · **Dep:** `exifr`
**Logic:** `exifr.parse(file)` → returns EXIF object. Display in a clean key-value table with sections (Camera, Exposure, Location, etc.). Location: if GPS data exists, show lat/lon + a static map link.
**Options:** Strip metadata checkbox (downloads a clean copy via canvas re-export)
**Notes:** Group EXIF keys into logical sections. Hide raw/technical tags, surface the useful ones first.

### image-color-picker
**Arch:** E · **Dep:** none
**Logic:** Load image to canvas. On click: `ctx.getImageData(x, y, 1, 1).data` → [R, G, B, A]. Convert to HEX, HSL, CMYK. Also run color quantization (median cut or k-means on sampled pixels) to extract top 8 palette colors.
**Options:** Show palette extraction (checkbox), Copy format (HEX/RGB/HSL)
**Notes:** Show a crosshair cursor over the image while picking. Display sampled color as a large swatch alongside all format values.

---

## MEDIA & DOWNLOADERS

### audio-converter / video-converter / video-to-audio / mp4-to-gif / gif-to-mp4
**Arch:** B · **Dep:** `@ffmpeg/ffmpeg`, `@ffmpeg/util`
**Logic:**
```
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
const ffmpeg = new FFmpeg();
await ffmpeg.load({ coreURL: await toBlobURL(`...ffmpeg-core.js`, 'text/javascript') });
await ffmpeg.writeFile('input.mp4', await fetchFile(file));
await ffmpeg.exec(['-i', 'input.mp4', '-c:a', 'libmp3lame', 'output.mp3']);
const data = await ffmpeg.readFile('output.mp3');
downloadBlob(new Blob([data.buffer], { type: 'audio/mp3' }), 'output.mp3');
```
**Options per tool:**
- `audio-converter`: Output format (MP3/WAV/FLAC/AAC/OGG), Bitrate (128/192/256/320 kbps)
- `video-converter`: Output format (MP4/MOV/WEBM/AVI), Resolution (original/1080p/720p/480p), CRF slider
- `video-to-audio`: Output format (MP3/WAV/AAC), Bitrate
- `mp4-to-gif`: Start/end time inputs, Frame rate (10/15/24 fps), Width px
- `gif-to-mp4`: Output format (MP4/WEBM), FPS
**Notes:** FFmpeg.wasm is large (~25MB WASM). Show "Loading FFmpeg…" spinner on first use. FFmpeg runs in a web worker automatically. Show progress via `ffmpeg.on('progress', ...)`.

### audio-trimmer / video-trimmer
**Arch:** B · **Dep:** `@ffmpeg/ffmpeg`, `@ffmpeg/util`
**Logic:** Use FFmpeg `-ss [start] -to [end]` for trim. For video: `-ss [start] -to [end] -c copy` for fast stream copy (no re-encode).
**Options:** Start time input (mm:ss format), End time input, Duration display, Preview: show waveform (audio) or video preview element (video)
**Notes:** For the preview: use `<audio>` or `<video>` element with `URL.createObjectURL(file)` to let user audition before trimming.

### sound-recorder
**Arch:** C · **Dep:** none
**Logic:** `navigator.mediaDevices.getUserMedia({ audio: true })` → `MediaRecorder`. Store chunks in array. On stop: `new Blob(chunks, { type: 'audio/webm' })`. Show live waveform via AnalyserNode + canvas.
**Options:** Output format (WebM native / MP3 via FFmpeg), Mono/Stereo
**Notes:** Live waveform: connect MediaStream to `AudioContext.createAnalyser()`, draw bars in `requestAnimationFrame` loop.

### screen-recorder
**Arch:** C · **Dep:** none
**Logic:** `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })` → `MediaRecorder`. Same chunk collection pattern.
**Options:** Include audio (checkbox), Output format (WebM)
**Notes:** Show record duration timer. "Stop Recording" button calls `stream.getTracks().forEach(t => t.stop())`.

### Social media downloaders (youtube-to-mp3, youtube-to-mp4, tiktok-downloader, instagram-downloader, twitter-video-downloader)
**Arch:** UI-stub
**Logic:** Build a complete, polished UI: URL input field, quality/format selector, "Analyze" button → shows a "video info" card (title placeholder, duration, thumbnail placeholder), then "Download" button.
**The "Download" button** shows a professional modal: "Server-side processing required. This feature is ready for API integration. Connect your backend at POST /api/download with `{ url, format, quality }` to enable downloads."
**Options:** Quality selector (144p/360p/480p/720p/1080p for video; 128/192/320 kbps for audio)
**Notes:** The UI should look identical to how a working downloader would look — just the actual download step is stubbed. This makes the integration trivial when the backend is ready.

---

## DEVELOPER TOOLS

### json-formatter
**Arch:** A · **Dep:** none
**Logic:** Parse with `JSON.parse()`. Beautify: `JSON.stringify(parsed, null, indent)`. Minify: `JSON.stringify(parsed)`. Validate: catch parse error and report line/column.
**Options:** Mode (Beautify/Minify/Validate), Indent size (2/4 spaces/tab)
**Notes:** Show error with line number extracted from error message. For Validate: show green ✓ or red ✗ with the exact error. Show key/value count stats.

### yaml-to-json / json-to-yaml
**Arch:** A · **Dep:** `js-yaml`
**Logic:** `js-yaml.load(input)` → `JSON.stringify(result, null, 2)` (YAML→JSON). `js-yaml.dump(JSON.parse(input))` (JSON→YAML).
**Options:** Mode toggle (YAML→JSON / JSON→YAML)

### xml-formatter
**Arch:** A · **Dep:** `fast-xml-parser`
**Logic:** Parse XML, then re-serialize with `XMLBuilder({ format: true, indentBy: '  ' })`.
**Options:** Mode (Beautify/Minify), Indent (2/4 spaces)

### html-formatter
**Arch:** A · **Dep:** manual or `prettier` (browser WASM build)
**Logic:** For beautify: load prettier's standalone browser build + html plugin. `prettier.format(input, { parser: 'html', tabWidth: 2 })`. For minify: strip comments, collapse whitespace between tags.
**Options:** Mode (Beautify/Minify), Indent size, Remove comments (checkbox)
**Notes:** Prettier's browser WASM build is large. If it fails to load, fall back to a simple regex-based formatter.

### css-minifier
**Arch:** A · **Dep:** none (simple regex approach)
**Logic:** Minify: remove comments (`/* ... */`), strip extra whitespace, collapse `{ }` whitespace. Beautify: basic re-indentation of CSS rules.
**Options:** Mode (Minify/Beautify), Preserve important comments (`/*!` prefix)
**Notes:** A full CSS parser is heavy. Use regex + string manipulation for ~90% of cases. Show bytes saved % badge.

### js-minifier
**Arch:** A · **Dep:** `terser` (browser build)
**Logic:** `Terser.minify(input, { compress: true, mangle: true })` → `output.code`.
**Options:** Compress (checkbox), Mangle names (checkbox), Keep function names (checkbox)
**Notes:** Load terser via CDN script if npm bundle is too large. Show bytes saved %.

### sql-formatter
**Arch:** A · **Dep:** `sql-formatter`
**Logic:** `format(input, { language: dialect, tabWidth: 2 })`.
**Options:** Dialect selector (sql/mysql/postgresql/sqlite/bigquery), Indent size, Uppercase keywords (checkbox)

### regex-tester
**Arch:** A · **Dep:** none
**Logic:** Two panels: pattern input + test input. Create `new RegExp(pattern, flags)`, exec `matchAll()`. Highlight all match positions in the test string using `<mark>` tags. Show capture groups in a table below.
**Options:** Flags checkboxes (g/i/m/s/u), Mode (match/test/replace)
**Notes:** Wrap RegExp creation in try/catch — show error on invalid pattern immediately. Show match count badge.

### cron-builder
**Arch:** C · **Dep:** `cronstrue`
**Logic:** 5 or 6 number inputs (second/minute/hour/day/month/weekday). Rebuild the cron string as user changes inputs. `cronstrue.toString(cronExpr)` → human readable description. Show next 5 run times (calculate manually using Date arithmetic).
**Options:** Enable seconds field (checkbox), Quick presets (every minute / hourly / daily / weekly / monthly)

### uuid-generator
**Arch:** C · **Dep:** none
**Logic:** UUID v4: `crypto.randomUUID()`. UUID v1: implement time-based UUID (use Date.now() for time field). ULID: use `crypto.getRandomValues` for random part + timestamp prefix. NanoID: custom alphabet + `crypto.getRandomValues`.
**Options:** Format (UUID v4/v1/ULID/NanoID), Count (1-1000), Uppercase (checkbox), Hyphens (checkbox)
**Notes:** Generate button + copy all button. Show them in a scrollable list.

### hash-generator
**Arch:** A · **Dep:** none (SubtleCrypto)
**Logic:** `crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))` → hex string.
**Options:** Algorithm tabs (MD5 / SHA-1 / SHA-256 / SHA-512). Note: MD5/SHA-1 not in SubtleCrypto — use a pure-JS implementation (include a small MD5 function).
**Notes:** Show all hashes simultaneously for the same input, not mode-switched.

### color-converter
**Arch:** D · **Dep:** none
**Logic:** Accept any format input (HEX/RGB/HSL/HSV/CMYK). Convert to internal RGB. Then compute all other formats. Show a color preview swatch.
**Conversions:** HEX↔RGB (trivial), RGB↔HSL (standard formulas), RGB↔HSV, RGB↔CMYK (approximate for screen).
**Options:** Color picker input (HTML `<input type="color">`), Manual text input, Copy button per format

### diff-checker / text-diff
**Arch:** A · **Dep:** `diff`
**Logic:** `diff.diffLines(oldText, newText)` → array of change objects. Render each part with color: green for additions, red for deletions, neutral for unchanged.
**Options:** Mode (side-by-side / unified), Ignore whitespace (checkbox), Ignore case (checkbox)
**Notes:** `diff-checker` is the developer version (code-focused, monospace), `text-diff` is the text tools version (same logic, slightly different presentation).

### markdown-to-html
**Arch:** A · **Dep:** `marked`
**Logic:** Left: markdown textarea. Right: live HTML preview (`dangerouslySetInnerHTML` — safe here, user's own content). Also show raw HTML in a copyable textarea below.
**Options:** Mode (Preview / HTML output / Side-by-side), GFM mode (checkbox, default on)

### html-to-markdown
**Arch:** A · **Dep:** `turndown`
**Logic:** `new TurndownService().turndown(input)` → markdown string.
**Options:** Heading style (ATX `#` / Setext), Bullet char (- / * / +), Code style (fenced / indented)

### json-to-typescript
**Arch:** A · **Dep:** manual or `json-to-ts`
**Logic:** Parse JSON object. Recursively build TypeScript interface strings. Detect arrays, nested objects, optional fields (if some objects in an array are missing a key), unions.
**Options:** Root interface name (text input, default `Root`), Export keyword (interface/type), Optional fields (checkbox)

### http-status-codes
**Arch:** E · **Dep:** none
**Logic:** Static data object with all HTTP status codes (100-511). Search by code number or keyword. Group by category (1xx/2xx/3xx/4xx/5xx).
**Notes:** Show each code as a card: number + name + short description + usage context. Click to expand full details.

### api-response-formatter
**Arch:** A · **Dep:** none
**Logic:** Parse JSON. Render as a collapsible tree (recursive component: if value is object/array, render expand toggle; if primitive, render as span with type-colored value). Support copy of any node's path or value.
**Options:** Collapse all / Expand all buttons, Search within JSON (highlight matching keys)

### graphql-formatter
**Arch:** A · **Dep:** `graphql`
**Logic:** `import { print, parse } from 'graphql'` → `print(parse(input))` to format. Catch `GraphQLSyntaxError` for invalid input.
**Options:** Mode (Format / Validate)

### toml-to-json
**Arch:** A · **Dep:** `@iarna/toml`
**Logic:** `TOML.parse(input)` → `JSON.stringify(result, null, 2)`.

### jwt-decoder
**Arch:** A · **Dep:** none
**Logic:** Split JWT by `.`. Base64url-decode each part (replace `-`→`+`, `_`→`/`, pad with `=`). Parse header and payload as JSON. Show each section in a separate card. For exp/iat: show human-readable date. Verify signature: if secret provided, use SubtleCrypto HMAC.
**Options:** Secret key input for signature verification, Algorithm display

### color-contrast-checker
**Arch:** D · **Dep:** none
**Logic:** Convert both colors to relative luminance (WCAG formula: `L = 0.2126R + 0.7152G + 0.0722B` with sRGB gamma correction). Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)`. Check against WCAG 2.1 thresholds: AA normal (4.5:1), AA large (3:1), AAA normal (7:1), AAA large (4.5:1).
**Options:** Foreground color picker, Background color picker, Text size (normal/large)
**Notes:** Show a live text sample preview with the chosen colors.

### htaccess-generator
**Arch:** C · **Dep:** none
**Logic:** Form with sections. Each section generates a block of .htaccess code. Combine all enabled sections into the output. Sections: Force HTTPS redirect, www→non-www, custom 404 page, GZIP compression, browser caching headers, directory listing off, hotlink protection, IP block list.
**Options:** Checkboxes per section + configuration fields within each active section

### curl-to-code
**Arch:** A · **Dep:** `curlconverter`
**Logic:** `curlconverter.toJavaScript(curlCommand)`, `.toPython()`, `.toPhp()`, `.toRuby()`, etc.
**Options:** Target language selector tabs (JS Fetch / JS Axios / Python / PHP / Ruby / Go / Rust)

### css-gradient-generator
**Arch:** C · **Dep:** none
**Logic:** Form controls: gradient type (linear/radial/conic), angle, color stops (add/remove/reorder, each with color picker + position %). Generate CSS string. Show live preview div with the gradient applied.
**Options:** Type, Angle, Color stops (up to 10), Repeat (checkbox)
**Notes:** Live preview is a full-width div. Copy button copies the CSS `background` property value.

### css-box-shadow-generator
**Arch:** C · **Dep:** none
**Logic:** Sliders for x, y, blur, spread. Color picker + opacity. Add multiple shadow layers. Generate CSS `box-shadow: ...` value. Live preview on a sample card.
**Options:** Inset toggle, Multiple shadow layers (add/remove), Preview background color

### css-flexbox-generator
**Arch:** C · **Dep:** none
**Logic:** Dropdowns and toggles for all flex container properties: display, flex-direction, flex-wrap, justify-content, align-items, align-content, gap. Plus child properties: flex-grow, flex-shrink, flex-basis, align-self. Live CSS output. Live preview with draggable demo boxes.
**Options:** Number of demo children (1-6), Show child properties panel
**Notes:** The preview section is the key value-add. Make it interactive.

### dummy-data-generator
**Arch:** C · **Dep:** `@faker-js/faker`
**Logic:** User picks fields from a list (name, email, phone, address, UUID, date, number, boolean, company, URL, IP, etc.). Set row count (1-10000). Generate: `Array.from({ length: count }, () => ({ ... }))` using faker methods. Export as JSON, CSV, or SQL INSERT statements.
**Options:** Field picker (add/remove/reorder), Row count, Output format (JSON/CSV/SQL)

---

## TEXT TOOLS

### word-counter
**Arch:** A · **Dep:** none
**Logic:** Words: split by `/\s+/` filter empty. Characters with/without spaces. Sentences: split by `/[.!?]+/`. Paragraphs: split by `/\n\n+/`. Reading time: words/238 (avg reading speed).
**Options:** none (all stats shown automatically)
**Notes:** Show all stats as a row of cards: Words / Characters / Sentences / Paragraphs / Reading time / Speaking time (words/130).

### case-converter
**Arch:** A · **Dep:** none
**Logic:** 9 conversion functions: uppercase, lowercase, title case (capitalize each word), sentence case (capitalize first of each sentence), camelCase (remove spaces, capitalize subsequent words), PascalCase, snake_case, kebab-case, CONSTANT_CASE.
**Options:** Quick-action buttons for each case style (click = instantly convert)
**Notes:** All 9 conversions are buttons (not a mode toggle) — user can try different styles without re-typing.

### lorem-ipsum
**Arch:** C · **Dep:** none
**Logic:** Hard-code the classic Lorem Ipsum text pool (~500 words). Generate by: paragraphs (join N random sentences), sentences (N random), or words (N random from pool). "Random lorem" mode shuffles word order. "Hipster" mode uses a different pre-built pool.
**Options:** Amount input, Unit (paragraphs/sentences/words), Type (Classic/Random/Hipster), Start with "Lorem ipsum…" (checkbox)

### slug-generator
**Arch:** A · **Dep:** none
**Logic:** Lowercase → replace accented chars with ASCII equivalents → replace non-alphanumeric with hyphen → collapse multiple hyphens → trim leading/trailing hyphens.
**Options:** Separator character (hyphen / underscore / dot), Lowercase (default on), Max length

### duplicate-line-remover
**Arch:** A · **Dep:** none
**Logic:** Split by newline, `new Set(lines)`, rejoin.
**Options:** Case sensitive (checkbox), Trim whitespace before compare (checkbox), Sort result (checkbox), Show removed count badge

### text-sorter
**Arch:** A · **Dep:** none
**Logic:** Split by newline, `lines.sort()`.
**Options:** Direction (A→Z / Z→A), Sort by (alphabetical / numeric / length), Case sensitive, Trim before sort

### whitespace-cleaner
**Arch:** A · **Dep:** none
**Logic:** Individual checkboxes: trim leading/trailing whitespace, collapse multiple spaces, remove blank lines, tabs to spaces, remove all line breaks.
**Options:** Checkboxes for each operation. Apply all is default.

### text-reverser
**Arch:** A · **Dep:** none
**Logic:** Reverse characters: `[...str].reverse().join('')`. Reverse words: `str.split(' ').reverse().join(' ')`. Reverse lines: split by `\n`, reverse, join.
**Options:** Mode buttons (Characters / Words / Lines)

### readability-score
**Arch:** A · **Dep:** none
**Logic:**
- Flesch Reading Ease: `206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)`
- Flesch-Kincaid Grade: `0.39*(words/sentences) + 11.8*(syllables/words) - 15.59`
- Gunning Fog: `0.4 * ((words/sentences) + 100*(complex_words/words))`
- Syllable count: count vowel groups per word (approximate)
**Options:** none (show all metrics)
**Notes:** Show grade level as a bar/gauge. Interpret: "Grade 8 — suitable for general audiences."

### find-and-replace
**Arch:** A · **Dep:** none
**Logic:** Build regex from find string (or raw regex if user enables regex mode). `input.replace(regex, replaceStr)`.
**Options:** Find input, Replace input, Regex mode toggle, Case sensitive toggle, Whole word toggle. Add multiple rules (add rule button).
**Notes:** Highlight all matches in the input before replacing. Show match count badge.

### text-truncator
**Arch:** A · **Dep:** none
**Logic:** Truncate at character limit (word boundary optional) and append suffix.
**Options:** Limit number, Unit (characters / words / sentences), Boundary (exact / word), Suffix (text input, default "…")
**Notes:** Show character count remaining after truncation.

### character-limit-checker
**Arch:** A · **Dep:** none
**Logic:** Show current character count vs each platform limit. Color: green if within limit, red if over.
**Limits:** Twitter/X (280), LinkedIn post (3000), LinkedIn headline (220), Instagram caption (2200), Meta ad headline (40), Meta ad text (125), Google ad headline (30), Google ad description (90), Custom.
**Notes:** Live update as user types. Show all platforms simultaneously as a checklist.

### list-randomizer
**Arch:** A · **Dep:** none
**Logic:** Split by newline, Fisher-Yates shuffle. Optional: pick N random items from list.
**Options:** Shuffle / Pick N, N input, Allow duplicates (for pick mode)

### number-extractor
**Arch:** A · **Dep:** none
**Logic:** `/[-+]?\d+(\.\d+)?/g` matchAll → deduplicate → sort optionally.
**Options:** Include decimals (checkbox), Include negatives (checkbox), Deduplicate (checkbox), Sort (none / ascending / descending)
**Notes:** Show numbers as a list. Copy all, download as CSV.

### email-extractor
**Arch:** A · **Dep:** none
**Logic:** `/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g` matchAll → deduplicate.
**Options:** Deduplicate (checkbox), Sort alphabetically (checkbox)
**Notes:** Show email count badge. Copy all, download as `.txt`.

### text-to-speech
**Arch:** A · **Dep:** none (Web Speech API)
**Logic:** `new SpeechSynthesisUtterance(text)`. List available voices via `speechSynthesis.getVoices()`.
**Options:** Voice selector (language + voice name), Rate (0.5–2.0), Pitch (0–2), Play/Pause/Stop buttons
**Notes:** `getVoices()` is async on Chrome — use `onvoiceschanged` event. Download as MP3 is not natively supported — note this to the user.

### speech-to-text
**Arch:** C · **Dep:** none (Web Speech API)
**Logic:** `const rec = new window.SpeechRecognition()`. Set `continuous: true`, `interimResults: true`. On result: append to output textarea.
**Options:** Language selector, Continuous / single phrase mode, Clear transcript button
**Notes:** Only works in Chrome/Edge. Show browser compatibility notice for Firefox/Safari.

---

## ENCODING & DECODING

### url-encoder
**Arch:** A · **Dep:** none
**Logic:** Encode: `encodeURIComponent(input)` (component mode) or custom full-URL encoding. Decode: `decodeURIComponent(input)`.
**Options:** Mode (Encode/Decode), Scope (Component / Full URL — Full URL preserves `://`, `/`, `?`, `&`, `=`)

### html-entities
**Arch:** A · **Dep:** none
**Logic:** Encode: replace `& < > " '` and extended chars (>127) with named or numeric entities. Decode: DOMParser trick: `new DOMParser().parseFromString(input, 'text/html').documentElement.textContent`.
**Options:** Mode (Encode/Decode), Entity style (Named `&amp;` / Decimal `&#38;` / Hex `&#x26;`)

### qr-code-generator
**Arch:** C · **Dep:** `qrcode`
**Logic:** `QRCode.toCanvas(canvas, text, { errorCorrectionLevel: 'M', width: 300 })`.
**Options:** Input type tabs (URL/Text/WiFi/vCard/Phone), Error correction (L/M/Q/H), Size (px), Dark/light color pickers
**WiFi fields:** SSID, Password, Encryption (WPA/WEP/None)
**vCard fields:** Name, Phone, Email, URL
**Notes:** Show QR preview live. Download as PNG or SVG (`QRCode.toString(text, { type: 'svg' })`).

### qr-code-reader
**Arch:** B · **Dep:** `jsQR`
**Logic:** Load image to canvas. `jsQR(imageData.data, imageData.width, imageData.height)` → code.data.
**Options:** Upload image or use camera (via `getUserMedia` + video element)
**Notes:** For camera: capture frames in a loop, run jsQR on each. Show result when found.

### barcode-generator
**Arch:** C · **Dep:** `jsbarcode`
**Logic:** `JsBarcode(svgElement, value, { format: 'CODE128', ... })`.
**Options:** Format selector (CODE128/EAN-13/EAN-8/UPC-A/CODE39/ITF14), Value input, Width/height, Display text (checkbox), Colors
**Notes:** Validate input per format (EAN-13 needs 13 digits, etc.). Download as SVG or PNG.

### jwt-generator
**Arch:** C · **Dep:** none (SubtleCrypto)
**Logic:** Header: `{ alg: 'HS256', typ: 'JWT' }`. Payload: JSON editor. Sign: `crypto.subtle.sign('HMAC', key, data)` where key is derived from secret via `importKey`. Base64url-encode each part.
**Options:** Algorithm (HS256/HS384/HS512), Payload JSON editor, Secret key, Quick claim buttons (add exp/iat/nbf/sub/iss)

### binary-converter
**Arch:** A · **Dep:** none
**Logic:** Auto-detect input format (binary: only 0s, 1s, spaces; hex: 0-9a-f; decimal: digits only; text: anything). Convert to all other bases simultaneously.
**Options:** none (show all conversions simultaneously)
**Notes:** Show Text, Binary, Decimal, Hex, and Octal all at once. Input can be any of these.

### hex-encoder
**Arch:** A · **Dep:** none
**Logic:** Encode: `Array.from(new TextEncoder().encode(text)).map(b => b.toString(16).padStart(2,'0')).join(' ')`. Decode: split hex pairs, `Uint8Array.from(...)`, `new TextDecoder().decode(...)`.
**Options:** Mode (Encode/Decode), Separator (space / none / 0x prefix / \x prefix)

### morse-code
**Arch:** A · **Dep:** none (+ AudioContext)
**Logic:** Static morse code table. Convert each character. For audio: use AudioContext OscillatorNode + GainNode. Dots = 100ms, dashes = 300ms, gaps proportional.
**Options:** Mode (Text→Morse / Morse→Text), WPM speed (5-30), Play button, Tone frequency (Hz)
**Notes:** Audio playback: queue oscillator start/stop times in sequence. Show dot/dash visualization.

### png-to-base64
**Arch:** B · **Dep:** none
**Logic:** FileReader `readAsDataURL(file)` → show full data URI. Show raw base64 without header too.
**Options:** Show full URI (default) / raw base64 only

### rot13
**Arch:** A · **Dep:** none
**Logic:** Map each letter: A↔N, B↔O, etc. `str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (code = c.charCodeAt(0) + 13) ? code : code - 26))`.
**Notes:** ROT13 is its own inverse — no mode toggle needed. One input → one output, always.

### caesar-cipher
**Arch:** A · **Dep:** none
**Logic:** Shift each letter by N positions (modulo 26). Preserve case. Non-alpha chars unchanged.
**Options:** Shift value (1-25 slider), Mode (Encrypt / Decrypt / Brute force all 25)
**Notes:** Brute force mode: show all 25 shifts in a scrollable table.

### unicode-lookup
**Arch:** D/E · **Dep:** none
**Logic:** Input: single character or U+XXXX code point. `char.codePointAt(0).toString(16).toUpperCase()`. Show: code point, Unicode name (approximate from built-in table or derived algorithmically), block, category, HTML entity, CSS escape, UTF-8 bytes.
**Options:** Search by character or code point

### ascii-table
**Arch:** E · **Dep:** none
**Logic:** Static table: codes 0-127 (and optionally 128-255). Display as a sortable table: decimal, hex, binary, character, HTML entity, description.
**Options:** Range (Standard 0-127 / Extended 0-255), Search/filter, Copy column button

### text-to-binary
**Arch:** A · **Dep:** none
**Logic:** Encode: `Array.from(new TextEncoder().encode(text)).map(b => b.toString(2).padStart(8,'0')).join(' ')`. Decode: split by spaces, parse each 8-bit group, decode bytes.
**Options:** Mode (Text→Binary / Binary→Text), Separator (space / none / newline), Show groups of 8 (checkbox)

---

## CALCULATORS

### percentage-calculator
**Arch:** D · **Dep:** none
**Logic:** 4 calculation modes displayed simultaneously:
1. "What is X% of Y?" → `X/100 * Y`
2. "X is what % of Y?" → `X/Y * 100`
3. "% change from X to Y" → `(Y-X)/X * 100`
4. "Increase/decrease X by Y%" → `X * (1 ± Y/100)`
**Notes:** Show all 4 as independent calculator rows. Each updates live.

### unit-converter
**Arch:** D · **Dep:** none
**Logic:** Category tabs: Length / Mass / Temperature / Speed / Area / Volume / Time / Energy / Data Storage / Pressure / Power. Static conversion factors relative to a base unit. Live bidirectional update.
**Options:** Category tabs, From unit, To unit, Value input
**Notes:** Temperature requires offset formulas (°C = (°F - 32) × 5/9). Show 10 common conversions at once for the selected category.

### data-storage-converter
**Arch:** D · **Dep:** none
**Logic:** Units: bit, byte, KB (1000), KiB (1024), MB, MiB, GB, GiB, TB, TiB, PB. Conversion via base unit (bits). Show both SI (1000) and binary (1024) columns simultaneously.

### number-base-converter
**Arch:** D · **Dep:** none
**Logic:** `parseInt(input, fromBase).toString(toBase)`. Support base 2-36. Show Binary/Octal/Decimal/Hex simultaneously (like binary-converter but for pure numbers, not text).

### roman-numerals
**Arch:** D · **Dep:** none
**Logic:** Arabic to Roman: iterate through value pairs `[1000,'M'],[900,'CM']...` subtracting. Roman to Arabic: map chars to values, compare adjacent chars.
**Options:** Mode (Arabic→Roman / Roman→Arabic / Show both)
**Notes:** Show step-by-step breakdown (e.g., 1994 = MCM + XC + IV).

### timestamp-converter
**Arch:** D · **Dep:** none
**Logic:** Unix (s or ms) → `new Date(timestamp * 1000)`. Date string → `Date.parse()`. Show in multiple timezones via `Intl.DateTimeFormat`.
**Options:** Timezone selector (uses `Intl.supportedValuesOf('timeZone')`), Format (ISO / RFC / Custom)
**Notes:** Auto-detect if input is seconds vs milliseconds (if > 1e10, assume ms).

### age-calculator
**Arch:** D · **Dep:** none
**Logic:** `new Date() - new Date(birthdate)`. Convert ms to years/months/days.
**Options:** Birthdate input, Target date (default today, can be future/past)
**Notes:** Show days until next birthday. Day of week born. Total days/hours/minutes since birth (fun stats).

### date-calculator
**Arch:** D · **Dep:** none
**Logic:** Two modes: (1) Add/subtract from a date. (2) Difference between two dates.
**Options:** Mode toggle, Date input(s), Add years/months/days inputs
**Notes:** Show result in multiple formats. For difference: show in days, weeks, months, and years.

### timezone-converter
**Arch:** D · **Dep:** none (Intl API)
**Logic:** Select input time + timezone. Show converted time in multiple target timezones simultaneously.
**Options:** Input datetime + timezone, Add/remove target timezone rows (from `Intl.supportedValuesOf('timeZone')`)
**Notes:** Show current time button. DST indicator where applicable.

### bmi-calculator
**Arch:** D · **Dep:** none
**Logic:** BMI = weight(kg) / height(m)². Categories: <18.5 Underweight, 18.5-24.9 Normal, 25-29.9 Overweight, ≥30 Obese.
**Options:** Unit toggle (metric/imperial — convert before calculation), Age + sex (optional, for context)
**Notes:** Show BMI on a color-coded gauge. Show healthy weight range for entered height.

### tdee-calculator
**Arch:** D · **Dep:** none
**Logic:** BMR (Mifflin-St Jeor): Men: `10*weight + 6.25*height - 5*age + 5`. Women: `10*weight + 6.25*height - 5*age - 161`. TDEE = BMR × activity multiplier (1.2/1.375/1.55/1.725/1.9).
**Options:** Sex, Age, Weight, Height, Activity level selector
**Notes:** Show macros for cutting (deficit 500 kcal), maintenance, and bulking (surplus 500 kcal).

### tip-calculator
**Arch:** D · **Dep:** none
**Logic:** `tipAmount = billTotal * tipPercent / 100`. `perPerson = (billTotal + tipAmount) / numPeople`.
**Options:** Bill total, Tip % (quick buttons 10/15/18/20/25 + custom), Number of people
**Notes:** Show: tip amount, total bill, per-person amount. Round up to nearest dollar option.

### aspect-ratio-calculator
**Arch:** D · **Dep:** none
**Logic:** Given W+H: find GCD, simplify ratio. Given ratio string (e.g. "16:9") + one dimension: solve for the other.
**Options:** Mode (Find ratio / Scale dimensions), Common ratio presets (16:9, 4:3, 1:1, 21:9, etc.)

### gpa-calculator
**Arch:** D · **Dep:** none
**Logic:** Add course rows (name, grade letter, credit hours). Letter → grade points (A=4.0, A-=3.7, etc.). GPA = sum(grade_points * credits) / sum(credits). Support both 4.0 and 4.3 scales.
**Options:** Grade scale (4.0 / 4.3), Add/remove course rows, Semester grouping (cumulative across semesters)

### mortgage-calculator
**Arch:** D · **Dep:** none
**Logic:** Monthly payment: `M = P[r(1+r)^n]/[(1+r)^n-1]` where P=principal, r=monthly rate, n=months. Show total interest paid. Generate full amortization table.
**Options:** Loan amount, Annual interest rate, Loan term (years), Down payment
**Notes:** Show amortization as a table (collapsible). Show a simple bar chart: principal vs interest portions.

### compound-interest
**Arch:** D · **Dep:** none
**Logic:** `A = P(1 + r/n)^(nt)` where n=compounding frequency. With monthly contributions: iterate month by month.
**Options:** Principal, Annual rate, Years, Compound frequency (annual/quarterly/monthly/daily), Monthly contribution
**Notes:** Show final balance, total invested, total interest earned. Simple year-by-year table.

### electricity-cost-calculator
**Arch:** D · **Dep:** none
**Logic:** kWh/day = watts/1000 × hours/day. Cost/day = kWh × rate. Extrapolate to monthly/yearly.
**Options:** Wattage input, Hours per day, Rate per kWh (with common defaults: UK 0.34, US 0.16, EU 0.25)

### vat-calculator
**Arch:** D · **Dep:** none
**Logic:** Add VAT: `gross = net * (1 + rate/100)`. Remove VAT: `net = gross / (1 + rate/100)`.
**Options:** Net or gross input, VAT rate (quick presets 5%/10%/20%/21% + custom)
**Notes:** Show net, VAT amount, and gross clearly. Allow reverse calculation (enter gross, get net).

### scientific-calculator
**Arch:** D · **Dep:** none
**Logic:** Build a calculator UI with buttons. Use a safe expression evaluator (NOT `eval()`). Implement: basic ops, trig (sin/cos/tan + inverse), log/ln, powers, roots, factorial, π, e, memory (M+/M-/MR/MC).
**Options:** Degree/Radian toggle for trig functions
**Notes:** Do NOT use `eval()`. Build a token-based parser or use a library like `mathjs` (tree-shakeable, bring in only evaluate). Show calculation history below.

### currency-converter
**Arch:** D · **Dep:** none (frankfurter.app API 🌐)
**Logic:** Fetch `https://api.frankfurter.app/latest?from=USD` on load. Cache in state. `convertedAmount = amount * rates[targetCurrency]`.
**Options:** From/to currency selectors (170+ currencies), Amount input, Swap button
**Notes:** Show "Rates updated: [date]" from API response. Handle fetch error gracefully with a stale-data notice.

---

## SECURITY & NETWORK

### password-generator
**Arch:** C · **Dep:** none
**Logic:** Build charset from options. Fill array: `Array.from(crypto.getRandomValues(new Uint32Array(length))).map(n => charset[n % charset.length])`.
**Options:** Length slider (8-128), Checkboxes: uppercase/lowercase/digits/symbols, Exclude ambiguous (0O1lI), Exclude similar, Custom exclude chars, Quantity (1-20)
**Notes:** Show password strength meter. One-click copy each password. "Copy All" for bulk generation.

### password-strength-checker
**Arch:** A · **Dep:** none
**Logic:** Score: length (up to 40 pts), character variety (up to 30 pts), no common patterns (up to 30 pts). Check against top-1000 passwords list (hard-code a short list of the most common). Check for keyboard patterns (qwerty, 123456).
**Options:** none
**Notes:** Show score 0-100 + category (Weak/Fair/Good/Strong/Very Strong). Show specific suggestions.

### random-token-generator
**Arch:** C · **Dep:** none
**Logic:** `crypto.getRandomValues(new Uint8Array(bytes))`. Format: hex = `byte.toString(16).padStart(2,'0')`. Base64 = `btoa(String.fromCharCode(...bytes))`. AlphaNum = map bytes to `[A-Za-z0-9]` charset.
**Options:** Length (16/32/64/128 bytes or custom), Format (Hex/Base64/Alphanumeric), Quantity (1-50)

### file-hash-checker
**Arch:** B · **Dep:** none (SubtleCrypto)
**Logic:** FileReader `readAsArrayBuffer(file)` → `crypto.subtle.digest('SHA-256', buffer)` → hex. Run SHA-1, SHA-256, SHA-512 simultaneously. Compare input field for verification.
**Options:** Compare hash input field (paste known hash → shows ✓ match or ✗ mismatch), Algorithm display (show all simultaneously)
**Notes:** Also show MD5 (implement via pure-JS, since SubtleCrypto doesn't have MD5). Show file size.

### user-agent-parser
**Arch:** A · **Dep:** none
**Logic:** Regex-based parsing of UA string. Detect: browser (Chrome/Firefox/Safari/Edge/Opera), version, OS (Windows/macOS/iOS/Android/Linux), device type (Desktop/Mobile/Tablet), rendering engine (Blink/Gecko/WebKit).
**Options:** Auto-detect current UA (default), Manual input
**Notes:** Show parsed result as labelled cards. Show raw UA string below.

### my-ip
**Arch:** E · **Dep:** none (api.ipify.org 🌐)
**Logic:** `fetch('https://api.ipify.org?format=json')` → `{ ip }`. Also `fetch('https://ipapi.co/json/')` → location data.
**Notes:** Show IPv4 and IPv6 if available. Map link to google maps with coordinates. No user input needed — auto-loads on mount.

### ip-lookup
**Arch:** E · **Dep:** none (ip-api.com 🌐)
**Logic:** `fetch(`http://ip-api.com/json/${ip}?fields=66846719`)` → parse all fields.
**Options:** IP input (default to current IP from api.ipify.org)
**Notes:** ip-api.com free tier: HTTP only (not HTTPS) — note this. Show: country, region, city, ISP, org, ASN, timezone, lat/lon. Check `proxy`, `hosting` fields.

### dns-lookup
**Arch:** E · **Dep:** none (Google DoH 🌐)
**Logic:** For each record type: `fetch(`https://dns.google/resolve?name=${domain}&type=${type}`)` → parse Answer array.
**Options:** Domain input, Record type selector (A/AAAA/MX/TXT/CNAME/NS/SOA/PTR) — query all common types simultaneously
**Notes:** Show each record type in its own card. TTL display.

### whois-lookup
**Arch:** E · **Dep:** none (rdap.org 🌐)
**Logic:** `fetch(`https://rdap.org/domain/${domain}`)` → parse RDAP response (standardized WHOIS replacement).
**Options:** Domain input
**Notes:** RDAP is JSON-based WHOIS. Parse: registrar, creation date, expiry date, name servers, status, registrant (if public).

### ssl-checker
**Arch:** E · **Dep:** none (fetch probe 🌐)
**Logic:** Attempt `fetch(`https://${domain}`, { mode: 'no-cors' })`. Due to CORS, actual cert data is not accessible from the browser. Show: whether the domain responds over HTTPS (by checking if fetch succeeded), and display a note about limitations. Alternatively, fetch cert data from a public API like `https://crt.sh/?q=${domain}&output=json`.
**Options:** Domain input
**Notes:** crt.sh returns certificate transparency log data — show recent certs found, their issuer, subject, and validity dates.

### http-headers
**Arch:** E · **Dep:** none (fetch + CORS proxy 🌐)
**Logic:** Direct `fetch(url, { mode: 'cors' })` will fail due to CORS. Use a CORS proxy: `fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)` to get response headers. Parse the `X-Response-Headers` header that corsproxy.io returns.
**Options:** URL input
**Notes:** Show a note that a CORS proxy is used. Parse and display: server, content-type, cache-control, X-Frame-Options, HSTS, CSP headers (highlighted in green for security headers present).

### open-port-checker
**Arch:** E · **Dep:** none (fetch probe 🌐)
**Logic:** Client-side port checking is limited by browser security. Implement: attempt `fetch(`http://${host}:${port}/`, { mode: 'no-cors', signal: AbortSignal.timeout(3000) })`. If it resolves (even with opaque response), port is likely open. If it times out or connection refused, port is closed.
**Options:** Host input, Port input, Common ports quick-select (21/22/25/80/443/3306/5432/6379/8080/27017)
**Notes:** Results are approximate — show disclaimer. Works best for common HTTP ports.

---

## SEO & WEB

### meta-tag-generator
**Arch:** C · **Dep:** none
**Logic:** Form fields → generate HTML string with all meta tags. Include: title, description, keywords, robots, viewport, canonical, charset. Plus OG and Twitter Card.
**Options:** All the standard meta fields, Preview (character count for title/description with color coding)
**Notes:** Show the generated HTML in a copyable code block. Highlight over-long title (>60 chars) or description (>160 chars) in orange/red.

### og-tag-generator
**Arch:** C · **Dep:** none
**Logic:** OG tag form + Twitter Card form. Live preview: render a "link preview card" that shows how the URL would appear when shared on social media (card with image, title, description, domain).
**Options:** Type (website/article/product), Title, Description, Image URL, URL, Site name. Twitter: card type (summary/summary_large_image)
**Notes:** The social media preview card is the key feature — make it look authentic.

### robots-txt-generator
**Arch:** C · **Dep:** none
**Logic:** Form with sections: User-agent rules (add/remove), Allowed paths, Disallowed paths, Crawl-delay, Sitemap URL. Generate the robots.txt text.
**Options:** Add multiple user-agent sections, Quick presets (Block all bots / Allow all / Block AI crawlers)
**Notes:** Block AI crawlers preset: add rules for GPTBot, ChatGPT-User, Claude-Web, CCBot, etc.

### sitemap-generator
**Arch:** C · **Dep:** none
**Logic:** Manual mode: form to add URL rows (URL, priority 0.1-1.0, change frequency, last modified). Generate XML sitemap string.
**Options:** Add/remove URL rows, Auto-generate dates, Priority presets (homepage=1.0, category=0.8, page=0.6, etc.)
**Notes:** Also support bulk URL import (paste one URL per line). Download as `sitemap.xml`.

### utm-builder
**Arch:** C · **Dep:** none
**Logic:** Form: base URL + UTM fields. Append: `?utm_source=...&utm_medium=...&utm_campaign=...` etc.
**Options:** Source, Medium, Campaign, Term (optional), Content (optional). Quick presets for common sources/mediums.
**Notes:** Show the generated URL prominently. Copy button. URL encode each value. Character count warning if URL is very long.

### keyword-density
**Arch:** A · **Dep:** none
**Logic:** Tokenize text (remove punctuation, lowercase). Count word frequency. Density = count / total words × 100. Show top 25 keywords sorted by frequency.
**Options:** Min word length (filter out short words like "the"), Show 1-gram / 2-gram / 3-gram (checkbox for bigrams/trigrams), Stop words filter (checkbox)
**Notes:** Stop words: hard-code common English stop words (the, and, or, etc.). Show as a sortable table: keyword, count, density%.

### link-extractor
**Arch:** A · **Dep:** none (DOMParser)
**Logic:** `new DOMParser().parseFromString(html, 'text/html')`. `document.querySelectorAll('a')` → extract href. Categorize as internal/external based on same domain detection.
**Options:** Extract from (HTML paste / URL — URL uses corsproxy.io), Filter (all / internal / external / broken detection)
**Notes:** Show links in a table: URL, link text, type (internal/external). Copy all URLs, download as CSV.

### canonical-checker
**Arch:** E · **Dep:** none (corsproxy.io 🌐)
**Logic:** Fetch the URL via corsproxy. Look for `<link rel="canonical" href="...">` in the HTML. Report: canonical URL found, whether it's self-referencing, whether it matches the input URL.
**Options:** URL input
**Notes:** Also check HTTP header `Link: <url>; rel="canonical"`.

### redirect-checker
**Arch:** E · **Dep:** none (corsproxy.io 🌐)
**Logic:** Fetch via corsproxy with redirect following. The proxy should return chain info. Alternatively, display manual redirect chain guidance. Show each hop: status code, URL.
**Options:** URL input
**Notes:** corsproxy.io follows redirects — check `X-Final-URL` header in response. Show each hop as a chain visualization.

### page-speed-insights
**Arch:** E · **Dep:** none (PSI API 🌐)
**Logic:** `fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`)`. No API key needed for basic usage.
**Options:** URL input, Strategy (Mobile / Desktop)
**Notes:** Parse: performance score, FCP, LCP, CLS, TBT, TTI. Show scores as colored circles. Show audit list with pass/fail.
