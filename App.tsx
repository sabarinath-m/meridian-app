/**
 * Meridian — offline-first field inspection app.
 * @format
 */

import React, {useEffect} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import {configureBackgroundSync} from './src/sync/backgroundSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: 3, networkMode: 'offlineFirst'},
    mutations: {networkMode: 'offlineFirst'},
  },
});

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    configureBackgroundSync().catch(error => {
      console.error('[Meridian] Failed to configure background sync', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
