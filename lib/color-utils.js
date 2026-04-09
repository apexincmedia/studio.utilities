function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHue(value) {
  const hue = value % 360;
  return hue < 0 ? hue + 360 : hue;
}

function parseNumberList(input) {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function hexToRgb(input) {
  const match = input.trim().match(/^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/);
  if (!match) return null;

  let hex = match[1];
  if (hex.length === 3) {
    hex = hex.split('').map((char) => `${char}${char}`).join('');
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    h: Math.round(normalizeHue(hue)),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hueToRgbChannel(p, q, t) {
  let next = t;
  if (next < 0) next += 1;
  if (next > 1) next -= 1;
  if (next < 1 / 6) return p + (q - p) * 6 * next;
  if (next < 1 / 2) return q;
  if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
  return p;
}

export function hslToRgb({ h, s, l }) {
  const hue = normalizeHue(h) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgbChannel(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgbChannel(p, q, hue) * 255),
    b: Math.round(hueToRgbChannel(p, q, hue - 1 / 3) * 255),
  };
}

export function rgbToHsv({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  const saturation = max === 0 ? 0 : delta / max;

  return {
    h: Math.round(normalizeHue(hue)),
    s: Math.round(saturation * 100),
    v: Math.round(max * 100),
  };
}

export function hsvToRgb({ h, s, v }) {
  const hue = normalizeHue(h);
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;

  const chroma = value * saturation;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (section >= 0 && section < 1) [red, green, blue] = [chroma, x, 0];
  else if (section < 2) [red, green, blue] = [x, chroma, 0];
  else if (section < 3) [red, green, blue] = [0, chroma, x];
  else if (section < 4) [red, green, blue] = [0, x, chroma];
  else if (section < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  const match = value - chroma;

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

export function rgbToCmyk({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const key = 1 - Math.max(red, green, blue);

  if (key >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - red - key) / (1 - key)) * 100),
    m: Math.round(((1 - green - key) / (1 - key)) * 100),
    y: Math.round(((1 - blue - key) / (1 - key)) * 100),
    k: Math.round(key * 100),
  };
}

export function cmykToRgb({ c, m, y, k }) {
  const cyan = clamp(c, 0, 100) / 100;
  const magenta = clamp(m, 0, 100) / 100;
  const yellow = clamp(y, 0, 100) / 100;
  const key = clamp(k, 0, 100) / 100;

  return {
    r: Math.round(255 * (1 - cyan) * (1 - key)),
    g: Math.round(255 * (1 - magenta) * (1 - key)),
    b: Math.round(255 * (1 - yellow) * (1 - key)),
  };
}

export function parseColorInput(input = '') {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hex = hexToRgb(trimmed);
  if (hex) return hex;

  const rgbMatch = trimmed.match(/^rgba?\((.+)\)$/i);
  if (rgbMatch) {
    const parts = parseNumberList(rgbMatch[1]);
    if (parts.length >= 3) {
      const parseChannel = (value) => {
        if (value.endsWith('%')) {
          return Math.round((Number.parseFloat(value) / 100) * 255);
        }
        return Number.parseFloat(value);
      };

      return {
        r: clamp(parseChannel(parts[0]), 0, 255),
        g: clamp(parseChannel(parts[1]), 0, 255),
        b: clamp(parseChannel(parts[2]), 0, 255),
      };
    }
  }

  const hslMatch = trimmed.match(/^hsla?\((.+)\)$/i);
  if (hslMatch) {
    const parts = parseNumberList(hslMatch[1]);
    if (parts.length >= 3) {
      return hslToRgb({
        h: Number.parseFloat(parts[0]),
        s: Number.parseFloat(parts[1]),
        l: Number.parseFloat(parts[2]),
      });
    }
  }

  const hsvMatch = trimmed.match(/^hsv\((.+)\)$/i);
  if (hsvMatch) {
    const parts = parseNumberList(hsvMatch[1]);
    if (parts.length >= 3) {
      return hsvToRgb({
        h: Number.parseFloat(parts[0]),
        s: Number.parseFloat(parts[1]),
        v: Number.parseFloat(parts[2]),
      });
    }
  }

  const cmykMatch = trimmed.match(/^cmyk\((.+)\)$/i);
  if (cmykMatch) {
    const parts = parseNumberList(cmykMatch[1]);
    if (parts.length >= 4) {
      return cmykToRgb({
        c: Number.parseFloat(parts[0]),
        m: Number.parseFloat(parts[1]),
        y: Number.parseFloat(parts[2]),
        k: Number.parseFloat(parts[3]),
      });
    }
  }

  return null;
}

export function getColorFormats(rgb) {
  const safeRgb = {
    r: clamp(Math.round(rgb.r), 0, 255),
    g: clamp(Math.round(rgb.g), 0, 255),
    b: clamp(Math.round(rgb.b), 0, 255),
  };
  const hsl = rgbToHsl(safeRgb);
  const hsv = rgbToHsv(safeRgb);
  const cmyk = rgbToCmyk(safeRgb);

  return {
    hex: rgbToHex(safeRgb),
    rgb: `rgb(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    rgbObject: safeRgb,
    hslObject: hsl,
    hsvObject: hsv,
    cmykObject: cmyk,
  };
}
