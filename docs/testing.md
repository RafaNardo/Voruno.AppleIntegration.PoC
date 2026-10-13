# Test plan and evidence matrix

## Test identities / fixtures
The fixed workout is **PoC-only demo input**, never represented as an actual recorded activity. Use synthetic values in unit tests, but physical acceptance must use actual data on the owner's devices. Public repo must not contain personally identifiable health/GPS exports.

| Scenario | Expected evidence | Outcome |
|---|---|---|
| Windows Expo dev-client starts | Expo SDK, build ID (non-secret), screenshot of neutral test screen | pending |
| JS Fast Refresh on phone | A small text change updates on physical iPhone | pending |
| Native Swift rebuild | New EAS binary includes changed native module | pending |
| WorkoutKit supported? | OS/device capability and Apple framework response | pending |
| Schedule intervals | Native call returns observed result; visual check on Watch | pending |
| Incorrect/unsupported workout | Typed failure, not success | pending |
| Schedule while Watch offline | State distinction: accepted vs visible/unknown | pending |
| Duplicate scheduling | Defined behavior; no silent duplicate claimed | pending |
| HealthKit permission prompt | Real UI and read-permission uncertainty documented | pending |
| HealthKit workouts empty | No fake activity, truthful empty/unknown UI | pending |
| Real Watch run import | Actual workout metadata, provenance, units/timezone | pending |
| No HR/distance available | Optional metric omitted, no zero-as-data | pending |
| Watch/iPhone sync delayed | Refresh/retry, staleness explanation | pending |
| Unrelated run/multiple candidates | Correlation stays ambiguous, no forced match | pending |
| Re-import same run | Deduplicated identity/result | pending |
| Resume after background | Correct reload and state; no fake completion | pending |
| iOS permission revoked | System setting guidance and truthful state | pending |

## Automated
- TypeScript strict, ESLint, tests for status mapping, date/units, candidate correlation, idempotency logic where feasible.
- Port/provider contract tests using test-only fake adapters (clearly separated).
- Smoke check on supported iOS development build and native module loading.
- Manual native tests required because CI simulators do not establish real Watch behavior.

## Evidence template
- Date / commit:
- iPhone model / iOS:
- Apple Watch model / watchOS:
- Expo SDK / RN version:
- EAS build ID / Xcode version/build image:
- Entitlements and permissions configured (no secrets):
- Steps executed:
- Expected / actual behavior:
- Error code (sanitized):
- Visual observation: yes/no, observer:
- Result: pass / partial / fail / blocked:
- Follow-up:

Do not paste actual health records, route coordinates, Apple account identity, device UDIDs, signing credentials, private certificates or unredacted health screenshots into this public repository.
