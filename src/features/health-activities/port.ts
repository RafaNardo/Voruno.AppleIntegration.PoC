import type { CapabilityResult, NotImplemented } from '../../shared/types/integration';

export type RunningWorkout = Readonly<{
  sourceId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceMeters?: number;
  heartRateSummary?: { averageBpm?: number };
  dataProvenance?: string;
}>;

export interface HealthActivityReading {
  getCapability(): Promise<CapabilityResult>;
  requestPermission(): Promise<NotImplemented | {
    status: 'requested' | 'unavailable';
    readStatus: 'unknown' | 'unavailable';
  }>;
  listRecentRunningWorkouts(): Promise<NotImplemented | {
    status: 'queried';
    workouts: readonly RunningWorkout[];
  }>;
}

export const healthActivityReading: HealthActivityReading = {
  async getCapability() {
    return {
      capability: 'unknown',
      implementation: 'not-implemented',
      reason: 'HealthKit adapter is deferred to M2. Read permission is unknown.',
    };
  },
  async requestPermission() {
    return { status: 'not-implemented', message: 'HealthKit permissions are not implemented. No permission was requested.' };
  },
  async listRecentRunningWorkouts() {
    return { status: 'not-implemented', message: 'HealthKit reading is not implemented. No query was performed.' };
  },
};
