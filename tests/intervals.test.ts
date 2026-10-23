import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceInInterval, minuteDistances, type DistanceSample } from '../src/features/health-activities/intervals';

test('minute boundaries conserve distance, split samples are estimates, last minute can be partial', () => {
  const rows = minuteDistances([{ id: 'synthetic', start: 0, end: 150_000, meters: 500 }], 0, 150_000);
  assert.deepEqual(rows.map((r) => r.distanceMeters), [200, 200, 100]);
  assert.equal(rows.reduce((sum, r) => sum + r.distanceMeters!, 0), 500);
  assert.ok(rows.every((r) => r.quality === 'estimated' && r.coverage === 1));
  assert.equal(rows[2]?.endSeconds, 150);
});

test('aligned samples are sums; empty intervals are missing, not zero; measured zeros survive', () => {
  const rows = minuteDistances([{ id: 'a', start: 0, end: 60_000, meters: 100 }, { id: 'b', start: 120_000, end: 180_000, meters: 0 }], 0, 180_000);
  assert.equal(rows[0]?.quality, 'sample-sum');
  assert.equal(rows[1]?.quality, 'missing');
  assert.equal(rows[1]?.distanceMeters, undefined);
  assert.equal(rows[2]?.distanceMeters, 0);
});

test('overlapping samples are not double counted; duplicate IDs collapse; coverage exposes gaps', () => {
  const a: DistanceSample = { id: 'a', start: 0, end: 30_000, meters: 50 };
  assert.equal(distanceInInterval([a, a], 0, 60_000, 0).distanceMeters, 50);
  assert.equal(distanceInInterval([a], 0, 60_000, 0).coverage, 0.5);
  const overlap = distanceInInterval([a, { id: 'b', start: 20_000, end: 50_000, meters: 70 }], 0, 60_000, 0);
  assert.equal(overlap.quality, 'overlap');
  assert.equal(overlap.distanceMeters, undefined);
});

test('interval clipping uses elapsed time and does not pretend to remove pauses', () => {
  const row = distanceInInterval([{ id: 'a', start: 0, end: 120_000, meters: 240 }], 30_000, 90_000, 0);
  assert.equal(row.distanceMeters, 120);
  assert.equal(row.startSeconds, 30);
  assert.equal(row.endSeconds, 90);
  assert.equal(row.quality, 'estimated');
  assert.equal(minuteDistances([], 0, 1000 * 60 * 300).length, 240);
});
