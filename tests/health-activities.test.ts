import assert from 'node:assert/strict';
import test from 'node:test';
import { createHealthActivityReading, type HealthClient } from '../src/features/health-activities/adapter';

// Entirely synthetic records. Never paste device health records into these fixtures.
type Sample = Awaited<ReturnType<HealthClient['queryWorkoutSamples']>>[number];
const running = 37 as HealthClient['runningActivityType'];
const now = () => new Date('2030-01-20T12:00:00Z');
function sample(overrides: Partial<Sample> = {}): Sample {
  return {
    uuid: 'synthetic-run-1', workoutActivityType: running,
    startDate: new Date('2030-01-19T10:00:00Z'), endDate: new Date('2030-01-19T10:10:00Z'),
    duration: { quantity: 540, unit: 's' },
    sourceRevision: { source: { name: 'Synthetic source', bundleIdentifier: 'test.synthetic' }, operatingSystemVersion: 'test' },
    metadata: { privateSentinel: 'PRIVATE_SYNTHETIC' },
    device: { localIdentifier: 'PRIVATE_SYNTHETIC' },
    async getStatistic() { return undefined; },
    toJSON() { throw new Error('Do not serialize proxies'); },
    ...overrides,
  } as Sample;
}
function client(overrides: Partial<HealthClient> = {}): HealthClient {
  return { isHealthDataAvailable: () => true, requestAuthorization: async () => true,
    queryWorkoutSamples: async () => [], runningActivityType: running, ...overrides };
}

test('missing native binary, unavailable device and pre-request query are distinct and contain no workouts', async () => {
  const missing = createHealthActivityReading(() => { throw new Error('PRIVATE_SYNTHETIC'); });
  assert.equal((await missing.getCapability()).capability, 'unknown');
  assert.equal((await missing.requestPermission(false)).status, 'unavailable');
  const unavailable = createHealthActivityReading(() => client({ isHealthDataAvailable: () => false }));
  assert.equal((await unavailable.getCapability()).capability, 'unsupported');
  assert.equal((await unavailable.requestPermission(false)).status, 'unavailable');
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => { throw new Error('must not query'); } }));
  const beforeRequest = await port.listRecentRunningWorkouts();
  assert.equal(beforeRequest.status, 'request-required');
  assert.equal('workouts' in beforeRequest, false);
});

test('permission requests only read types, HR is opt-in, completion never establishes read access', async () => {
  const requests: Parameters<HealthClient['requestAuthorization']>[0][] = [];
  const port = createHealthActivityReading(() => client({ requestAuthorization: async (options) => { requests.push(options); return true; } }));
  await port.getCapability();
  assert.equal(requests.length, 0);
  const permission = await port.requestPermission(false);
  assert.equal(permission.status, 'requested');
  if (permission.status === 'requested') assert.equal(permission.readStatus, 'unknown');
  assert.deepEqual(requests[0], { toShare: [], toRead: ['HKWorkoutTypeIdentifier', 'HKQuantityTypeIdentifierDistanceWalkingRunning'] });
  await port.requestPermission(true);
  assert.deepEqual(requests[1]?.toRead, [...requests[0]!.toRead!, 'HKQuantityTypeIdentifierHeartRate']);
  assert.deepEqual(requests[1]?.toShare, []);
});

test('empty queries stay queried with unknown permission; filter is bounded running only', async () => {
  let options: Parameters<HealthClient['queryWorkoutSamples']>[0] | undefined;
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async (value) => { options = value; return []; } }), now);
  await port.requestPermission(false);
  const result = await port.listRecentRunningWorkouts();
  assert.equal(result.status, 'queried');
  if (result.status !== 'queried') return;
  assert.deepEqual(result.workouts, []);
  assert.equal(result.readStatus, 'unknown');
  assert.deepEqual(options, { limit: 20, ascending: false, filter: { workoutActivityType: running, date: {
    startDate: new Date('2030-01-06T12:00:00Z'), endDate: now(), strictStartDate: true, strictEndDate: true,
  } } });
});

test('mapping retains recorded duration, units and provenance but strips device and metadata; deduplicates reads', async () => {
  const metricCalls: string[] = [];
  const run = sample({ getStatistic: async (type, unit) => {
    metricCalls.push(`${type}:${unit}`);
    return type === 'HKQuantityTypeIdentifierHeartRate'
      ? { sources: [], averageQuantity: { quantity: 140, unit: 'count/min' } }
      : { sources: [], sumQuantity: { quantity: 1500, unit: 'm' } };
  } });
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => [run, run] }), now);
  await port.requestPermission(true);
  const result = await port.listRecentRunningWorkouts();
  assert.equal(result.status, 'queried');
  if (result.status !== 'queried') return;
  assert.equal(result.workouts.length, 1);
  assert.deepEqual(result.workouts[0], {
    id: 'synthetic-run-1', startedAt: '2030-01-19T10:00:00.000Z', endedAt: '2030-01-19T10:10:00.000Z',
    durationSeconds: 540, distanceMeters: 1500, averageHeartRateBpm: 140,
    source: { name: 'Synthetic source', bundleIdentifier: 'test.synthetic' },
  });
  assert.equal(JSON.stringify(result).includes('PRIVATE_SYNTHETIC'), false);
  assert.equal(metricCalls.length, 2);
  assert.deepEqual(await port.listRecentRunningWorkouts(), result);
});

test('missing/invalid optional quantities are omitted, statistics failure preserves workout, HR opt-out makes no HR call', async () => {
  const run = sample({ totalDistance: { quantity: -5, unit: 'meters' }, getStatistic: async (type) => {
    assert.equal(type, 'HKQuantityTypeIdentifierDistanceWalkingRunning');
    throw new Error('PRIVATE_SYNTHETIC');
  } });
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => [run] }), now);
  await port.requestPermission(false);
  const result = await port.listRecentRunningWorkouts();
  assert.equal(result.status, 'queried');
  if (result.status !== 'queried') return;
  assert.equal(result.metricsIncomplete, true);
  assert.equal('distanceMeters' in result.workouts[0]!, false);
  assert.equal('averageHeartRateBpm' in result.workouts[0]!, false);
  assert.equal(JSON.stringify(result).includes('PRIVATE_SYNTHETIC'), false);
});

test('legacy workout distance remains usable when statistics absent; no unit guessing', async () => {
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => [
    sample({ totalDistance: { quantity: 1000, unit: 'meters' } }),
    sample({ uuid: 'synthetic-run-2', totalDistance: { quantity: 1, unit: 'mile' } }),
  ] }), now);
  await port.requestPermission(false);
  const result = await port.listRecentRunningWorkouts();
  if (result.status !== 'queried') return assert.fail('expected query');
  assert.equal(result.workouts[0]?.distanceMeters, 1000);
  assert.equal(result.workouts[1]?.distanceMeters, undefined);
});

test('wrong sport and out-of-window samples are excluded; malformed dates and query errors never look empty', async () => {
  let samples = [sample({ workoutActivityType: 1 }), sample({ startDate: new Date('2020-01-01Z') })];
  const port = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => samples }), now);
  await port.requestPermission(false);
  const filtered = await port.listRecentRunningWorkouts();
  if (filtered.status !== 'queried') return assert.fail('expected query');
  assert.deepEqual(filtered.workouts, []);
  samples = [sample({ startDate: new Date('invalid') })];
  const malformed = await port.listRecentRunningWorkouts();
  assert.equal(malformed.status, 'failed');
  assert.equal('workouts' in malformed, false);
  const failing = createHealthActivityReading(() => client({ queryWorkoutSamples: async () => { throw new Error('PRIVATE_SYNTHETIC'); } }), now);
  await failing.requestPermission(false);
  const error = await failing.listRecentRunningWorkouts();
  assert.equal(error.status, 'failed');
  assert.equal('workouts' in error, false);
  assert.equal(JSON.stringify(error).includes('PRIVATE_SYNTHETIC'), false);
});

test('failed permission request resets the session query gate and sanitizes errors', async () => {
  let completed = true;
  const port = createHealthActivityReading(() => client({ requestAuthorization: async () => completed }));
  await port.requestPermission(false);
  completed = false;
  assert.equal((await port.requestPermission(false)).status, 'failed');
  assert.equal((await port.listRecentRunningWorkouts()).status, 'request-required');
  const failing = createHealthActivityReading(() => client({ requestAuthorization: async () => { throw new Error('PRIVATE_SYNTHETIC'); } }));
  assert.equal(JSON.stringify(await failing.requestPermission(false)).includes('PRIVATE_SYNTHETIC'), false);
});

test('overlapping native requests are rejected and the gate releases after completion', async () => {
  let finish!: (value: boolean) => void;
  const port = createHealthActivityReading(() => client({ requestAuthorization: () => new Promise((resolve) => { finish = resolve; }) }));
  const request = port.requestPermission(false);
  assert.equal((await port.requestPermission(true)).status, 'busy');
  assert.equal((await port.listRecentRunningWorkouts()).status, 'busy');
  finish(true);
  assert.equal((await request).status, 'requested');
  assert.equal((await port.listRecentRunningWorkouts()).status, 'queried');
});
