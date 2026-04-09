function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function formatUuidFromBytes(bytes) {
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function generateUuidV4() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatUuidFromBytes(bytes);
}

export function generateUuidV1() {
  const bytes = randomBytes(16);
  const timestamp = (BigInt(Date.now()) + 12219292800000n) * 10000n + BigInt(bytes[0]);

  const timeLow = Number(timestamp & 0xffffffffn).toString(16).padStart(8, '0');
  const timeMid = Number((timestamp >> 32n) & 0xffffn).toString(16).padStart(4, '0');
  const timeHi = Number((timestamp >> 48n) & 0x0fffn).toString(16).padStart(3, '0');

  const clockSeq = ((bytes[1] << 8) | bytes[2]) & 0x3fff;
  const clockSeqHi = ((clockSeq >> 8) | 0x80).toString(16).padStart(2, '0');
  const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, '0');
  const node = bytesToHex(bytes.slice(10, 16)).padStart(12, '0');

  return `${timeLow}-${timeMid}-1${timeHi}-${clockSeqHi}${clockSeqLow}-${node}`;
}

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeBase32(value, length) {
  let output = '';
  let current = BigInt(value);

  for (let index = 0; index < length; index += 1) {
    output = ULID_ALPHABET[Number(current % 32n)] + output;
    current /= 32n;
  }

  return output;
}

export function generateUlid() {
  const timePart = encodeBase32(Date.now(), 10);
  const randomPart = Array.from(randomBytes(16), (byte) => ULID_ALPHABET[byte % 32]).join('').slice(0, 16);
  return `${timePart}${randomPart}`;
}

const NANOID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateNanoId(length = 21) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => NANOID_ALPHABET[byte % NANOID_ALPHABET.length]).join('');
}

export function formatGeneratedId(value, { uppercase = false, hyphens = true } = {}) {
  let nextValue = value;

  if (!hyphens) {
    nextValue = nextValue.replace(/-/g, '');
  }

  if (uppercase) {
    nextValue = nextValue.toUpperCase();
  }

  return nextValue;
}

export function generateIdentifier(format) {
  if (format === 'uuid-v1') return generateUuidV1();
  if (format === 'ulid') return generateUlid();
  if (format === 'nanoid') return generateNanoId();
  return generateUuidV4();
}
