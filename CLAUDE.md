# Apex Studio Utilities — Claude Code Project Rules

> **This file is automatically loaded by Claude Code / Codex on every session.**
> Read it fully before touching any file.

---

## What This Project Is

A dark-themed, client-side-only utility suite — the definitive "convert / encode / transform anything" destination. Think CloudConvert, Smallpdf, and Adobe Express merged into one, but faster and fully free.

**Stack:** Next.js 15 (App Router) · JavaScript (.jsx) · Plain CSS (no Tailwind) · Lucide React icons

---

## The 3-Step Tool Implementation Contract

Every tool implementation is exactly three steps. Do all three in one session.

```
Step 1 — Create   tools/[slug].jsx
Step 2 — Activate lib/tools-catalog.js  →  status: 'coming-soon'  →  'live'
Step 3 — Register lib/tools-registry.js →  add import + switch case
```

Then run `npm run build`. It must pass with **zero errors** before you are done.

---

## Critical Design Rules (Never Break)

| Rule | Why |
|------|-----|
| **No hardcoded hex values** | Use `var(--token)` from `styles/globals.css` |
| **No Tailwind classes** | Use the CSS classes defined in `styles/globals.css` |
| **No other font weights** | Only Comfortaa 700 — never light, regular, or medium |
| **No direct lucide-react imports** | Import from `@/lib/icons` only, using `ICON_MAP` |
| **No server calls in tools** | All processing must run in the browser — Canvas, FileReader, WebWorker |
| **Always `'use client'` at top** | Every tool file is a client component |
| **Never modify globals.css** | Add CSS only if absolutely necessary, and only in the tool file as inline styles using CSS vars |
| **Never modify tools-catalog.js except the status field** | The catalog is pre-populated — only flip `status` |

---

## Key File Locations

| File | Purpose |
|------|---------|
| `lib/tools-catalog.js` | Single source of truth for all 175 tools — names, slugs, descriptions, icons, related tools |
| `lib/tools-registry.js` | Maps live slugs to their React components |
| `lib/icons.js` | `ICON_MAP` — all icon exports, keyed by string name |
| `lib/tool-utils.js` | Shared utilities: `formatBytes`, `downloadBlob`, `downloadText`, `useDebounce`, `useCopyState`, etc. |
| `styles/globals.css` | All design tokens and CSS classes |
| `tools/_TEMPLATE_TEXT.jsx` | **Starter template** for text-in/text-out tools |
| `tools/_TEMPLATE_FILE.jsx` | **Starter template** for file-in/file-out tools |
| `docs/CODEX_PLAYBOOK.md` | **Full implementation guide** — read before implementing any tool |

---

## Design Tokens (Quick Reference)

```css
/* Backgrounds */
--bg            #08080D   /* page background */
--surface       #111116   /* elevated sections */
--card          #17171E   /* card/panel background */
--card-hover    #1E1E28   /* card hover state */

/* Text */
--text          #FFFFFF   /* primary */
--text-dim      #BBBBD0   /* secondary headings */
--muted         #7A7A90   /* body copy, labels */
--faint         #3A3A4A   /* disabled, hints */

/* Borders */
--border        #252530
--border-hover  #3A3A4A

/* Interactive */
--pill-bg       #FFFFFF   /* primary button / active pill */
--pill-text     #08080D
--accent        #3B82F6   /* focus rings ONLY */
--accent-dim    rgba(59,130,246,0.12)

/* Semantic */
--success / --success-bg   green states
--error   / --error-bg     red states
```

---

## Tool Page Structure (Auto-wired)

When you register a tool as `'live'`, the page at `/tools/[slug]` automatically gets:

- **Centered ToolHeader** — icon, category tag, title, description, trust badges
- **FormatSwitcher** — only appears if `tool.outputFormats` has 2+ entries
- **Your tool component** (the file you create)
- **RelatedTools grid** — auto-populated from `tool.relatedTo`

You do not need to wire any of this up yourself.

---

## Full Guide

See **`docs/CODEX_PLAYBOOK.md`** for:
- All five archetypes with complete patterns
- State management patterns (loading, error, empty, success)
- CSS class reference
- Per-archetype quality checklist
- How to handle tools that need external npm packages
