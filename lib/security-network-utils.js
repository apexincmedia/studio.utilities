const AMBIGUOUS_CHARACTERS = new Set(['0', 'O', 'o', '1', 'l', 'I']);
const SIMILAR_CHARACTERS = new Set(['2', 'Z', '5', 'S', '6', 'G', '8', 'B', '9', 'g', 'q']);

const COMMON_PASSWORDS = new Set([
  '123456',
  '123456789',
  '12345678',
  'password',
  'qwerty',
  'qwerty123',
  '111111',
  '123123',
  'abc123',
  'password1',
  'admin',
  'welcome',
  'letmein',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'iloveyou',
  'shadow',
  'sunshine',
  'master',
  'superman',
  'starwars',
  'princess',
  'login',
  'passw0rd',
  'trustno1',
]);

const KEYBOARD_PATTERNS = [
  'qwerty',
  'asdfgh',
  'zxcvbn',
  '123456',
  '654321',
  'password',
  'letmein',
];

function randomIndexes(count, limit) {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value % limit);
}

export function buildPasswordCharset(options) {
  let charset = '';

  if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.digits) charset += '0123456789';
  if (options.symbols) charset += '!@#$%^&*()-_=+[]{};:,.?/|~';

  const excluded = new Set(
    `${options.customExclude || ''}`
      .split('')
      .concat(options.excludeAmbiguous ? Array.from(AMBIGUOUS_CHARACTERS) : [])
      .concat(options.excludeSimilar ? Array.from(SIMILAR_CHARACTERS) : [])
  );

  return Array.from(new Set(charset.split(''))).filter((char) => !excluded.has(char)).join('');
}

export function generatePasswords(options) {
  const charset = buildPasswordCharset(options);
  if (!charset) {
    throw new Error('Select at least one character group to build a password charset.');
  }

  return Array.from({ length: options.quantity }, () => {
    const indexes = randomIndexes(options.length, charset.length);
    return indexes.map((index) => charset[index]).join('');
  });
}

export function scorePassword(password = '') {
  const suggestions = [];
  let score = Math.min(password.length * 4, 40);

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const varietyScore = [hasLowercase, hasUppercase, hasDigits, hasSymbols].filter(Boolean).length;

  score += Math.min(varietyScore * 8, 30);

  if (password.length >= 16) {
    score += 8;
  } else if (password.length < 12) {
    suggestions.push('Use at least 12 characters for a stronger password.');
  }

  if (!hasUppercase) suggestions.push('Add uppercase letters.');
  if (!hasLowercase) suggestions.push('Add lowercase letters.');
  if (!hasDigits) suggestions.push('Include numbers.');
  if (!hasSymbols) suggestions.push('Include symbols for more entropy.');

  const lowerPassword = password.toLowerCase();

  if (COMMON_PASSWORDS.has(lowerPassword)) {
    score -= 35;
    suggestions.push('Avoid common passwords or tiny variations of them.');
  }

  if (KEYBOARD_PATTERNS.some((pattern) => lowerPassword.includes(pattern))) {
    score -= 20;
    suggestions.push('Avoid keyboard or number-row patterns like qwerty or 123456.');
  }

  if (/([a-zA-Z0-9])\1{2,}/.test(password)) {
    score -= 12;
    suggestions.push('Avoid repeated characters like aaa or 111.');
  }

  if (/(.+)\1{1,}/.test(password) && password.length >= 6) {
    score -= 12;
    suggestions.push('Avoid repeating the same chunks or words.');
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  let category = 'Weak';
  if (normalizedScore >= 90) category = 'Very Strong';
  else if (normalizedScore >= 75) category = 'Strong';
  else if (normalizedScore >= 55) category = 'Good';
  else if (normalizedScore >= 35) category = 'Fair';

  if (!suggestions.length && password) {
    suggestions.push('This password already has a strong mix of length and character variety.');
  }

  return {
    score: normalizedScore,
    category,
    suggestions: Array.from(new Set(suggestions)),
    checks: {
      length: password.length,
      hasLowercase,
      hasUppercase,
      hasDigits,
      hasSymbols,
      varietyScore,
      isCommon: COMMON_PASSWORDS.has(lowerPassword),
      hasKeyboardPattern: KEYBOARD_PATTERNS.some((pattern) => lowerPassword.includes(pattern)),
    },
  };
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function bytesToAlphaNumeric(bytes) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join('');
}

export function generateRandomTokens({ byteLength, quantity, format }) {
  return Array.from({ length: quantity }, () => {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);

    if (format === 'base64') return bytesToBase64(bytes);
    if (format === 'alphanumeric') return bytesToAlphaNumeric(bytes);
    return bytesToHex(bytes);
  });
}

export function parseUserAgentString(userAgent = '') {
  const source = userAgent || '';

  const browserMatchers = [
    ['Edge', /Edg\/([\d.]+)/],
    ['Opera', /OPR\/([\d.]+)/],
    ['Chrome', /Chrome\/([\d.]+)/],
    ['Firefox', /Firefox\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/],
  ];

  const osMatchers = [
    ['Windows', /Windows NT ([\d.]+)/],
    ['macOS', /Mac OS X ([\d_]+)/],
    ['iOS', /iPhone OS ([\d_]+)/],
    ['iPadOS', /CPU OS ([\d_]+)/],
    ['Android', /Android ([\d.]+)/],
    ['Linux', /Linux/],
  ];

  const browserMatch =
    browserMatchers.find(([, pattern]) => pattern.test(source)) ?? ['Unknown', null];
  const osMatch = osMatchers.find(([, pattern]) => pattern.test(source)) ?? ['Unknown', null];

  const browserVersion = browserMatch[1]
    ? source.match(browserMatch[1])?.[1]?.replace(/_/g, '.') ?? 'Unknown'
    : 'Unknown';
  const osVersion = osMatch[1]
    ? source.match(osMatch[1])?.[1]?.replace(/_/g, '.') ?? 'Unknown'
    : 'Unknown';

  let deviceType = 'Desktop';
  if (/Tablet|iPad/i.test(source)) deviceType = 'Tablet';
  else if (/Mobile|Android|iPhone/i.test(source)) deviceType = 'Mobile';

  let engine = 'Unknown';
  if (/AppleWebKit/i.test(source) && !/Chrome|Edg|OPR/i.test(source)) engine = 'WebKit';
  else if (/AppleWebKit/i.test(source)) engine = 'Blink';
  else if (/Gecko/i.test(source) && /Firefox/i.test(source)) engine = 'Gecko';

  return {
    browser: browserMatch[0],
    browserVersion,
    os: osMatch[0],
    osVersion,
    deviceType,
    engine,
    raw: source,
  };
}

export function normalizeDomainInput(input = '') {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}
