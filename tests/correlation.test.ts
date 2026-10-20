import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { correlate, plannedTest, TEST_PLAN_ID } from '../src/features/correlation/reconcile';
import type { RunningWorkout } from '../src/features/health-activities/port';

const target = plannedTest('2030-01-19T10:00:00Z', 'schedule-returned')!;
const run = (overrides: Partial<RunningWorkout> = {}): RunningWorkout => ({
  id: 'synthetic-run', startedAt: '2030-01-19T10:02:00Z', endedAt: '2030-01-19T10:07:00Z', durationSeconds: 300,
  source: { name: 'Synthetic', bundleIdentifier: 'test.synthetic' }, planLink: { status: 'absent' }, ...overrides,
});

test('correlation fixture identity agrees with the native scheduler contract', () => {
  const swift = readFileSync(new URL('../modules/voruno-apple/ios/WorkoutSchedulingService.swift', import.meta.url), 'utf8');
  const nativeId = /fixtureID = UUID\(uuidString: "([\da-f-]+)"\)/i.exec(swift)?.[1];
  assert.equal(nativeId?.toLowerCase(), TEST_PLAN_ID);
});

test('missing schedule context and empty/late-sync query never establish a match', () => {
  assert.equal(correlate(undefined, [run()]).status, 'no-context');
  assert.equal(plannedTest('invalid', 'scheduler-list'), undefined);
  assert.equal(correlate(target, []).status, 'no-candidate');
});

test('same optional plan ID plus time is stronger evidence, never exact session or step completion', () => {
  const result = correlate(target, [run({ planLink: { status: 'available', id: TEST_PLAN_ID.toUpperCase(), running: true } })]);
  assert.equal(result.status, 'possible-match');
  assert.equal(result.candidates[0]?.confidence, 'stronger');
  assert.match(result.candidates[0]!.reason, /não confirma/);
});

test('time and duration fallback stays low confidence; failed link lookup is not an absent plan claim', () => {
  for (const status of ['absent', 'failed'] as const) {
    const result = correlate(target, [run({ planLink: { status } })]);
    assert.equal(result.status, 'possible-match');
    assert.equal(result.candidates[0]?.confidence, 'low');
  }
});

test('known different plan, wrong plan sport, outside time window and changed duration do not match by fallback', () => {
  for (const workout of [
    run({ planLink: { status: 'available', id: 'another-plan', running: true } }),
    run({ planLink: { status: 'available', id: TEST_PLAN_ID, running: false } }),
    run({ startedAt: '2030-01-19T11:00:00Z' }),
    run({ durationSeconds: 700 }),
  ]) assert.equal(correlate(target, [workout]).status, 'no-candidate');
  const altered = correlate(target, [run({ durationSeconds: 700, planLink: { status: 'available', id: TEST_PLAN_ID, running: true } })]);
  assert.equal(altered.status, 'possible-match');
  assert.match(altered.candidates[0]!.reason, /alterada/);
});

test('multiple candidates refuse selection even with one stronger ID; refresh and duplicate records do not multiply matches', () => {
  const first = run();
  const second = run({ id: 'synthetic-run-2', planLink: { status: 'available', id: TEST_PLAN_ID, running: true } });
  assert.equal(correlate(target, [first, second]).status, 'ambiguous');
  assert.equal(correlate(target, [first, first]).candidates.length, 1);
  assert.deepEqual(correlate(target, [first]), correlate(target, [first]));
});
