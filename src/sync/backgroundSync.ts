import BackgroundFetch from 'react-native-background-fetch';
import {database} from '../db';
import {getDeviceId} from './deviceId';
import {syncAllPendingInspections} from './syncEngine';

/**
 * Wires the sync engine to native background execution (WorkManager on
 * Android, BGTaskScheduler on iOS via react-native-background-fetch), so
 * pending inspections sync even when the app isn't in the foreground.
 * Call once from App.tsx on startup.
 */
export async function configureBackgroundSync(): Promise<void> {
  await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minutes — the OS-enforced floor on both platforms
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async taskId => {
      try {
        const deviceId = await getDeviceId();
        await syncAllPendingInspections(database, deviceId);
      } catch (error) {
        console.error('[Meridian] background sync failed', error);
      } finally {
        BackgroundFetch.finish(taskId);
      }
    },
    error => {
      console.error('[Meridian] BackgroundFetch failed to configure', error);
    },
  );
}

/** Foreground "Sync now" action — same engine, just triggered on demand. */
export async function triggerManualSync(): Promise<void> {
  const deviceId = await getDeviceId();
  await syncAllPendingInspections(database, deviceId);
}
