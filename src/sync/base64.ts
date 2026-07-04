/* eslint-disable no-bitwise, no-div-regex */
// Dependency-free base64 <-> Uint8Array conversion.
//
// We deliberately avoid Node's `Buffer` here: it isn't available in the
// Hermes runtime on-device without a polyfill, and we want this file to
// behave identically under Jest (Node) and on a real phone. Bitwise ops
// are the point of the algorithm, not a style slip — disabled above
// rather than scattered as line-level suppressions.

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);

    result += CHARS[(triple >> 18) & 0x3f];
    result += CHARS[(triple >> 12) & 0x3f];
    result += b1 === undefined ? '=' : CHARS[(triple >> 6) & 0x3f];
    result += b2 === undefined ? '=' : CHARS[triple & 0x3f];
  }
  return result;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];

  let buffer = 0;
  let bitsCollected = 0;

  for (const char of clean) {
    const value = CHARS.indexOf(char);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}
