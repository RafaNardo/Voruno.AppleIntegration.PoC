import assert from 'node:assert/strict';
import test from 'node:test';
import type { WorkoutRouteLocation } from '@kingstinct/react-native-healthkit';
import { normalizeRoute, routePlot } from '../src/features/health-activities/route';
import { sampleMean } from '../src/features/health-activities/statistics';

// Synthetic geometry, unrelated to any person or recorded route.
const point = (seconds: number, changes: Partial<WorkoutRouteLocation> = {}): WorkoutRouteLocation => ({
  date: new Date(seconds * 1000), latitude: 0, longitude: seconds / 10000,
  altitude: seconds, horizontalAccuracy: 5, verticalAccuracy: 5, course: -1, speed: -1, speedAccuracy: -1, ...changes,
});
test('GPS sanitizes locations, strips metadata and preserves gaps and route boundaries', () => {
  const result = normalizeRoute([{ locations: [point(0), point(1), point(2, { horizontalAccuracy: -1 }), point(3), point(40), point(41, { verticalAccuracy: -1 })], HKMetadataKeySyncIdentifier: 'PRIVATE_SYNTHETIC' }, { locations: [point(42)] }], 0, 60000);
  assert.equal(result.accepted, 6);
  assert.equal(result.rejected, 1);
  assert.deepEqual(result.segments.map(s => s.length), [2, 1, 2, 1]);
  assert.equal(result.maximumAltitude, 42);
  assert.equal(result.segments[2]?.[1]?.altitude, undefined);
  assert.equal(JSON.stringify(result).includes('PRIVATE_SYNTHETIC'), false);
  assert.equal(routePlot(result.segments).length, 4);
});
test('GPS rejects invalid coordinates/time/accuracy and splits antimeridian and nonmonotonic times', () => {
  const result = normalizeRoute([{ locations: [point(0, { latitude: NaN }), point(1, { longitude: 181 }), point(2, { horizontalAccuracy: 51 }), point(70), point(3, { longitude: 179.9 }), point(4, { longitude: -179.9 }), point(3)] }], 0, 60000);
  assert.equal(result.rejected, 4);
  assert.equal(result.segments.length, 3);
  assert.deepEqual(routePlot([], true), []);
});
test('route processing and render counts are bounded and altitude accepts negative elevations', () => {
  const result = normalizeRoute([{ locations: Array.from({ length: 20001 }, (_, i) => point(i, { longitude: 0, altitude: -10 })) }], 0, 30000000);
  assert.equal(result.accepted, 20000);
  assert.equal(result.truncated, true);
  assert.ok(result.segments.flat().length <= 500);
  assert.equal(result.minimumAltitude, -10);
  assert.ok(routePlot(result.segments).flat().every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
test('minute means deduplicate samples, use half-open intervals and leave empty buckets absent', () => {
  const rows = [{ id: 'a', start: 0, end: 0, amount: 120 }, { id: 'a', start: 0, end: 0, amount: 120 }, { id: 'b', start: 60000, end: 60000, amount: 160 }];
  assert.equal(sampleMean(rows, 0, 60000), 120);
  assert.equal(sampleMean(rows, 60000, 120000), 160);
  assert.equal(sampleMean(rows, 120000, 180000), undefined);
});
