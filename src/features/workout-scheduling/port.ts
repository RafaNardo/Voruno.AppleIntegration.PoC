import type { CapabilityResult, NotImplemented } from '../../shared/types/integration';

// Application contract, not a claim about a native SDK signature or Watch receipt.
export interface WorkoutScheduling {
  getCapability(): Promise<CapabilityResult>;
  scheduleTestWorkout(): Promise<NotImplemented | {
    status: 'submitted' | 'failed' | 'unknown';
    message: string;
  }>;
}

export const workoutScheduling: WorkoutScheduling = {
  async getCapability() {
    return {
      capability: 'unknown',
      implementation: 'not-implemented',
      reason: 'WorkoutKit adapter is deferred to M1. Device support has not been checked.',
    };
  },
  async scheduleTestWorkout() {
    return { status: 'not-implemented', message: 'M1 is gated on the physical iPhone development build. No workout was submitted.' };
  },
};
