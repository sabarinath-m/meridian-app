/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// WatermelonDB's SQLiteAdapter talks to JSI bindings that only exist on a
// real device/simulator — under Jest there's no native runtime to bind to.
// This smoke test isn't the place to exercise persistence (the merge test
// suite covers the sync/CRDT logic directly); it just needs the app tree
// to mount without crashing, so the database is swapped for an inert fake
// that always reports an empty, unchanging collection.
jest.mock('../src/db', () => {
  const observable = {
    subscribe: (callback: (value: unknown) => void) => {
      callback([]);
      return {unsubscribe: () => {}};
    },
  };
  const fakeCollection = {
    query: () => ({observe: () => observable, fetch: async () => []}),
    findAndObserve: () => ({
      subscribe: (callback: (value: unknown) => void) => {
        callback(null);
        return {unsubscribe: () => {}};
      },
    }),
    create: async () => ({id: 'fake-id'}),
  };
  return {
    database: {
      get: () => fakeCollection,
      write: async (fn: () => Promise<void>) => fn(),
    },
  };
});

jest.mock('react-native-background-fetch', () => ({
  configure: jest.fn(() => Promise.resolve()),
  finish: jest.fn(),
  NETWORK_TYPE_ANY: 0,
}));

// Same story as react-native-background-fetch: this wraps a native module
// that isn't linked into the Jest runtime (there's no real device here).
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({assets: []})),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
