import type { CapabilityResult } from '../../shared/types/integration';

export type RunningWorkout = Readonly<{
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceMeters?: number;
  averageHeartRateBpm?: number;
  source: { name: string; bundleIdentifier: string };
}>;

export type HealthFailure = Readonly<{
  status: 'unavailable' | 'failed' | 'request-required' | 'busy';
  code: string;
  message: string;
}>;

export type HealthPermission = HealthFailure | Readonly<{
  status: 'requested';
  requestCompleted: true;
  readStatus: 'unknown';
  message: string;
}>;

export type HealthQuery = HealthFailure | Readonly<{
  status: 'queried';
  readStatus: 'unknown';
  workouts: readonly RunningWorkout[];
  from: string;
  to: string;
  limit: number;
  metricsIncomplete: boolean;
}>;

export interface HealthActivityReading {
  getCapability(): Promise<CapabilityResult>;
  requestPermission(includeHeartRate: boolean): Promise<HealthPermission>;
  listRecentRunningWorkouts(): Promise<HealthQuery>;
}
