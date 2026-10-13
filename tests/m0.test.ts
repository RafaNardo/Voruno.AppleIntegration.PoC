import assert from 'node:assert/strict';
import test from 'node:test';
import { safeDiagnostics, safeErrorMessage } from '../src/shared/diagnostics/safe-diagnostics';

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
