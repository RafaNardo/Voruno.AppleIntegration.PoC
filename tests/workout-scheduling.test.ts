import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkoutScheduling } from '../src/features/workout-scheduling/adapter';
import type { WorkoutSchedulingNative } from '../src/features/workout-scheduling/port';

// Test-only bridge doubles. None are shipped as native/device evidence.
function bridge(payload: unknown, overrides: Partial<WorkoutSchedulingNative> = {}): WorkoutSchedulingNative {
  return {
    getState: async () => payload,
    requestAuthorization: async () => payload,
    scheduleTestWorkout: async () => payload,
    removeTestWorkout: async () => payload,
    ...overrides,
  };
}

test('old binary keeps capability unknown and requires a rebuild for every action', async () => {
  const adapter = createWorkoutScheduling(null);
  const capability = await adapter.getCapability();
  assert.equal(capability.capability, 'unknown');
  assert.equal(capability.implementation, 'not-implemented');
  for (const result of await Promise.all([adapter.presentTestWorkout(), adapter.requestAuthorization(), adapter.scheduleTestWorkout(), adapter.removeTestWorkout()])) {
    assert.equal(result.status, 'unavailable');
    assert.equal(result.code, 'native-module-missing');
  }
});

test('unscheduled preview does not request scheduler authorization or submit a schedule', async () => {
  let unrelatedCalls = 0;
  const adapter = createWorkoutScheduling(bridge(null, {
    presentTestWorkout: async () => ({ code: 'preview-closed', verification: 'scheduler-match', saved: true }),
    requestAuthorization: async () => { unrelatedCalls++; return {}; },
    scheduleTestWorkout: async () => { unrelatedCalls++; return {}; },
    getState: async () => { unrelatedCalls++; return {}; },
  }));
  const result = await adapter.presentTestWorkout();
  assert.equal(result.status, 'preview-closed');
  assert.equal(result.verification, 'not-observable');
  assert.equal('saved' in result, false);
  assert.equal(unrelatedCalls, 0);
});

test('old M1 binary asks for rebuild and preview failures cannot become confirmed delivery', async () => {
  assert.equal((await createWorkoutScheduling(bridge(null)).presentTestWorkout()).code, 'native-module-outdated');
  for (const payload of [{ code: 'submitted' }, { code: 'saved' }, { code: 'observed-on-watch' }]) {
    const result = await createWorkoutScheduling(bridge(null, { presentTestWorkout: async () => payload })).presentTestWorkout();
    assert.equal(result.status, 'unknown');
  }
  const error = await createWorkoutScheduling(bridge(null, { presentTestWorkout: async () => { throw new Error('PRIVATE_TEST_SENTINEL'); } })).presentTestWorkout();
  assert.equal(error.status, 'unknown');
  assert.equal(JSON.stringify(error).includes('PRIVATE_TEST_SENTINEL'), false);
});

test('scheduled read-back exposes only bounded evidence, never Watch receipt', async () => {
  for (const verification of ['scheduler-match', 'not-listed', 'scheduler-mismatch', 'watch-integrated', undefined]) {
    const result = await createWorkoutScheduling(bridge({ code: 'submitted', verification })).scheduleTestWorkout();
    assert.equal(result.status, 'submitted');
    assert.equal(result.verification, verification === 'watch-integrated' || verification === undefined ? 'unknown' : verification);
  }
});

test('capability query never requests permission or schedules; unauthorized counts are withheld', async () => {
  for (const authorization of ['denied', 'restricted', 'not-determined', 'future-unknown-value']) {
    let calls = 0;
    const adapter = createWorkoutScheduling(bridge({ capability: 'supported', code: 'ready', authorization, fixtureCount: 0 }, {
      requestAuthorization: async () => { calls++; return {}; },
      scheduleTestWorkout: async () => { calls++; return {}; },
    }));
    const state = await adapter.getCapability();
    assert.equal(state.capability, 'supported');
    assert.equal(state.authorization, authorization === 'future-unknown-value' ? 'unknown' : authorization);
    assert.equal(state.fixtureCount, undefined);
    assert.equal(calls, 0);
  }
});

test('OS authorization is preserved without claiming HealthKit permission', async () => {
  for (const authorization of ['authorized', 'denied', 'restricted', 'not-determined', 'unknown'] as const) {
    const result = await createWorkoutScheduling(bridge({ code: 'authorization-returned', authorization })).requestAuthorization();
    assert.equal(result.authorization, authorization);
    assert.equal(result.status, 'authorization-returned');
    assert.equal('readStatus' in result, false);
  }
});

test('submission with no list entry stays submitted and never becomes Watch delivery', async () => {
  const result = await createWorkoutScheduling(bridge({ code: 'submitted', fixtureCount: 0, scheduledFor: '2030-01-01T12:05:00Z', watchDelivered: true })).scheduleTestWorkout();
  assert.equal(result.status, 'submitted');
  assert.equal(result.fixtureCount, 0);
  assert.equal(result.scheduledFor, '2030-01-01T12:05:00Z');
  assert.equal('watchDelivered' in result, false);
});

test('duplicate and removal results remain separate from a new submission', async () => {
  const duplicate = await createWorkoutScheduling(bridge({ code: 'already-scheduled', fixtureCount: 1 })).scheduleTestWorkout();
  assert.equal(duplicate.status, 'already-scheduled');
  const removal = await createWorkoutScheduling(bridge({ code: 'removal-requested', fixtureCount: 1 })).removeTestWorkout();
  assert.equal(removal.status, 'removal-requested');
  assert.equal(removal.fixtureCount, 1); // Native list has not converged; do not invent removal success.
});

test('preflight failures cannot become submitted', async () => {
  for (const code of ['not-authorized', 'capacity-reached', 'invalid-fixture', 'invalid-date', 'busy', 'unsupported']) {
    const result = await createWorkoutScheduling(bridge({ code })).scheduleTestWorkout();
    assert.equal(result.code, code);
    assert.ok(result.status === 'blocked' || result.status === 'unavailable');
  }
});

test('wrong operation codes, malformed payloads and exceptions do not leak details or claim success', async () => {
  for (const payload of [null, [], 'PRIVATE_TEST_SENTINEL', { code: 'observed-on-watch' }, { code: 'authorization-returned' }]) {
    const adapter = createWorkoutScheduling(bridge(payload));
    assert.equal((await adapter.scheduleTestWorkout()).status, 'unknown');
    assert.equal((await adapter.getCapability()).capability, 'unknown');
  }
  const failing = createWorkoutScheduling(bridge(null, { scheduleTestWorkout: async () => { throw new Error('PRIVATE_TEST_SENTINEL'); } }));
  const result = await failing.scheduleTestWorkout();
  assert.equal(result.status, 'unknown');
  assert.equal(JSON.stringify(result).includes('PRIVATE_TEST_SENTINEL'), false);
  const malformed = await createWorkoutScheduling(bridge({ capability: 'supported', code: 'ready', authorization: 'authorized', fixtureCount: -1, scheduledFor: 'PRIVATE_TEST_SENTINEL', healthRecords: ['PRIVATE_TEST_SENTINEL'] })).getCapability();
  assert.equal(malformed.fixtureCount, undefined);
  assert.equal(malformed.scheduledFor, undefined);
  assert.equal(JSON.stringify(malformed).includes('PRIVATE_TEST_SENTINEL'), false);
});
