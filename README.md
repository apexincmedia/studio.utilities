# Apex Studio Utilities

> The premier web utility suite. 150+ tools. No signup. Files stay on your device.

## Running locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Design system

**Before writing any component, read `APEX_UTILITIES_DESIGN_SYSTEM.md`.** It is the single source of truth for every color, spacing, border radius, typography, and interaction rule on this site.

## How to add a new tool (Codex onboarding)

Every tool lives in one file. The entire process is three steps:

**Step 1 — Implement the tool** at `tools/[slug].jsx`.

- If it's a text-in/text-out tool (JSON Formatter, URL Encoder, etc.): copy `tools/base64-encoder.jsx` and replace the conversion logic.
- If it's a file-upload/download tool (Image Resizer, PDF Merger, etc.): copy `tools/image-compressor.jsx` and replace the processing logic.
- Keep all UI primitives (`<DropZone>`, `<Button>`, `<CopyButton>`, `<OptionsPanel>`, etc.) unchanged.

**Step 2 — Flip the catalog flag** in `lib/tools-catalog.js`:

```js
// Change this:
{ slug: 'json-formatter', status: 'coming-soon', ... }
// To this:
{ slug: 'json-formatter', status: 'live', ... }
```

**Step 3 — Register the import** in `lib/tools-registry.js`:

```js
import JsonFormatter from '@/tools/json-formatter';
// Add to REGISTRY:
const REGISTRY = {
  ...,
  'json-formatter': JsonFormatter,
};
```

That's it. Routing, layout, SEO meta, and the all-tools page update automatically.

## Project structure

```
app/                  Next.js App Router pages
components/layout/    Navbar, Footer, PageShell
components/ui/        All design system UI primitives
components/tool/      Tool page layout (ToolPageShell, ToolLayout, etc.)
tools/                One file per tool implementation (Codex works here)
lib/                  tools-catalog.js, tools-registry.js, categories.js
styles/               globals.css (CSS tokens — the ONLY place tokens live)
```

## Rules (non-negotiable)

1. Font: Comfortaa Bold 700 only. No other fonts or weights.
2. Colors: CSS token variables only. Never hardcode hex values.
3. Border radius: `--radius-pill` for buttons/inputs, `--radius-lg` for cards.
4. Buttons: white fill (`--pill-bg`) + dark text (`--pill-text`), uppercase.
5. Cards: `--card` background, `1px solid var(--border)`, hover lifts 2px.
6. Never use `box-shadow` for depth — use border + background change.
7. Never use colored buttons. Primary CTA is always the white pill.
8. Max content width: 1200px. Page background: `--bg` (`#08080D`).
