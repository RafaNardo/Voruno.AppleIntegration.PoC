import assert from 'node:assert/strict';
import test from 'node:test';
import { addRunningMetrics, clockDuration } from '../src/features/health-activities/running-metrics';
import { minuteDistances } from '../src/features/health-activities/intervals';

test('pace converts arithmetic speed mean; cadence uses associated steps and partial final minute duration', () => {
  const rows = addRunningMetrics(minuteDistances([], 0, 90_000), 0,
    [{ id: 'a', start: 0, end: 0, metersPerSecond: 2 }, { id: 'b', start: 30_000, end: 30_000, metersPerSecond: 3 }],
    [{ id: 's', start: 0, end: 90_000, meters: 240 }]);
  assert.equal(rows[0]?.paceSecondsPerKm, 400);
  assert.equal(rows[0]?.cadenceStepsPerMinute, 160);
  assert.equal(rows[1]?.cadenceStepsPerMinute, 160);
  assert.equal(rows[0]?.cadenceEstimated, true);
  assert.equal(rows[1]?.paceSecondsPerKm, undefined);
});
test('zero speed does not produce infinite pace; missing or overlapping step data does not fabricate cadence', () => {
  const minutes = minuteDistances([], 0, 60_000);
  const speeds = [{ id: 'a', start: 0, end: 0, metersPerSecond: 0 }];
  assert.equal(addRunningMetrics(minutes, 0, speeds, [])[0]?.paceSecondsPerKm, undefined);
  assert.equal(addRunningMetrics(minutes, 0, [], [{ id: 's', start: 0, end: 30_000, meters: 80 }])[0]?.cadenceStepsPerMinute, undefined);
  assert.equal(addRunningMetrics(minutes, 0, [], [
    { id: 'a', start: 0, end: 60_000, meters: 80 }, { id: 'b', start: 0, end: 60_000, meters: 80 },
  ])[0]?.cadenceStepsPerMinute, undefined);
});
test('duplicate speeds count once, zero steps survive and duration formatting handles rounding/hour rollover', () => {
  const s = { id: 'a', start: 0, end: 0, metersPerSecond: 4 };
  const row = addRunningMetrics(minuteDistances([], 0, 60_000), 0, [s, s], [{ id: 's', start: 0, end: 60_000, meters: 0 }])[0]!;
  assert.equal(row.speedSampleCount, 1);
  assert.equal(row.cadenceStepsPerMinute, 0);
  assert.equal(clockDuration(3599.9), '1:00:00');
  assert.equal(clockDuration(400), '6:40');
});
