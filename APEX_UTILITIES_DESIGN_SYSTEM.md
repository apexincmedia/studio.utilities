# Apex Studio Utilities — Design System
> Feed this file to Codex at the start of every build session.
> Every page, component, and interaction on this site must conform to these rules exactly.

---

## 1. Brand Identity

**Product:** Apex Studio Utilities
**Parent brand:** Apex
**Tone:** Refined dark minimalism. Premium utility tool. Fast, private, no clutter.
**Differentiator:** Looks nothing like the competition (Smallpdf, Convertio, ILovePDF). Those are clinical and dated. This is sharp, purposeful, and brand-forward.

---

## 2. Color Tokens

All colors must be declared as CSS custom properties on `:root`. Never hardcode hex values in component styles.

```css
:root {
  /* Backgrounds */
  --bg:          #08080D;   /* Page background — near black with slight blue undertone */
  --surface:     #111116;   /* Elevated surface — nav, inputs, secondary panels */
  --card:        #17171E;   /* Default card background */
  --card-hover:  #1E1E28;   /* Card hover state */

  /* Borders */
  --border:      #252530;   /* Default border */
  --border-hover:#3A3A4A;   /* Hover/focus border */

  /* Text */
  --text:        #FFFFFF;   /* Primary text */
  --muted:       #7A7A90;   /* Secondary / subtext */
  --faint:       #3A3A4A;   /* Tertiary / labels / disabled */

  /* Interactive */
  --pill-bg:     #FFFFFF;   /* Primary button / pill fill */
  --pill-text:   #08080D;   /* Primary button / pill label */

  /* Semantic (use sparingly, only for status) */
  --success:     #1A7A4A;
  --success-bg:  #0D2B1E;
  --error:       #A03030;
  --error-bg:    #2B0D0D;
  --warning:     #8A6A00;
  --warning-bg:  #2B2200;
}
```

**Rules:**
- Background layers stack: `--bg` → `--surface` → `--card` → `--card-hover`
- Never use pure `#000000` or `#FFFFFF` as backgrounds — always use the token
- Semantic colors (success, error, warning) are for status badges and alerts only — never for layout

---

## 3. Typography

**Font:** Comfortaa Bold — the only font used across the entire site.
**Weight:** 700 exclusively. Never use Comfortaa at 300, 400, or 500.

```html
<!-- Always include this in <head> -->
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&display=swap" rel="stylesheet" />
```

```css
:root {
  --font: 'Comfortaa', sans-serif;
}

body {
  font-family: var(--font);
  font-weight: 700;
}
```

### Type Scale

| Role           | Size     | Color        | Usage                            |
|----------------|----------|--------------|----------------------------------|
| Hero title     | 64–72px  | `--text`     | One per page, hero only          |
| Page title     | 40–48px  | `--text`     | Interior page headers            |
| Section title  | 24–28px  | `--text`     | Section headings                 |
| Card title     | 16–18px  | `--text`     | Card / feature headings          |
| Body           | 14–16px  | `--muted`    | Descriptions, subtitles          |
| Label          | 11–12px  | `--muted`    | Form labels, metadata            |
| Micro / tag    | 10–11px  | `--muted`    | Uppercase tags, nav items, pills |

**Letter spacing rules:**
- All-caps text (nav, labels, tags, buttons): `letter-spacing: 0.10em` minimum, up to `0.15em`
- All other text: no letter spacing override
- All nav items, button text, section labels: `text-transform: uppercase`

---

## 4. Spacing System

Use this scale for all margin, padding, and gap values. Never use arbitrary values.

```
4px   — micro gaps (icon-to-label, inline elements)
8px   — component internal gaps
12px  — grid gap between cards
16px  — standard padding inside small components
20px  — button horizontal padding
24px  — card padding (standard)
32px  — card padding (featured / large)
40px  — section horizontal padding, nav padding
48px  — section vertical padding (footer, small sections)
60px  — between section blocks
80px  — major section padding
100px — hero top padding
```

---

## 5. Border Radius

```css
:root {
  --radius-sm:   8px;    /* Badges, tags, small elements */
  --radius-md:   12px;   /* Icons, small cards */
  --radius-lg:   20px;   /* Standard cards */
  --radius-pill: 999px;  /* Buttons, inputs, nav links, tool pills */
}
```

**Rule:** Everything is either a full pill (`999px`) or a large card radius (`20px`). Avoid intermediate values like `6px`, `10px`, or `16px` unless building icon containers (`12px`).

---

## 6. Component Specs

### 6.1 Navigation Bar

```
Height:          64px
Background:      var(--bg)
Border-bottom:   1px solid var(--border)
Position:        sticky, top: 0, z-index: 100
Padding:         0 40px
Layout:          flex, space-between, align-items: center
```

**Logo:**
- Diamond shape: 22×22px white square, `transform: rotate(45deg)`, `border-radius: 4px`
- Wordmark: "Apex" at 18px + `--logo-sub` span for "Studio Utilities" at 13px uppercase muted
- Gap between diamond and wordmark: 10px

**Nav Links:**
- Font: Comfortaa Bold, 11px, uppercase, `letter-spacing: 0.12em`
- Color default: `--muted`
- Hover: `color: --text`, `background: --surface`
- Active: `color: --pill-text`, `background: --pill-bg`
- Border radius: `--radius-pill`
- Padding: `8px 16px`

### 6.2 Primary Button

```css
.btn-primary {
  background:    var(--pill-bg);
  color:         var(--pill-text);
  font-family:   var(--font);
  font-size:     11px;
  font-weight:   700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  padding:       10px 24px;
  border-radius: var(--radius-pill);
  border:        none;
  cursor:        pointer;
  transition:    opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
```

### 6.3 Secondary Button / Ghost Button

```css
.btn-ghost {
  background:    transparent;
  color:         var(--muted);
  border:        1px solid var(--border);
  font-family:   var(--font);
  font-size:     11px;
  font-weight:   700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  padding:       10px 24px;
  border-radius: var(--radius-pill);
  cursor:        pointer;
  transition:    color 0.2s, border-color 0.2s, background 0.2s;
}
.btn-ghost:hover {
  color:         var(--text);
  border-color:  var(--border-hover);
  background:    var(--card);
}
```

### 6.4 Text Input / Search Field

```css
.input {
  background:    var(--surface);
  border:        1px solid var(--border);
  border-radius: var(--radius-pill);
  padding:       14px 24px;
  font-family:   var(--font);
  font-size:     14px;
  font-weight:   700;
  color:         var(--text);
  outline:       none;
  width:         100%;
  transition:    border-color 0.2s;
}
.input::placeholder { color: var(--muted); }
.input:focus        { border-color: var(--border-hover); }
```

**Search bar pattern:** Pill input + absolutely positioned primary button on the right (8px inset from edge).

### 6.5 Standard Card

```css
.card {
  background:    var(--card);
  border:        1px solid var(--border);
  border-radius: var(--radius-lg);   /* 20px */
  padding:       24px;
  transition:    background 0.2s, border-color 0.2s, transform 0.15s;
  cursor:        pointer;
}
.card:hover {
  background:    var(--card-hover);
  border-color:  var(--border-hover);
  transform:     translateY(-2px);
}
```

### 6.6 Featured / Accent Card

Same as standard card but with two variants:

**Dark variant (default featured):**
- Same as `.card` but padding: 32px
- Larger title (22px), muted subtitle below

**Accent variant (white fill — hero featured tool):**
```css
.card-accent {
  background:    var(--text);        /* White fill */
  border-color:  var(--text);
}
.card-accent .card-title   { color: var(--bg); }
.card-accent .card-sub     { color: rgba(8,8,13,0.55); }
.card-accent .card-tag     { background: rgba(8,8,13,0.08); color: var(--bg); border-color: transparent; }
```

Use `.card-accent` for exactly one featured card per page — the primary call-to-action tool.

### 6.7 Category Tag / Mini Badge

```css
.tag {
  display:        inline-block;
  font-size:      10px;
  font-weight:    700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color:          var(--muted);
  background:     var(--surface);
  border:         1px solid var(--border);
  border-radius:  var(--radius-pill);
  padding:        4px 12px;
}
```

### 6.8 Tool Pill (Quick Access)

```css
.tool-pill {
  background:     var(--surface);
  border:         1px solid var(--border);
  border-radius:  var(--radius-pill);
  padding:        7px 16px;
  font-size:      12px;
  font-weight:    700;
  color:          var(--muted);
  cursor:         pointer;
  white-space:    nowrap;
  transition:     background 0.15s, color 0.15s, border-color 0.15s;
}
.tool-pill:hover {
  background:     var(--card-hover);
  color:          var(--text);
  border-color:   var(--border-hover);
}
```

### 6.9 Section Label

```css
.section-label {
  font-size:      11px;
  font-weight:    700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color:          var(--muted);
  margin-bottom:  24px;
}
```

### 6.10 Icon Container

```css
.icon-wrap {
  width:          40px;
  height:         40px;
  background:     var(--surface);
  border:         1px solid var(--border);
  border-radius:  var(--radius-md);   /* 12px */
  display:        flex;
  align-items:    center;
  justify-content:center;
  font-size:      18px;
  margin-bottom:  16px;
}
```

### 6.11 Stat Block

```css
.stat-num   { font-size: 28px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.10em; margin-top: 2px; }
.stat-divider { width: 1px; height: 36px; background: var(--border); }
```

Stat blocks are always horizontal, centered, separated by `.stat-divider`.

### 6.12 Upload / Drop Zone

```css
.drop-zone {
  background:     var(--card);
  border:         2px dashed var(--border);
  border-radius:  var(--radius-lg);
  padding:        60px 40px;
  text-align:     center;
  cursor:         pointer;
  transition:     border-color 0.2s, background 0.2s;
}
.drop-zone:hover,
.drop-zone.drag-over {
  border-color:   var(--border-hover);
  background:     var(--card-hover);
}
.drop-zone-title { font-size: 16px; color: var(--text); margin-bottom: 8px; }
.drop-zone-sub   { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
```

### 6.13 Progress Bar

```css
.progress-track {
  background:     var(--surface);
  border-radius:  var(--radius-pill);
  height:         4px;
  width:          100%;
  overflow:       hidden;
}
.progress-fill {
  background:     var(--text);
  height:         100%;
  border-radius:  var(--radius-pill);
  transition:     width 0.3s ease;
}
```

### 6.14 Status Badge

```css
.badge-success { background: var(--success-bg); color: #4ADE80; border-radius: var(--radius-pill); padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.badge-error   { background: var(--error-bg);   color: #F87171; border-radius: var(--radius-pill); padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.badge-pending { background: var(--surface);    color: var(--muted); border-radius: var(--radius-pill); padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
```

---

## 7. Layout Patterns

### 7.1 Page Shell

```
Full-width background: var(--bg)
Max content width:     1200px
Content padding:       0 40px
Nav:                   sticky, full-width
Footer:                full-width, max-width 1200px content
```

### 7.2 Hero Section

```
Padding:           100px 40px 80px
Text-align:        center
Stack order:       hero-tag → h1 → p → search-bar → stats
Max-width on p:    480px (centered)
Max-width search:  560px (centered)
```

### 7.3 Card Grid (Category / Tool listing)

```css
.card-grid {
  display:               grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap:                   12px;
}
```

### 7.4 Featured 2-Up Row

```css
.featured-row {
  display:               grid;
  grid-template-columns: 1fr 1fr;
  gap:                   12px;
  margin-bottom:         12px;
}
```

### 7.5 Tool Page Layout (Individual tool)

```
Left column  (65%): Drop zone + output area
Right column (35%): Options panel (settings, format selectors, action button)
Gap:                20px
Mobile:             stack vertically, options above output
```

### 7.6 Footer

```css
footer {
  display:               grid;
  grid-template-columns: 200px 1fr 1fr 1fr 1fr;
  gap:                   40px;
  padding:               48px 40px;
  border-top:            1px solid var(--border);
  max-width:             1200px;
  margin:                0 auto;
}
```

Footer logo: diamond mark only (no wordmark), + "Studio Utilities" as muted subtext below.

---

## 8. Motion & Interaction

**Guiding principle:** Fast and purposeful. Nothing decorative. Motion should communicate state, not entertain.

```css
/* Standard transition for all interactive elements */
transition: background 0.2s, border-color 0.2s, color 0.2s;

/* Card lift on hover */
transition: background 0.2s, border-color 0.2s, transform 0.15s;
transform:  translateY(-2px);  /* hover state only */

/* Button press */
transform: scale(0.97);  /* active state */

/* Page load stagger (apply to hero children) */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero > * { animation: fadeUp 0.4s ease forwards; }
.hero > *:nth-child(1) { animation-delay: 0s; }
.hero > *:nth-child(2) { animation-delay: 0.08s; }
.hero > *:nth-child(3) { animation-delay: 0.16s; }
.hero > *:nth-child(4) { animation-delay: 0.24s; }
.hero > *:nth-child(5) { animation-delay: 0.32s; }
```

**Never use:** bounce, spring physics, slide-from-left/right, rotation animations, color pulse, glow effects.

---

## 9. Do's and Don'ts

| Do | Don't |
|----|-------|
| Use Comfortaa Bold 700 everywhere | Use any other font or weight |
| Keep all interactive text uppercase | Mix cased and uppercase text in the same context |
| Use white pill buttons as primary CTA | Use colored buttons (blue, green, etc.) |
| Use `--muted` for all secondary text | Use pure white for subtitles/descriptions |
| Use `translateY(-2px)` for card hover | Use `box-shadow` for hover lift effect |
| Use dashed border for drop zones | Use solid border for drop zones |
| Stack sections with 60–80px vertical gaps | Compress sections together |
| Use the diamond logo mark in the footer | Put the full wordmark in the footer |
| Use 1px solid `--border` on all cards | Use `box-shadow` for card depth |
| Keep max content width at 1200px | Let content stretch full viewport width |

---

## 10. File / Component Naming Conventions

When Codex generates components, use this naming schema:

```
/components
  /layout
    Navbar.jsx
    Footer.jsx
    PageShell.jsx
  /ui
    Button.jsx          — primary + ghost variants via prop
    Card.jsx            — standard + accent variant via prop
    Input.jsx           — text input + search variant
    ToolPill.jsx
    Tag.jsx
    Badge.jsx
    StatBlock.jsx
    SectionLabel.jsx
    IconWrap.jsx
    DropZone.jsx
    ProgressBar.jsx
  /tool
    ToolHero.jsx        — title, description, tag for each tool page
    ToolLayout.jsx      — 65/35 split layout
    OptionsPanel.jsx    — right column settings
    OutputPanel.jsx     — left column result

/styles
  globals.css           — CSS tokens + body reset only
  components.css        — (optional) shared component base styles
```

---

## 11. CSS Token Import Pattern

Every page/component imports from one source of truth:

```css
/* globals.css — the only place tokens are declared */
:root {
  --bg:          #08080D;
  --surface:     #111116;
  --card:        #17171E;
  --card-hover:  #1E1E28;
  --border:      #252530;
  --border-hover:#3A3A4A;
  --text:        #FFFFFF;
  --muted:       #7A7A90;
  --faint:       #3A3A4A;
  --pill-bg:     #FFFFFF;
  --pill-text:   #08080D;
  --success:     #1A7A4A;
  --success-bg:  #0D2B1E;
  --error:       #A03030;
  --error-bg:    #2B0D0D;
  --warning:     #8A6A00;
  --warning-bg:  #2B2200;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-pill: 999px;
  --font:        'Comfortaa', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background:  var(--bg);
  color:       var(--text);
  font-family: var(--font);
  font-weight: 700;
}
```

---

## 12. Codex Prompt Prefix

Paste this at the top of every Codex session for this project:

```
You are building Apex Studio Utilities — a dark-themed web utility suite.
Always reference APEX_UTILITIES_DESIGN_SYSTEM.md before writing any component.
Rules that are never negotiable:
1. Font: Comfortaa Bold 700 only. No other fonts or weights.
2. Colors: CSS token variables only. Never hardcode hex values in components.
3. Border radius: --radius-pill for buttons/inputs/pills, --radius-lg for cards.
4. Buttons: white fill (--pill-bg) + dark text (--pill-text), uppercase, letter-spaced.
5. Cards: --card background, 1px solid --border, --radius-lg, hover lifts 2px.
6. All nav items and labels: uppercase, letter-spacing 0.12em minimum.
7. Max content width: 1200px. Page background: --bg (#08080D).
8. Never use box-shadow for depth. Use border + background change instead.
9. Never use colored buttons. Primary CTA is always white pill.
10. Transitions: 0.2s ease on background/color/border. 0.15s on transform.
```
