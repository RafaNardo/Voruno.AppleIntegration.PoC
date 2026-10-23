import { Platform } from 'react-native';
import { createHealthActivityReading, type HealthClient } from './adapter';

let client: HealthClient | undefined;
export const healthActivityReading = createHealthActivityReading(() => {
  if (Platform.OS !== 'ios') return undefined;
  if (!client) {
    // Load inside the adapter's error boundary: older builds lack Nitro/HealthKit.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const health = require('@kingstinct/react-native-healthkit') as typeof import('@kingstinct/react-native-healthkit');
    client = {
      isHealthDataAvailable: health.isHealthDataAvailable,
      requestAuthorization: health.requestAuthorization,
      queryWorkoutSamples: health.queryWorkoutSamples,
      queryQuantitySamples: health.queryQuantitySamples,
      runningActivityType: health.WorkoutActivityType.running,
    };
  }
  return client;
});
