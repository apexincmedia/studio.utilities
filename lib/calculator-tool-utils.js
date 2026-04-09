'use client';

export function formatNumber(value, options = {}) {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    ...options,
  });
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '-';
  return `${formatNumber(value, { maximumFractionDigits: 2 })}%`;
}

export function formatCurrency(value, currency = 'USD', options = {}) {
  if (!Number.isFinite(value)) return '-';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function safeNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const TEMPERATURE_UNITS = {
  c: { label: 'Celsius' },
  f: { label: 'Fahrenheit' },
  k: { label: 'Kelvin' },
};

export const UNIT_CATEGORIES = {
  length: {
    label: 'Length',
    units: {
      m: { label: 'Meters', factor: 1 },
      km: { label: 'Kilometers', factor: 1000 },
      cm: { label: 'Centimeters', factor: 0.01 },
      mm: { label: 'Millimeters', factor: 0.001 },
      mi: { label: 'Miles', factor: 1609.344 },
      yd: { label: 'Yards', factor: 0.9144 },
      ft: { label: 'Feet', factor: 0.3048 },
      in: { label: 'Inches', factor: 0.0254 },
    },
  },
  mass: {
    label: 'Mass',
    units: {
      kg: { label: 'Kilograms', factor: 1 },
      g: { label: 'Grams', factor: 0.001 },
      lb: { label: 'Pounds', factor: 0.45359237 },
      oz: { label: 'Ounces', factor: 0.028349523125 },
      t: { label: 'Metric Tons', factor: 1000 },
    },
  },
  speed: {
    label: 'Speed',
    units: {
      'm/s': { label: 'Meters / second', factor: 1 },
      'km/h': { label: 'Kilometers / hour', factor: 0.2777777778 },
      mph: { label: 'Miles / hour', factor: 0.44704 },
      knot: { label: 'Knots', factor: 0.5144444444 },
    },
  },
  area: {
    label: 'Area',
    units: {
      sqm: { label: 'Square meters', factor: 1 },
      sqft: { label: 'Square feet', factor: 0.09290304 },
      acre: { label: 'Acres', factor: 4046.8564224 },
      hectare: { label: 'Hectares', factor: 10000 },
    },
  },
  volume: {
    label: 'Volume',
    units: {
      l: { label: 'Liters', factor: 1 },
      ml: { label: 'Milliliters', factor: 0.001 },
      gal: { label: 'US Gallons', factor: 3.785411784 },
      qt: { label: 'US Quarts', factor: 0.946352946 },
      cup: { label: 'US Cups', factor: 0.2365882365 },
    },
  },
  time: {
    label: 'Time',
    units: {
      s: { label: 'Seconds', factor: 1 },
      min: { label: 'Minutes', factor: 60 },
      hr: { label: 'Hours', factor: 3600 },
      day: { label: 'Days', factor: 86400 },
      week: { label: 'Weeks', factor: 604800 },
    },
  },
  energy: {
    label: 'Energy',
    units: {
      j: { label: 'Joules', factor: 1 },
      kj: { label: 'Kilojoules', factor: 1000 },
      cal: { label: 'Calories', factor: 4.184 },
      kcal: { label: 'Kilocalories', factor: 4184 },
      wh: { label: 'Watt-hours', factor: 3600 },
    },
  },
  pressure: {
    label: 'Pressure',
    units: {
      pa: { label: 'Pascals', factor: 1 },
      kpa: { label: 'Kilopascals', factor: 1000 },
      bar: { label: 'Bar', factor: 100000 },
      psi: { label: 'PSI', factor: 6894.7572931783 },
    },
  },
  power: {
    label: 'Power',
    units: {
      w: { label: 'Watts', factor: 1 },
      kw: { label: 'Kilowatts', factor: 1000 },
      hp: { label: 'Horsepower', factor: 745.6998715823 },
    },
  },
};

export function convertUnit(categoryKey, value, fromUnit, toUnit) {
  const numeric = safeNumber(value);
  if (numeric === null) return null;

  if (categoryKey === 'temperature') {
    return convertTemperature(numeric, fromUnit, toUnit);
  }

  const category = UNIT_CATEGORIES[categoryKey];
  if (!category) return null;
  const from = category.units[fromUnit];
  const to = category.units[toUnit];
  if (!from || !to) return null;
  return (numeric * from.factor) / to.factor;
}

function convertTemperature(value, fromUnit, toUnit) {
  let celsius = value;
  if (fromUnit === 'f') celsius = ((value - 32) * 5) / 9;
  if (fromUnit === 'k') celsius = value - 273.15;

  if (toUnit === 'c') return celsius;
  if (toUnit === 'f') return (celsius * 9) / 5 + 32;
  if (toUnit === 'k') return celsius + 273.15;
  return null;
}

export const DATA_STORAGE_UNITS = {
  bit: { label: 'bit', bits: 1 },
  byte: { label: 'byte', bits: 8 },
  KB: { label: 'KB', bits: 8 * 1000 },
  KiB: { label: 'KiB', bits: 8 * 1024 },
  MB: { label: 'MB', bits: 8 * 1000 ** 2 },
  MiB: { label: 'MiB', bits: 8 * 1024 ** 2 },
  GB: { label: 'GB', bits: 8 * 1000 ** 3 },
  GiB: { label: 'GiB', bits: 8 * 1024 ** 3 },
  TB: { label: 'TB', bits: 8 * 1000 ** 4 },
  TiB: { label: 'TiB', bits: 8 * 1024 ** 4 },
  PB: { label: 'PB', bits: 8 * 1000 ** 5 },
};

export function getUnitCategoryConfig(categoryKey) {
  if (categoryKey === 'temperature') {
    return {
      label: 'Temperature',
      units: TEMPERATURE_UNITS,
    };
  }

  if (categoryKey === 'data-storage') {
    return {
      label: 'Data Storage',
      units: Object.fromEntries(
        Object.entries(DATA_STORAGE_UNITS).map(([key, value]) => [key, { label: value.label }])
      ),
    };
  }

  return UNIT_CATEGORIES[categoryKey] || null;
}

export function convertStorage(value, fromUnit) {
  const numeric = safeNumber(value);
  if (numeric === null || !DATA_STORAGE_UNITS[fromUnit]) return null;
  const totalBits = numeric * DATA_STORAGE_UNITS[fromUnit].bits;
  return Object.fromEntries(
    Object.entries(DATA_STORAGE_UNITS).map(([key, unit]) => [key, totalBits / unit.bits])
  );
}

const BASE_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function parseBaseInteger(value = '', base) {
  const normalizedBase = Number.parseInt(base, 10);
  if (!Number.isInteger(normalizedBase) || normalizedBase < 2 || normalizedBase > 36) return null;

  const trimmed = value.trim().toUpperCase().replace(/_/g, '');
  if (!trimmed) return null;

  const negative = trimmed.startsWith('-');
  const raw = negative ? trimmed.slice(1) : trimmed;
  if (!raw) return null;

  const validDigits = BASE_DIGITS.slice(0, normalizedBase);
  let result = 0n;

  for (const char of raw) {
    const digit = validDigits.indexOf(char);
    if (digit === -1) return null;
    result = result * BigInt(normalizedBase) + BigInt(digit);
  }

  return negative ? -result : result;
}

export function formatBaseInteger(value, base) {
  const normalizedBase = Number.parseInt(base, 10);
  if (!Number.isInteger(normalizedBase) || normalizedBase < 2 || normalizedBase > 36) return null;
  if (typeof value !== 'bigint') return null;
  if (value === 0n) return '0';

  const negative = value < 0;
  let working = negative ? -value : value;
  let result = '';

  while (working > 0n) {
    const digit = Number(working % BigInt(normalizedBase));
    result = BASE_DIGITS[digit] + result;
    working /= BigInt(normalizedBase);
  }

  return negative ? `-${result}` : result;
}

export function convertBaseNumber(value, fromBase, toBase) {
  const parsed = parseBaseInteger(value, fromBase);
  if (parsed === null) return null;
  return formatBaseInteger(parsed, toBase);
}

const ROMAN_VALUES = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function arabicToRoman(value) {
  let number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number <= 0 || number >= 4000) return null;
  const parts = [];
  let roman = '';

  ROMAN_VALUES.forEach(([arabic, numeral]) => {
    while (number >= arabic) {
      roman += numeral;
      parts.push(numeral);
      number -= arabic;
    }
  });

  return { roman, breakdown: parts.join(' + ') };
}

export function romanToArabic(value = '') {
  const normalized = value.toUpperCase().trim();
  if (!/^[MDCLXVI]+$/.test(normalized)) return null;

  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const current = map[normalized[index]];
    const next = map[normalized[index + 1]] || 0;
    total += current < next ? -current : current;
  }
  return total;
}

export function parseTimestampInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    return numeric > 1e10 ? numeric : numeric * 1000;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatDateInTimeZone(timestampMs, timeZone) {
  const date = new Date(timestampMs);
  return {
    iso: date.toISOString(),
    locale: new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone,
    }).format(date),
    short: new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date),
  };
}

export function getRelativeTime(timestampMs) {
  const diffMs = timestampMs - Date.now();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays > 0) return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
}

export function calculateAge(birthdate, targetDate) {
  if (!birthdate || !targetDate) return null;
  const birth = new Date(`${birthdate}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime()) || target < birth) return null;

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    const previousMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < target) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  const daysUntilNextBirthday = Math.ceil((nextBirthday - target) / 86400000);
  const totalDays = Math.floor((target - birth) / 86400000);

  return {
    years,
    months,
    days,
    totalDays,
    totalHours: totalDays * 24,
    totalMinutes: totalDays * 24 * 60,
    daysUntilNextBirthday,
    birthWeekday: birth.toLocaleDateString(undefined, { weekday: 'long' }),
  };
}

export function addToDate(baseDate, { years = 0, months = 0, days = 0 }) {
  const date = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + years);
  date.setMonth(date.getMonth() + months);
  date.setDate(date.getDate() + days);
  return date;
}

export function diffBetweenDates(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end - start;
  const diffDays = Math.round(diffMs / 86400000);

  return {
    days: diffDays,
    weeks: diffDays / 7,
    months: diffDays / 30.4375,
    years: diffDays / 365.25,
  };
}

export function simplifyAspectRatio(width, height) {
  const w = safeNumber(width);
  const h = safeNumber(height);
  if (!w || !h) return null;
  const gcdValue = gcd(Math.round(w), Math.round(h));
  return {
    ratio: `${Math.round(w / gcdValue)}:${Math.round(h / gcdValue)}`,
    decimal: w / h,
  };
}

export function parseAspectRatio(value = '') {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const width = Number.parseFloat(match[1]);
  const height = Number.parseFloat(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  return { width, height };
}

export function scaleAspectRatio(ratioValue, knownSide, knownValue) {
  const ratio = parseAspectRatio(ratioValue);
  const numericValue = safeNumber(knownValue);
  if (!ratio || numericValue === null || numericValue <= 0) return null;

  if (knownSide === 'width') {
    return {
      width: numericValue,
      height: (numericValue * ratio.height) / ratio.width,
    };
  }

  return {
    width: (numericValue * ratio.width) / ratio.height,
    height: numericValue,
  };
}

export function getSupportedTimeZones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      // Fall through to the curated fallback list below.
    }
  }

  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];
}

function gcd(a, b) {
  let left = Math.abs(a);
  let right = Math.abs(b);
  while (right) {
    [left, right] = [right, left % right];
  }
  return left || 1;
}
