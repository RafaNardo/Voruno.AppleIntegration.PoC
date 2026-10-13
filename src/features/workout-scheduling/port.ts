import type { CapabilityResult } from '../../shared/types/integration';

export type SchedulingAuthorization = 'authorized' | 'denied' | 'restricted' | 'not-determined' | 'unknown';
export type ScheduleSnapshot = CapabilityResult & {
  authorization: SchedulingAuthorization;
  fixtureCount?: number;
  scheduledFor?: string;
};

export type ScheduleAction = {
  status: 'submitted' | 'already-scheduled' | 'authorization-returned' | 'removal-requested' |
    'not-found' | 'unavailable' | 'blocked' | 'unknown';
  code: string;
  message: string;
  authorization?: SchedulingAuthorization;
  fixtureCount?: number;
  scheduledFor?: string;
};

export interface WorkoutScheduling {
  getCapability(): Promise<ScheduleSnapshot>;
  requestAuthorization(): Promise<ScheduleAction>;
  scheduleTestWorkout(): Promise<ScheduleAction>;
  removeTestWorkout(): Promise<ScheduleAction>;
}

// Treat native payloads as untrusted until validated. Never expose raw native errors.
export interface WorkoutSchedulingNative {
  getState(): Promise<unknown>;
  requestAuthorization(): Promise<unknown>;
  scheduleTestWorkout(): Promise<unknown>;
  removeTestWorkout(): Promise<unknown>;
}
