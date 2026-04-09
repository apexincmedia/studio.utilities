# Apex Studio Utilities — Codex Implementation Playbook

> The authoritative guide for implementing tools. Read this before starting any tool.
> Also see `CLAUDE.md` (project root) for the 3-step contract and critical rules.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Structure](#2-project-structure)
3. [Design System](#3-design-system)
4. [The Five Archetypes](#4-the-five-archetypes)
5. [CSS Class Reference](#5-css-class-reference)
6. [Icon Reference](#6-icon-reference)
7. [State Patterns](#7-state-patterns)
8. [Shared Utilities](#8-shared-utilities-libtool-utilsjs)
9. [Registering a Tool](#9-registering-a-tool)
10. [Quality Checklist](#10-quality-checklist)
11. [Tool Classification Guide](#11-tool-classification-guide)
12. [External Dependencies](#12-external-dependencies)

---

## 1. Quick Start

### The 3-Step Contract

```
1. CREATE   tools/[slug].jsx            ← your implementation
2. ACTIVATE lib/tools-catalog.js        ← flip status: 'coming-soon' → 'live'
3. REGISTER lib/tools-registry.js       ← add import + switch case
```

Then run **`npm run build`** — it must pass with zero errors.

### Pick Your Template

| Tool does this | Template to copy |
|---------------|-----------------|
| Text in → text out | `tools/_TEMPLATE_TEXT.jsx` |
| File(s) in → file(s) out | `tools/_TEMPLATE_FILE.jsx` |
| Generate output (no input required) | Variant of TEXT template — remove input textarea |
| Form inputs → calculated result | Variant of TEXT template — replace textareas with inputs |
| Side-by-side viewer/preview | Variant of TEXT template — right textarea becomes rendered output |

---

## 2. Project Structure

```
app/
  layout.jsx                 Root layout with PageShell
  page.jsx                   Landing page
  tools/
    page.jsx                 /tools index (searchable, filterable)
    [slug]/
      page.jsx               Dynamic tool page — reads catalog, renders tool
components/
  layout/
    Navbar.jsx               Sticky nav with scroll glow + mobile overlay
    Footer.jsx               5-col grid footer
    PageShell.jsx            Navbar + main + Footer wrapper
  tool/
    ToolPageShell.jsx        Breadcrumb + ToolHeader + FormatSwitcher + children + RelatedTools
    ToolHeader.jsx           Centered: icon → tag → h1 → desc → trust badges
    ToolLayout.jsx           65/35 two-column grid (stacks below 900px)
    OutputPanel.jsx          Left column flex container (.panel)
    OptionsPanel.jsx         Right column flex container (.panel)
    FormatSwitcher.jsx       [INPUT] → [OUTPUT PILLS] — only shown when outputFormats defined
    TrustBadges.jsx          Client-side · Instant · No signup · Free forever
    RelatedTools.jsx         "More tools like this" bottom grid
    ComingSoonTool.jsx       Shown for status: 'coming-soon' tools
  ui/
    Button.jsx               variant: 'primary' | 'ghost', optional href
    DropZone.jsx             Drag-and-drop file input with icon slot + children slot
    CopyButton.jsx           Copy to clipboard with 1.5s feedback
    Input.jsx                variant: 'text' | 'search'
    Icon.jsx                 Thin wrapper: <Icon icon={ICON_MAP.X} size={20} />
    Badge.jsx                Status badges
lib/
  tools-catalog.js           175 tool definitions — names, slugs, icons, related, outputFormats
  tools-registry.js          slug → React component mapping
  icons.js                   ICON_MAP — all Lucide icons keyed by string name
  categories.js              9 categories with iconName strings
  tool-utils.js              Shared utilities: formatBytes, downloadBlob, useDebounce, etc.
styles/
  globals.css                ALL design tokens + ALL CSS classes
tools/
  base64-encoder.jsx         REFERENCE: text archetype (live)
  image-compressor.jsx       REFERENCE: file archetype (live)
  _TEMPLATE_TEXT.jsx         TEMPLATE: copy this for text tools
  _TEMPLATE_FILE.jsx         TEMPLATE: copy this for file tools
```

---

## 3. Design System

### Font

**Comfortaa Bold 700 only.** Never use a different weight or family.
It is loaded globally in `app/layout.jsx` and set on `body` in `globals.css`.

### Color Tokens (CSS Custom Properties)

Always use these variables. Never hardcode hex values in components.

```css
/* Page/surface backgrounds */
var(--bg)            /* #08080D  — page background */
var(--surface)       /* #111116  — elevated surface */
var(--surface-2)     /* #0E0E14  — deeply nested panels */
var(--card)          /* #17171E  — card / panel background */
var(--card-hover)    /* #1E1E28  — card on hover */
var(--card-elevated) /* #1C1C26  — floating elements */

/* Text */
var(--text)          /* #FFFFFF  — primary text */
var(--text-dim)      /* #BBBBD0  — secondary headings */
var(--muted)         /* #7A7A90  — body copy, labels */
var(--faint)         /* #3A3A4A  — disabled, hints, placeholders */

/* Borders */
var(--border)        /* #252530 */
var(--border-hover)  /* #3A3A4A */

/* Interactive */
var(--pill-bg)       /* #FFFFFF  — primary button background */
var(--pill-text)     /* #08080D  — primary button text */
var(--accent)        /* #3B82F6  — focus rings ONLY */
var(--accent-dim)    /* rgba(59,130,246,0.12) */

/* Semantic */
var(--success)       var(--success-bg)   /* green */
var(--error)         var(--error-bg)     /* red */
var(--warning)       var(--warning-bg)   /* amber */

/* Spacing / radius */
var(--radius-sm)     /* 8px  */
var(--radius-md)     /* 12px */
var(--radius-lg)     /* 20px */
var(--radius-pill)   /* 999px */

/* Transitions */
var(--t-fast)        /* 0.15s ease */
var(--t-base)        /* 0.2s ease */
var(--t-slow)        /* 0.3s ease */
```

---

## 4. The Five Archetypes

### Archetype A — Text-in / Text-out

**When to use:** encoders, decoders, formatters, converters, analyzers, validators, diff tools.

**Layout:**
- Left (OutputPanel): input textarea → direction divider → output textarea
- Right (OptionsPanel): mode toggle (if bidirectional) → options → Run/Copy/Clear buttons

**Key patterns:**
- Debounce input at 150ms for live update
- Show character/byte count below textareas
- Error state: red-tinted error panel between textareas
- Always copy button + optional download button

**Reference:** `tools/base64-encoder.jsx`
**Template:** `tools/_TEMPLATE_TEXT.jsx`

---

### Archetype B — File-in / File-out

**When to use:** converters, compressors, processors for any binary file type.

**Layout:**
- Left (OutputPanel): DropZone (empty state) or file cards list (has files)
- Right (OptionsPanel): settings → Compress/Convert All → Download All → Clear All

**Key patterns:**
- Each file card has its own Compress/Retry and Download button
- Show before→after size with strikethrough and green badge
- Comparison bar (proportional green fill) after processing
- Shimmer progress bar during processing
- Summary callout at top of OptionsPanel when files are done

**Reference:** `tools/image-compressor.jsx`
**Template:** `tools/_TEMPLATE_FILE.jsx`

---

### Archetype C — Generator

**When to use:** tools that produce output with no required input — UUID, password, Lorem Ipsum, color palette, etc.

**Layout:**
- Left (OutputPanel): generated output display (a textarea or formatted output block)
- Right (OptionsPanel): settings → Generate button → Copy/Download

**Key patterns:**
```jsx
// No input textarea needed
// Generate on mount and on "Generate" button click
const [output, setOutput] = useState('');

useEffect(() => { generate(); }, []);  // generate on mount

const generate = () => {
  setOutput(generateLogic(options));
};
```
- Show how many items/characters generated
- "Regenerate" button with RotateCw icon
- Copy + optional download

---

### Archetype D — Calculator

**When to use:** unit converters, percentage calculators, date calculators, financial tools, BMI, etc.

**Layout:**
- Left (OutputPanel): input fields + result display
- Right (OptionsPanel): formula explanation or extra options

**Key patterns:**
```jsx
// Calculate on every input change — no debounce needed for simple math
const result = useMemo(() => calculate(inputs), [inputs]);

// Result display
<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Result</div>
  <div style={{ fontSize: 32, color: 'var(--text)', fontWeight: 700 }}>{result}</div>
</div>
```
- Immediate calculation, no "Run" button needed
- Show the formula used below the result (font-size: 11px, color: var(--faint))
- Input fields use `.input` class with `style={{ borderRadius: 'var(--radius-md)' }}` for square-ish fields

---

### Archetype E — Viewer / Renderer

**When to use:** Markdown previewer, JSON viewer, SVG viewer, color picker, regex tester.

**Layout:**
- Left (OutputPanel): input textarea
- Right: rendered/formatted output panel (NOT OptionsPanel — use a plain div with `.panel` class)

**Key patterns:**
```jsx
// For side-by-side view, use ToolLayout with two OutputPanels:
<ToolLayout>
  <OutputPanel>
    <div className="panel-label">Input</div>
    <textarea className="textarea" value={input} onChange={...} />
  </OutputPanel>
  <OutputPanel>
    <div className="panel-label">Preview</div>
    <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
      {/* rendered output */}
    </div>
  </OutputPanel>
</ToolLayout>
```
- Debounce input at 200ms for render-heavy previews
- Error state inline within the preview panel

---

## 5. CSS Class Reference

Use these classes directly. Do **not** create new global classes.

### Layout
```
.tool-layout        65/35 grid, stacks below 900px
.panel              card background + border + flex column (use via OutputPanel/OptionsPanel)
.panel-label        10px uppercase tracking label for panel sections
.panel-divider      1px horizontal rule with margin: 20px 0
```

### Buttons
```
.btn-primary        white fill, dark text, pill shape
.btn-ghost          transparent, border, pill shape
.copy-btn           small inline copy button (use .copied modifier for feedback)
.mode-btn           toggle pill; add .active for selected state
```

Use inside a `.mode-toggle` wrapper for toggle groups.

### Inputs
```
.input              pill-shaped text input with focus glow
.textarea           rounded textarea with resize-vertical
.range-wrap         flex row for range slider + value label
.range-value        value display next to slider
.range-estimate     smaller hint text below slider (for live estimates)
.radio-group        flex column wrapper for radio options
.radio-row          flex row for a single radio option
.radio-label        label text
.radio-desc         secondary description below radio label
.checkbox-row       flex row for a checkbox option
.checkbox-label     label text
.options-label      10px uppercase section header in options panel
.options-row        flex column wrapper for a group of options
```

### Status / Feedback
```
.badge              base badge — add modifier:
.badge-success      green
.badge-error        red
.badge-pending      muted
.badge-coming-soon  faint
.badge-live         green (for live tools)
```

### Tool Page
```
.trust-badges       flex row of trust badge items
.trust-badge        individual "Client-side · Free" badge
.drop-zone          dashed upload area (use via DropZone component)
.drop-zone-formats  flex wrap of format pill tags inside drop zone
.drop-zone-format-pill  small format label (JPG, PNG, etc.)
.comparison-bar     before/after bar wrapper
.privacy-note       10px centered footer note in options panel
```

### Tags / Pills
```
.tag                category tag pill
.tool-pill          horizontal quick-access pill
.format-pill        conversion format pill
.format-pill--from  input format (non-interactive)
.format-pill--active active output format (white fill)
```

---

## 6. Icon Reference

Import icons via `ICON_MAP` only. Never import from `lucide-react` directly.

```jsx
import { ICON_MAP } from '@/lib/icons';
import Icon from '@/components/ui/Icon';

// Usage
<Icon icon={ICON_MAP.Download} size={16} />
<Icon icon={ICON_MAP.Loader2} size={16} className="spin" />  // animated spinner
```

### Commonly Used Icons

| Purpose | Icon key |
|---------|----------|
| Upload / drop zone | `Upload` |
| Download | `Download` |
| Run / process | `Zap` |
| Copy | `Copy` |
| Copied (success) | `Check` |
| Clear / remove | `X` |
| Spinner | `Loader2` (+ className="spin") |
| Error | `AlertCircle` |
| Retry | `RotateCw` |
| Delete / clear all | `Trash2` |
| Navigate back | `ArrowLeft` |
| Navigate forward | `ArrowRight` |
| Chevron down | `ChevronDown` |
| Settings | `Settings` |
| Lock / private | `Lock` |
| Security | `ShieldCheck` |
| Code / developer | `Code2` |
| File generic | `FileText` |
| Image | `Image` |

---

## 7. State Patterns

### Loading State

```jsx
const [processing, setProcessing] = useState(false);

// In the action button:
<Button variant="primary" disabled={processing} onClick={handleRun}>
  {processing
    ? <><Icon icon={ICON_MAP.Loader2} size={14} className="spin" /> Processing...</>
    : <><Icon icon={ICON_MAP.Zap} size={14} /> Run</>
  }
</Button>
```

### Error State (text tools)

```jsx
{error && (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: 'var(--error-bg)', border: '1px solid var(--error)',
    borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12,
  }}>
    <Icon icon={ICON_MAP.AlertCircle} size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
    <span style={{ fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>{error}</span>
  </div>
)}
```

### Error State (file tools)

```jsx
{status === 'error' && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--error-bg)', border: '1px solid var(--error)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: '#F87171',
  }}>
    <Icon icon={ICON_MAP.AlertCircle} size={13} />
    {error}
  </div>
)}
```

### Success Callout (file tools, after batch processing)

```jsx
{totalSaved > 0 && (
  <div style={{
    background: 'var(--success-bg)', border: '1px solid var(--success)',
    borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 24,
  }}>
    <div style={{ fontSize: 18, color: '#4ADE80', marginBottom: 3 }}>
      Saved {formatBytes(totalSaved)}
    </div>
    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
      {formatBytes(totalBefore)} → {formatBytes(totalAfter)} · {pct}% smaller
    </div>
  </div>
)}
```

### Copy Button Pattern

```jsx
import { useCopyState } from '@/lib/tool-utils';

const [copied, copy] = useCopyState();

<button
  className={`copy-btn${copied ? ' copied' : ''}`}
  onClick={() => copy(output)}
  disabled={!output}
  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
>
  <Icon icon={copied ? ICON_MAP.Check : ICON_MAP.Copy} size={13} />
  {copied ? 'Copied' : 'Copy'}
</button>
```

### Empty State (file tools)

```jsx
{files.length === 0 ? (
  <DropZone
    accept="image/*"
    multiple
    onFiles={handleFiles}
    title="Drop files here"
    subtitle="or click to browse"
    icon={<Icon icon={ICON_MAP.Upload} size={36} />}
  >
    <div className="drop-zone-formats">
      {['JPG', 'PNG', 'WebP'].map((f) => (
        <span key={f} className="drop-zone-format-pill">{f}</span>
      ))}
    </div>
  </DropZone>
) : (
  /* file list */
)}
```

---

## 8. Shared Utilities (`lib/tool-utils.js`)

```js
// Formatting
formatBytes(bytes)                    // "1.5 KB", "2.30 MB"
zeroPad(n, width)                     // "07"
truncate(str, maxLen)                 // "Long string…"

// Downloads
downloadBlob(blob, filename)          // trigger binary file download
downloadText(text, filename, mime?)   // trigger text file download
copyToClipboard(text)                 // async → boolean

// File reading
readAsText(file)                      // Promise<string>
readAsDataURL(file)                   // Promise<dataUrl string>
readAsArrayBuffer(file)               // Promise<ArrayBuffer>

// Encoding
encodeBase64(text)                    // UTF-8 safe btoa
decodeBase64(b64)                     // UTF-8 safe atob → null on invalid
byteLength(str)                       // byte count of UTF-8 string

// Hooks (client components only)
useDebounce(value, delay?)            // debounced value for live inputs
useDebouncedCallback(fn, delay?)      // debounced event handler
useCopyState(resetDelay?)             // [copied: bool, trigger: fn]
useHasChanged(value)                  // detects value change between renders
```

---

## 9. Registering a Tool

### Step 1 — Create the tool file

`tools/[slug].jsx` — use the appropriate template.

### Step 2 — Flip status in catalog

In `lib/tools-catalog.js`, find the entry with the matching slug and change:
```js
status: 'coming-soon',
```
to:
```js
status: 'live',
```
Do not change anything else in the entry.

### Step 3 — Register in tools-registry.js

Open `lib/tools-registry.js`. Add your import at the top with the other live tools:
```js
import MyNewTool from '@/tools/my-new-slug';
```

Then add a case inside `getToolComponent`:
```js
case 'my-new-slug': return MyNewTool;
```

### Step 4 — Verify

```bash
npm run build
```

Must output `✓ Generating static pages (175/175)` with zero errors.

---

## 10. Quality Checklist

Run through this for every tool before marking it done.

### Universal
- [ ] `'use client';` is the very first line of the tool file
- [ ] No hardcoded hex values — everything uses `var(--token)`
- [ ] No direct `lucide-react` imports — all icons via `ICON_MAP`
- [ ] No Tailwind classes — only `styles/globals.css` classes + inline styles
- [ ] `npm run build` passes with zero errors
- [ ] Tool is registered in `tools-registry.js`
- [ ] Catalog status is flipped to `'live'`

### Text tools
- [ ] Input textarea uses `.textarea` class
- [ ] Output textarea is `readOnly`
- [ ] Live update is debounced (not running on every keystroke synchronously)
- [ ] Error state is shown inline (not an alert/console.error)
- [ ] Copy button has `copied` state feedback
- [ ] Clear button resets input, output, and error
- [ ] Privacy note at bottom of OptionsPanel

### File tools
- [ ] DropZone fills the OutputPanel vertically
- [ ] Per-file compress/process button
- [ ] Per-file retry button on error
- [ ] Per-file download button on success
- [ ] Download All button when 2+ files are done
- [ ] Clear All button
- [ ] Object URLs are revoked when files are removed or component resets
- [ ] Processing state shows spinner + "Processing..."
- [ ] Error state shown inline within the file card
- [ ] Privacy note at bottom of OptionsPanel

### All tools
- [ ] At least one state transition is smooth (transition on buttons, etc.)
- [ ] Disabled states are correct (buttons disabled when no input/output)
- [ ] Works on mobile (stacked layout below 900px)

---

## 11. Tool Classification Guide

Use this to decide which archetype and template to use for each tool in the catalog.

### File Conversion (all file tools → Archetype B)
- PDF ↔ Word / Excel / PowerPoint / PNG / JPG
- Image format conversions (JPG ↔ PNG ↔ WebP ↔ AVIF ↔ SVG)
- Video/audio conversions (use ffmpeg.wasm if available, else show limitation)
- HEIC → JPG, RAW → JPG

### Image Tools (Archetype B, variants)
- Compressor → already done (reference)
- Resizer, Cropper, Rotator → file tools with Canvas API
- Color picker → Archetype E (viewer with canvas eyedropper)
- Background remover → Archetype B (use @imgly/background-removal)
- Watermark → Archetype B (Canvas API overlay)

### Developer Tools
- JSON formatter → Archetype A (text with `JSON.parse` + `JSON.stringify(_, null, 2)`)
- Base64 encoder → already done (reference)
- URL encoder → Archetype A (`encodeURIComponent` / `decodeURIComponent`)
- JWT decoder → Archetype A (split on `.`, decode each part with `decodeBase64`)
- Hash generator → Archetype A (Web Crypto API: `crypto.subtle.digest`)
- UUID generator → Archetype C (`crypto.randomUUID()`)
- Regex tester → Archetype E (split view: pattern + test string → highlighted matches)
- YAML ↔ JSON → Archetype A (use `js-yaml` npm package)
- CSV ↔ JSON → Archetype A (custom parser or `papaparse`)
- Cron builder → Archetype D (form inputs → cron expression)

### Text Tools
- Word/character counter → Archetype D (instant calculation)
- Case converter → Archetype A (`.toLowerCase()`, `.toUpperCase()`, etc.)
- Lorem ipsum generator → Archetype C (pre-baked word list, random selection)
- Text diff → Archetype E (side-by-side with diff highlighting — use `diff` npm)
- Markdown → HTML → Archetype E (use `marked` npm)
- Slug generator → Archetype A

### Calculators
- Percent, tip, BMI, unit converters → Archetype D
- Date calculator → Archetype D (use native `Date` — no moment.js)
- Timestamp converter → Archetype D

### Security & Encoding
- Password generator → Archetype C (`crypto.getRandomValues`)
- QR code generator → Archetype C (use `qrcode` npm)
- Bcrypt hasher → Archetype A (use `bcryptjs` npm — pure JS)

### SEO & Web
- Meta tag generator → Archetype A (form → HTML output)
- Open Graph previewer → Archetype E (inputs → visual card preview)
- IP lookup → Archetype D (use `https://ipapi.co/{ip}/json/` fetch — server call allowed for this)
- URL shortener → client-side with pre-defined shortening service

---

## 12. External Dependencies

Most tools should use only browser APIs. When a library is genuinely needed:

1. `npm install [package]` — choose the smallest, pure-JS option
2. The package must be importable in a client component (`'use client'`)
3. Add a brief comment in the tool file explaining why it's needed

### Pre-approved libraries (safe to add)
```
js-yaml            YAML parsing/serialization
marked             Markdown → HTML
papaparse          CSV parsing
qrcode             QR code generation
jszip              ZIP file creation
bcryptjs           Bcrypt hashing (pure JS)
diff               Text diff algorithm
@imgly/background-removal  AI background removal (client-side)
```

### Libraries to avoid
```
moment.js          Use native Date API instead
lodash             Use native JS equivalents
axios              Use native fetch
react-query        Use useState + useEffect directly
any SSR-only lib   Everything must run in the browser
```

### ffmpeg / video tools
For video conversion tools, use `@ffmpeg/ffmpeg` (WebAssembly). Note it requires
SharedArrayBuffer which needs specific response headers. Add to `next.config.mjs` if needed:
```js
headers: async () => [{
  source: '/tools/:path*',
  headers: [
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  ],
}]
```

---

*Last updated by Claude. Questions about a specific tool? Reference the catalog entry in `lib/tools-catalog.js` for its iconName, relatedTo slugs, and outputFormats.*
