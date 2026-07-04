import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@meridian/device_id';

// A one-function RFC4122 v4 generator instead of pulling in the `uuid`
// package: recent `uuid` majors ship ESM-only and drag in Jest/Metro
// transform-config whack-a-mole (same class of problem as the yjs/lib0
// webcrypto shim above) for something `global.crypto.getRandomValues`
// already gives us everything needed for.
function uuidv4(): string {
  const bytes = new Uint8Array(16);
  // The RN TypeScript config doesn't include DOM lib types, so `crypto` on
  // globalThis has no ambient declaration here even though it's present at
  // runtime (via react-native-get-random-values on-device, natively in
  // Node under Jest — see index.js and webcryptoShim.js).
  (globalThis as any).crypto.getRandomValues(bytes);
  /* eslint-disable no-bitwise */
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  /* eslint-enable no-bitwise */
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

let cached: string | null = null;

/**
 * A stable per-install identifier. Distinguishing "device A" from
 * "device B" is what makes the two-offline-clients scenario in the spec
 * real rather than simulated — without it, the same physical device
 * restarting the app would look like a brand-new actor to the sync engine.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) {
    return cached;
  }
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const id = uuidv4();
  await AsyncStorage.setItem(STORAGE_KEY, id);
  cached = id;
  return id;
}
