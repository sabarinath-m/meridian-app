// Yjs (via lib0) resolves its "react-native" package export to
// `isomorphic-webcrypto`, a largely unmaintained polyfill that drags in a
// full Expo-compat dependency tree (@unimodules/core, expo-random,
// msrcrypto, asmcrypto.js) just to get one function.
//
// lib0/random.cjs only ever calls `webcrypto.getRandomValues` (see
// node_modules/lib0/dist/random.cjs) — it never touches `subtle`. Random
// client-ID generation doesn't need to be cryptographically secure (Yjs's
// own docs note this), so a well-seeded PRNG polyfill is entirely
// sufficient here. `react-native-get-random-values` already polyfills
// `global.crypto.getRandomValues` on-device (see index.js), so this shim
// just forwards to it instead of shipping the heavier alternative.
//
// Wired in via the Jest `moduleNameMapper` (jest.config.js) and the Metro
// resolver alias (metro.config.js) — both redirect the literal module id
// `isomorphic-webcrypto/src/react-native` to this file.
//
// This intentionally does NOT `require('react-native-get-random-values')`
// itself: that package's raw source trips over Node's CommonJS `module`
// wrapper when executed unbundled (as Jest does), because it declares its
// own top-level `let module`. It works fine on-device because Metro
// transforms it through Babel first. So instead: on-device, index.js
// imports 'react-native-get-random-values' once at startup, which
// polyfills `global.crypto.getRandomValues` before this file ever runs;
// under Jest/Node, `global.crypto.getRandomValues` already exists natively
// (Node 19+). Either way, by the time this shim is reached, it's present.
// lib0 has two entry points that both import this same module id — a CJS
// one (dist/webcrypto.react-native.cjs) that expects a `.default` shaped
// like isomorphic-webcrypto's real export, and an ESM one
// (webcrypto.react-native.js) that does `import webcrypto from '...'`.
// Matching isomorphic-webcrypto's actual shape (a single default object
// with ensureSecure/getRandomValues/subtle) satisfies both call sites.
const shim = {
  ensureSecure: () => {},
  getRandomValues: arr => global.crypto.getRandomValues(arr),
  subtle: undefined,
};

module.exports = shim;
module.exports.default = shim;
