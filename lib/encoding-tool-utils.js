'use client';

const HTML_NAMED_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '\u00A0': '&nbsp;',
  '\u00A9': '&copy;',
  '\u00AE': '&reg;',
  '\u2122': '&trade;',
};

export const JWT_ALGORITHMS = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

export function encodeUrlValue(input = '', { mode = 'encode', scope = 'component' } = {}) {
  try {
    if (mode === 'encode') {
      return {
        output: scope === 'component' ? encodeURIComponent(input) : encodeURI(input),
        error: null,
      };
    }

    return {
      output: scope === 'component' ? decodeURIComponent(input) : decodeURI(input),
      error: null,
    };
  } catch (error) {
    return {
      output: '',
      error: mode === 'decode' ? 'The URL value could not be decoded.' : error.message,
    };
  }
}

export function encodeHtmlEntities(text = '', style = 'named') {
  return Array.from(text)
    .map((character) => {
      const codePoint = character.codePointAt(0);
      const requiresEncoding = codePoint > 127 || Object.prototype.hasOwnProperty.call(HTML_NAMED_ENTITIES, character);

      if (!requiresEncoding) return character;

      if (style === 'named' && HTML_NAMED_ENTITIES[character]) {
        return HTML_NAMED_ENTITIES[character];
      }

      if (style === 'hex') {
        return `&#x${codePoint.toString(16).toUpperCase()};`;
      }

      return `&#${codePoint};`;
    })
    .join('');
}

export function decodeHtmlEntities(text = '') {
  if (typeof window === 'undefined' || !window.DOMParser) return text;
  const document = new window.DOMParser().parseFromString(text, 'text/html');
  return document.documentElement.textContent || '';
}

export function encodeHexText(text = '', { separator = 'space', prefix = 'plain' } = {}) {
  const bytes = new TextEncoder().encode(text);
  const joiner = separator === 'none' ? '' : separator === 'newline' ? '\n' : ' ';

  return Array.from(bytes)
    .map((byte) => {
      const hex = byte.toString(16).padStart(2, '0');
      if (prefix === '0x') return `0x${hex}`;
      if (prefix === '\\x') return `\\x${hex}`;
      return hex;
    })
    .join(joiner);
}

export function decodeHexText(input = '') {
  const cleaned = input
    .replace(/0x/gi, ' ')
    .replace(/\\x/gi, ' ')
    .replace(/[^0-9a-fA-F]/g, ' ')
    .trim()
    .split(/\s+/)
    .join('');

  if (!cleaned) return '';
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex input must contain complete byte pairs.');
  }

  const bytes = new Uint8Array(
    cleaned.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16))
  );
  return new TextDecoder().decode(bytes);
}

export function toBase64Url(input = '') {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function encodeObjectToBase64Url(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function signJwtToken({ payloadText, secret, algorithm = 'HS256' }) {
  const payload = JSON.parse(payloadText);
  const header = { alg: algorithm, typ: 'JWT' };
  const encodedHeader = encodeObjectToBase64Url(header);
  const encodedPayload = encodeObjectToBase64Url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: JWT_ALGORITHMS[algorithm] },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  signatureBytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const signature = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  return {
    token: `${unsignedToken}.${signature}`,
    header,
    payload,
  };
}

export function buildJwtClaimPayload(payloadText = '', claim) {
  const payload = JSON.parse(payloadText || '{}');
  const now = Math.floor(Date.now() / 1000);

  if (claim === 'iat') payload.iat = now;
  if (claim === 'nbf') payload.nbf = now;
  if (claim === 'exp') payload.exp = now + 3600;
  if (claim === 'sub') payload.sub = payload.sub || 'user-123';
  if (claim === 'iss') payload.iss = payload.iss || 'apex-studio-utilities';

  return JSON.stringify(payload, null, 2);
}

export function bytesToBinary(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join(' ');
}

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

export function bytesToOctal(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(8).padStart(3, '0'))
    .join(' ');
}

export function bytesToDecimal(bytes) {
  return Array.from(bytes).map((byte) => String(byte)).join(' ');
}

function bytesToAggregateValue(bytes) {
  if (!bytes.length) return '0';
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return BigInt(`0x${hex}`).toString(10);
}

function normalizeBinaryInput(input = '') {
  const cleaned = input.replace(/[^01]/g, '');
  if (!cleaned || cleaned.length % 8 !== 0) {
    throw new Error('Binary input must be grouped into complete 8-bit bytes.');
  }
  return new Uint8Array(cleaned.match(/.{8}/g).map((chunk) => Number.parseInt(chunk, 2)));
}

function normalizeHexInput(input = '') {
  const cleaned = input
    .replace(/0x/gi, ' ')
    .replace(/\\x/gi, ' ')
    .replace(/[^0-9a-fA-F]/g, '')
    .trim();

  if (!cleaned || cleaned.length % 2 !== 0) {
    throw new Error('Hex input must contain complete byte pairs.');
  }

  return new Uint8Array(cleaned.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16)));
}

function normalizeOctalInput(input = '') {
  const cleaned = input.trim().replace(/^0o/i, '');
  const value = BigInt(`0o${cleaned}`);
  return buildNumericRepresentations(value, 'octal');
}

function buildTextRepresentations(text = '') {
  const bytes = new TextEncoder().encode(text);
  return {
    detectedType: 'text',
    text,
    binary: bytesToBinary(bytes),
    decimal: bytesToDecimal(bytes),
    hex: bytesToHex(bytes),
    octal: bytesToOctal(bytes),
  };
}

function buildByteRepresentations(bytes, detectedType) {
  let decodedText = '';
  try {
    decodedText = new TextDecoder().decode(bytes);
  } catch {
    decodedText = '';
  }

  return {
    detectedType,
    text: decodedText,
    binary: bytesToBinary(bytes),
    decimal: bytesToAggregateValue(bytes),
    hex: bytesToHex(bytes),
    octal: bytesToOctal(bytes),
  };
}

function buildNumericRepresentations(value, detectedType = 'decimal') {
  const numeric = BigInt(value);
  const hex = numeric.toString(16).toUpperCase();
  const paddedHex = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = paddedHex ? new Uint8Array(paddedHex.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16))) : new Uint8Array([]);

  let text = '';
  if (numeric <= BigInt(0x10FFFF)) {
    try {
      text = String.fromCodePoint(Number(numeric));
    } catch {
      text = '';
    }
  } else {
    try {
      text = new TextDecoder().decode(bytes);
    } catch {
      text = '';
    }
  }

  return {
    detectedType,
    text,
    binary: numeric.toString(2),
    decimal: numeric.toString(10),
    hex: hex || '0',
    octal: numeric.toString(8),
  };
}

export function convertAnyInput(input = '') {
  const value = input.trim();
  if (!value) {
    return {
      detectedType: 'text',
      text: '',
      binary: '',
      decimal: '',
      hex: '',
      octal: '',
      error: null,
    };
  }

  try {
    if (/^[01\s]+$/.test(value)) {
      return { ...buildByteRepresentations(normalizeBinaryInput(value), 'binary'), error: null };
    }

    if (/^0o[0-7]+$/i.test(value)) {
      return { ...normalizeOctalInput(value), error: null };
    }

    if (/^(?:0x|\\x)?[0-9a-fA-F\s]+$/.test(value) && /[a-fA-F]/.test(value)) {
      return { ...buildByteRepresentations(normalizeHexInput(value), 'hex'), error: null };
    }

    if (/^\d+$/.test(value)) {
      return { ...buildNumericRepresentations(BigInt(value), 'decimal'), error: null };
    }

    return { ...buildTextRepresentations(input), error: null };
  } catch (error) {
    return {
      detectedType: 'unknown',
      text: '',
      binary: '',
      decimal: '',
      hex: '',
      octal: '',
      error: error.message,
    };
  }
}

export const MORSE_TABLE = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  0: '-----',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
};

const REVERSE_MORSE_TABLE = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([key, value]) => [value, key])
);

export function textToMorse(text = '') {
  return text
    .toUpperCase()
    .split('')
    .map((character) => {
      if (character === ' ') return '/';
      return MORSE_TABLE[character] || '?';
    })
    .join(' ');
}

export function morseToText(input = '') {
  return input
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (token === '/') return ' ';
      return REVERSE_MORSE_TABLE[token] || '?';
    })
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function splitMorseTokens(morse = '') {
  return morse.trim().split(/\s+/).filter(Boolean);
}

export function rot13Transform(input = '') {
  return input.replace(/[a-zA-Z]/g, (character) => {
    const start = character <= 'Z' ? 65 : 97;
    const offset = character.charCodeAt(0) - start;
    return String.fromCharCode(start + ((offset + 13) % 26));
  });
}

export function caesarShift(input = '', shift = 0) {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return input.replace(/[a-zA-Z]/g, (character) => {
    const start = character <= 'Z' ? 65 : 97;
    const offset = character.charCodeAt(0) - start;
    return String.fromCharCode(start + ((offset + normalizedShift) % 26));
  });
}

export function encodeBinaryText(text = '', { separator = 'space', grouped = true } = {}) {
  const bytes = new TextEncoder().encode(text);
  const groups = Array.from(bytes).map((byte) => byte.toString(2).padStart(8, '0'));
  if (separator === 'none') return groups.join('');
  if (separator === 'newline') return groups.join('\n');
  return grouped ? groups.join(' ') : groups.join('');
}

export function decodeBinaryText(input = '') {
  const cleaned = input.replace(/[^01]/g, '');
  if (!cleaned) return '';
  if (cleaned.length % 8 !== 0) {
    throw new Error('Binary input must contain complete 8-bit bytes.');
  }

  const bytes = new Uint8Array(
    cleaned.match(/.{8}/g).map((group) => Number.parseInt(group, 2))
  );
  return new TextDecoder().decode(bytes);
}

const CONTROL_NAMES = [
  'NUL',
  'SOH',
  'STX',
  'ETX',
  'EOT',
  'ENQ',
  'ACK',
  'BEL',
  'BS',
  'TAB',
  'LF',
  'VT',
  'FF',
  'CR',
  'SO',
  'SI',
  'DLE',
  'DC1',
  'DC2',
  'DC3',
  'DC4',
  'NAK',
  'SYN',
  'ETB',
  'CAN',
  'EM',
  'SUB',
  'ESC',
  'FS',
  'GS',
  'RS',
  'US',
];

export function buildAsciiRows(includeExtended = false) {
  const max = includeExtended ? 255 : 127;
  const rows = [];

  for (let code = 0; code <= max; code += 1) {
    const character =
      code < 32
        ? ''
        : code === 32
          ? ' '
          : String.fromCharCode(code);

    const description =
      code < 32
        ? CONTROL_NAMES[code]
        : code === 32
          ? 'SPACE'
          : code === 127
            ? 'DEL'
            : `Character ${character || ''}`.trim();

    rows.push({
      code,
      hex: code.toString(16).toUpperCase().padStart(2, '0'),
      binary: code.toString(2).padStart(8, '0'),
      character: code < 32 || code === 127 ? CONTROL_NAMES[code] || 'CTRL' : character,
      entity:
        code < 128
          ? `&#${code};`
          : `&#x${code.toString(16).toUpperCase()};`,
      description,
    });
  }

  return rows;
}

function getUnicodeBlock(codePoint) {
  if (codePoint <= 0x007F) return 'Basic Latin';
  if (codePoint <= 0x00FF) return 'Latin-1 Supplement';
  if (codePoint <= 0x024F) return 'Latin Extended';
  if (codePoint <= 0x03FF) return 'Greek and Coptic';
  if (codePoint <= 0x04FF) return 'Cyrillic';
  if (codePoint <= 0x06FF) return 'Arabic';
  if (codePoint <= 0x07FF) return 'NKo and Samaritan';
  if (codePoint <= 0x0FFF) return 'Indic Scripts';
  if (codePoint <= 0x206F) return 'General Punctuation';
  if (codePoint <= 0x20CF) return 'Currency Symbols';
  if (codePoint <= 0x27BF) return 'Symbols';
  if (codePoint <= 0x2BFF) return 'Arrows and Symbols';
  if (codePoint <= 0x2FFF) return 'CJK Symbols';
  if (codePoint <= 0x9FFF) return 'CJK Unified Ideographs';
  if (codePoint <= 0x1FAFF) return 'Emoji and Symbols';
  return 'Supplementary Planes';
}

function getUnicodeCategory(character = '') {
  if (!character) return 'Unknown';
  if (/\p{L}/u.test(character)) return 'Letter';
  if (/\p{N}/u.test(character)) return 'Number';
  if (/\p{P}/u.test(character)) return 'Punctuation';
  if (/\p{S}/u.test(character)) return 'Symbol';
  if (/\p{Z}/u.test(character)) return 'Separator';
  if (/\p{C}/u.test(character)) return 'Control';
  return 'Other';
}

function getUnicodeName(character, codePoint) {
  if (!character) return `U+${codePoint.toString(16).toUpperCase()} CHARACTER`;
  if (character === ' ') return 'SPACE';
  if (/^[A-Z]$/.test(character)) return `LATIN CAPITAL LETTER ${character}`;
  if (/^[a-z]$/.test(character)) return `LATIN SMALL LETTER ${character.toUpperCase()}`;
  if (/^\d$/.test(character)) return `DIGIT ${character}`;
  return `U+${codePoint.toString(16).toUpperCase()} CHARACTER`;
}

export function lookupUnicodeValue(input = '') {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let codePoint;
  let character;

  if (/^U\+[0-9A-F]{1,6}$/i.test(trimmed) || /^0x[0-9A-F]{1,6}$/i.test(trimmed) || /^[0-9A-F]{2,6}$/i.test(trimmed)) {
    const raw = trimmed.replace(/^U\+/i, '').replace(/^0x/i, '');
    codePoint = Number.parseInt(raw, 16);
    character = String.fromCodePoint(codePoint);
  } else {
    character = Array.from(trimmed)[0];
    codePoint = character.codePointAt(0);
  }

  const utf8Bytes = Array.from(new TextEncoder().encode(character))
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

  return {
    character,
    codePoint,
    hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    htmlEntity: `&#${codePoint};`,
    cssEscape: `\\${codePoint.toString(16).toUpperCase()} `,
    block: getUnicodeBlock(codePoint),
    category: getUnicodeCategory(character),
    name: getUnicodeName(character, codePoint),
    utf8Bytes,
  };
}
