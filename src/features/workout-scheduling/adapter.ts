import type { ScheduleAction, ScheduleSnapshot, SchedulingAuthorization, WorkoutScheduling, WorkoutSchedulingNative } from './port';

const explanations = {
  'native-module-missing': 'Install a new M1 EAS development build. The WorkoutKit module is absent from this binary.',
  unsupported: 'WorkoutScheduler reports unsupported, or this is a simulator. Use a physical iPhone with a paired supported Watch.',
  'invalid-fixture': 'The OS does not support this running activity or one of its time goals.',
  ready: 'WorkoutScheduler supports this fixture. This does not establish Watch connectivity or delivery.',
  'not-authorized': 'Scheduling is not authorized. Request WorkoutKit authorization or review iPhone settings.',
  'authorization-returned': 'The OS authorization request returned. This is WorkoutKit authorization, not HealthKit read permission.',
  submitted: 'The schedule call returned. Inspect the scheduler list and the Watch separately; delivery is not confirmed.',
  'already-scheduled': 'This test fixture is already listed. No duplicate call was made. Remove it explicitly before scheduling again.',
  'capacity-reached': 'The scheduler limit is reached. No call was made; manage existing plans before retrying.',
  'invalid-date': 'A valid future date could not be constructed. No call was made.',
  busy: 'Another native operation is still running. Wait before retrying.',
  'removal-requested': 'Removal calls returned for this fixture only. Refresh the list; Watch removal is not confirmed.',
  'not-found': 'The scheduler did not list this fixture. No removal was requested.',
  'native-response-invalid': 'The native response was not recognized. Outcome is unknown; refresh before retrying.',
  'native-call-failed': 'The native call failed. Outcome is unknown; refresh before retrying. Raw details are withheld.',
} as const;

type Code = keyof typeof explanations;
function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function authorization(value: unknown): SchedulingAuthorization {
  return value === 'authorized' || value === 'denied' || value === 'restricted' || value === 'not-determined' ? value : 'unknown';
}
function details(value: Record<string, unknown>) {
  const result: { fixtureCount?: number; scheduledFor?: string } = {};
  if (typeof value.fixtureCount === 'number' && Number.isSafeInteger(value.fixtureCount) && value.fixtureCount >= 0) result.fixtureCount = value.fixtureCount;
  if (typeof value.scheduledFor === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value.scheduledFor) && Number.isFinite(Date.parse(value.scheduledFor))) result.scheduledFor = value.scheduledFor;
  return result;
}
function action(code: Code, payload: Record<string, unknown> = {}): ScheduleAction {
  let status: ScheduleAction['status'] = 'blocked';
  if (code === 'submitted' || code === 'already-scheduled' || code === 'authorization-returned' || code === 'removal-requested' || code === 'not-found') status = code;
  if (code === 'unsupported' || code === 'native-module-missing') status = 'unavailable';
  if (code === 'native-call-failed' || code === 'native-response-invalid') status = 'unknown';
  return { status, code, message: explanations[code], ...details(payload), ...(code === 'authorization-returned' ? { authorization: authorization(payload.authorization) } : {}) };
}

export function createWorkoutScheduling(native: WorkoutSchedulingNative | null): WorkoutScheduling {
  async function invoke(method: 'requestAuthorization' | 'scheduleTestWorkout' | 'removeTestWorkout'): Promise<ScheduleAction> {
    if (!native) return action('native-module-missing');
    try {
      const payload = record(await native[method]());
      const allowed: Record<typeof method, readonly string[]> = {
        requestAuthorization: ['authorization-returned', 'unsupported', 'busy'],
        scheduleTestWorkout: ['submitted', 'already-scheduled', 'unsupported', 'busy', 'not-authorized', 'invalid-fixture', 'capacity-reached', 'invalid-date'],
        removeTestWorkout: ['removal-requested', 'not-found', 'unsupported', 'busy', 'not-authorized'],
      };
      if (typeof payload.code !== 'string' || !allowed[method].includes(payload.code)) return action('native-response-invalid');
      return action(payload.code as Code, payload);
    } catch {
      return action('native-call-failed');
    }
  }
  return {
    async getCapability(): Promise<ScheduleSnapshot> {
      const unknown = (code: Code): ScheduleSnapshot => ({ capability: 'unknown', implementation: native ? 'implemented' : 'not-implemented', authorization: 'unknown', reason: explanations[code] });
      if (!native) return unknown('native-module-missing');
      try {
        const payload = record(await native.getState());
        if (!((payload.capability === 'supported' && payload.code === 'ready') ||
          (payload.capability === 'unsupported' && (payload.code === 'unsupported' || payload.code === 'invalid-fixture')))) return unknown('native-response-invalid');
        const permission = authorization(payload.authorization);
        return {
          capability: payload.capability, implementation: 'implemented', authorization: permission,
          reason: explanations[payload.code as Code],
          ...(permission === 'authorized' ? details(payload) : {}),
        };
      } catch { return unknown('native-call-failed'); }
    },
    requestAuthorization: () => invoke('requestAuthorization'),
    scheduleTestWorkout: () => invoke('scheduleTestWorkout'),
    removeTestWorkout: () => invoke('removeTestWorkout'),
  };
}
