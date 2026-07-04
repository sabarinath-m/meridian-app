const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

/**
 * yjs pulls in `isomorphic-webcrypto/src/react-native` via lib0's package
 * "react-native" export condition. That package is unmaintained and drags
 * in an Expo-compat dependency tree for one function we don't need — see
 * src/polyfills/webcryptoShim.js for the full explanation and the
 * lightweight replacement.
 */
const webcryptoShimPath = path.resolve(__dirname, 'src/polyfills/webcryptoShim.js');

const config = {
  resolver: {
    // extraNodeModules alone didn't intercept this on-device (confirmed by
    // an actual simulator run throwing "Unable to resolve module
    // isomorphic-webcrypto/src/react-native") — resolveRequest is the
    // reliable way to force a specific bare specifier to a local file
    // regardless of what's actually in node_modules.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'isomorphic-webcrypto/src/react-native') {
        return {type: 'sourceFile', filePath: webcryptoShimPath};
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
