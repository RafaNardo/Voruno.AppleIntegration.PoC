import assert from 'node:assert/strict';
import test from 'node:test';
import { healthActivityReading } from '../src/features/health-activities/port';
import { safeDiagnostics, safeErrorMessage } from '../src/shared/diagnostics/safe-diagnostics';

test('unimplemented HealthKit adapter does not claim support, permission or empty query results', async () => {
  for (const port of [healthActivityReading]) {
    const capability = await port.getCapability();
    assert.equal(capability.capability, 'unknown');
    assert.equal(capability.implementation, 'not-implemented');
  }
  const permission = await healthActivityReading.requestPermission();
  assert.equal(permission.status, 'not-implemented');
  assert.equal('readStatus' in permission, false);
  const query = await healthActivityReading.listRecentRunningWorkouts();
  assert.equal(query.status, 'not-implemented');
  assert.equal('workouts' in query, false);
});

test('diagnostics discard extra payload fields and errors never expose raw details', () => {
  const payload = {
    platform: 'ios', osVersion: 'test-os', expoVersion: 'test-expo',
    reactNativeVersion: 'test-rn', executionEnvironment: 'test-environment',
    healthRecords: ['SYNTHETIC_PRIVATE_SENTINEL'], deviceId: 'SYNTHETIC_PRIVATE_SENTINEL',
  };
  const diagnostics = safeDiagnostics(payload);
  assert.equal(diagnostics.osVersion, 'test-os');
  assert.equal(JSON.stringify(diagnostics).includes('SYNTHETIC_PRIVATE_SENTINEL'), false);
  assert.equal('deviceId' in diagnostics, false);
  assert.equal('healthRecords' in diagnostics, false);
  for (const error of [new Error('SYNTHETIC_PRIVATE_SENTINEL'), payload, null]) {
    assert.equal(safeErrorMessage(error).includes('SYNTHETIC_PRIVATE_SENTINEL'), false);
  }
});
