function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function rotateLeft(value, shift) {
  return (value << shift) | (value >>> (32 - shift));
}

function addUnsigned(left, right) {
  return (((left >>> 0) + (right >>> 0)) & 0xffffffff) >>> 0;
}

function bytesToWords(bytes) {
  const words = [];

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] = words[index >> 2] || 0;
    words[index >> 2] |= bytes[index] << ((index % 4) * 8);
  }

  return words;
}

export function md5FromBytes(bytesLike) {
  const bytes = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike);
  const words = bytesToWords(bytes);
  const bitLength = bytes.length * 8;

  words[bitLength >> 5] |= 0x80 << (bitLength % 32);
  words[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const roundFunctions = [
    (x, y, z) => (x & y) | (~x & z),
    (x, y, z) => (x & z) | (y & ~z),
    (x, y, z) => x ^ y ^ z,
    (x, y, z) => y ^ (x | ~z),
  ];

  const indexFunctions = [
    (step) => step,
    (step) => (5 * step + 1) % 16,
    (step) => (3 * step + 5) % 16,
    (step) => (7 * step) % 16,
  ];

  const shiftSets = [
    [7, 12, 17, 22],
    [5, 9, 14, 20],
    [4, 11, 16, 23],
    [6, 10, 15, 21],
  ];

  const table = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
  );

  for (let offset = 0; offset < words.length; offset += 16) {
    let aa = a;
    let bb = b;
    let cc = c;
    let dd = d;

    for (let step = 0; step < 64; step += 1) {
      const round = Math.floor(step / 16);
      const fn = roundFunctions[round];
      const wordIndex = indexFunctions[round](step % 16);
      const shift = shiftSets[round][step % 4];
      const mix = addUnsigned(
        addUnsigned(aa, fn(bb, cc, dd)),
        addUnsigned(words[offset + wordIndex] || 0, table[step])
      );

      aa = dd;
      dd = cc;
      cc = bb;
      bb = addUnsigned(bb, rotateLeft(mix, shift));
    }

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  const digestWords = [a, b, c, d];
  return digestWords
    .map((word) =>
      [word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    )
    .join('');
}

async function subtleDigest(algorithm, bytes) {
  const buffer = await crypto.subtle.digest(algorithm, bytes);
  return bufferToHex(buffer);
}

export async function generateHashes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  return {
    md5: md5FromBytes(bytes),
    sha1: await subtleDigest('SHA-1', bytes),
    sha256: await subtleDigest('SHA-256', bytes),
    sha512: await subtleDigest('SHA-512', bytes),
  };
}
