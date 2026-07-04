module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    // See src/polyfills/webcryptoShim.js and metro.config.js — same
    // redirect, mirrored here so `yjs` resolves under Jest too.
    '^isomorphic-webcrypto/src/react-native$':
      '<rootDir>/src/polyfills/webcryptoShim.js',
  },
  // The RN preset's default only transforms react-native itself; several
  // navigation/UI deps ship untranspiled ESM and need transforming too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-async-storage)/)',
  ],
};
