import type { CapabilityResult } from '../../shared/types/integration';

export type RunningWorkout = Readonly<{
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceMeters?: number;
  averageHeartRateBpm?: number;
  source: { name: string; bundleIdentifier: string };
  planLink?: { status: 'available'; id: string; running: boolean } | { status: 'absent' | 'failed' };
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
  getRunningWorkoutDetails(id: string): Promise<HealthDetails>;
}

export type DistanceInterval = Readonly<{
  startSeconds: number;
  endSeconds: number;
  distanceMeters?: number;
  coverage: number;
  quality: 'sample-sum' | 'estimated' | 'missing' | 'overlap';
  paceSecondsPerKm?: number;
  speedSampleCount?: number;
  cadenceStepsPerMinute?: number;
  cadenceEstimated?: boolean;
}>;
export type RecordedEvent = Readonly<{
  kind: 'pause' | 'resume' | 'lap' | 'marker' | 'motionPaused' | 'motionResumed' | 'segment' | 'pauseOrResumeRequest' | 'unknown';
  startSeconds: number;
  endSeconds: number;
  distance?: DistanceInterval;
}>;
export type HealthDetails = HealthFailure | Readonly<{
  status: 'queried';
  workoutId: string;
  minutes: readonly DistanceInterval[];
  events: readonly RecordedEvent[];
  distanceStatus: 'queried' | 'failed';
  samplesTruncated: boolean;
  eventsTruncated: boolean;
  invalidSamples: boolean;
  speedStatus: 'queried' | 'failed' | 'incomplete';
  cadenceStatus: 'queried' | 'failed' | 'incomplete';
}>;
