/**
 * @format
 */

// Must be the first import: polyfills global.crypto.getRandomValues, which
// yjs (via lib0's random-ID generation) needs on-device. See
// src/polyfills/webcryptoShim.js for the full explanation.
import 'react-native-get-random-values';
// react-navigation's native-stack requires this to be imported early.
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
