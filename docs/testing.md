# Test plan and evidence matrix

## Test identities / fixtures
The fixed workout is **PoC-only demo input**, never represented as an actual recorded activity. Use synthetic values in unit tests, but physical acceptance must use actual data on the owner's devices. Public repo must not contain personally identifiable health/GPS exports.

| Scenario | Expected evidence | Outcome |
|---|---|---|
| Windows Expo dev-client starts | Expo SDK, build ID (non-secret), screenshot of neutral test screen | owner reports working on iPhone iOS 26.6.1; build ID/model still pending |
| JS Fast Refresh on phone | A small text change updates on physical iPhone | owner reports working; not independently observed |
| Native Swift rebuild | New EAS binary includes changed native module | pending |
| WorkoutKit supported? | OS/device capability and Apple framework response | pending |
| Schedule intervals | Native call returns observed result; visual check on Watch | owner reports five-minute and two-second scheduling working; exact steps/read-back/build fields pending |
| Incorrect/unsupported workout | Typed failure, not success | pending |
| Schedule while Watch offline | State distinction: accepted vs visible/unknown | pending |
| Duplicate scheduling | Defined behavior; no silent duplicate claimed | pending |
| HealthKit permission prompt | Real UI and read-permission uncertainty documented | pending |
| HealthKit workouts empty | No fake activity, truthful empty/unknown UI | pending |
| Real Watch run import | Actual workout metadata, provenance, units/timezone | owner reports M2 summary working; full comparisons and detail acceptance pending |
| No HR/distance available | Optional metric omitted, no zero-as-data | pending |
| Watch/iPhone sync delayed | Refresh/retry, staleness explanation | pending |
| Unrelated run/multiple candidates | Correlation stays ambiguous, no forced match | pending |
| Re-import same run | Deduplicated identity/result | pending |
| Resume after background | Correct reload and state; no fake completion | pending |
| iOS permission revoked | System setting guidance and truthful state | pending |

## Automated

Current revision: [M2 details + M3 joint acceptance](m3-correlation.md#joint-physical-test), authorized together by the owner on 2026-10-19. 34 synthetic tests cover existing boundaries plus interval estimates/overlaps/gaps, details/plan failures and conservative correlation. Detailed event visibility, sample resolution and actual plan linkage still need owner observation. Older milestone counts below are historical.
- TypeScript strict, ESLint, tests for status mapping, date/units, candidate correlation, idempotency logic where feasible.
- Port/provider contract tests using test-only fake adapters (clearly separated).
- Smoke check on supported iOS development build and native module loading.
- Manual native tests required because CI simulators do not establish real Watch behavior.

## M0 local verification

Run from the repository root:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor
npm run export:ios
npx expo config --type public
git diff --check
```

The original M0 tests exercise the unimplemented HealthKit adapter and diagnostics privacy boundary. M1 adds TypeScript adapter tests for missing binaries, authorization, truthful submission/list/removal states, preflight failures and sanitized unknown/error responses. The unscheduled-preview revision adds cancellation/no-receipt, old-method compatibility and read-back mapping coverage (12 tests total). Test doubles are synthetic and never device evidence. ESLint forbids console logging in app source. The iOS export checks Metro resolution and bundle generation only; it does not compile Swift, sign an app, test layout on a phone, or establish physical acceptance. CI runs local checks; no Apple credentials are required.

Owner acceptance: follow the [M0 owner checklist](setup-windows-ios.md#m0-owner-checklist). Do not change physical tests to pass based on automated checks. No M1 implementation is authorized until installation, Metro connectivity and Fast Refresh are confirmed on the physical iPhone.

M0 entry gate was accepted from the owner's report of iPhone iOS 26.6.1 and working development mode/refresh. Owner subsequently reported M1 scheduling working on Watch, including a two-second delay; unscheduled preview export was not visible. Remaining environment fields and exact steps must still be captured. For M1 use the [physical checklist](m1-workoutkit.md#owner-build-and-physical-acceptance), including the new app icon, duplicate scheduling, restart, offline Watch and targeted removal. These remaining cases are not marked passed.

## Evidence template

For the current M2 implementation, follow the [HealthKit device checklist](m2-healthkit.md#owner-build-and-physical-acceptance). Owner explicitly authorized M2 after reporting successful scheduling. Apple Watch SE/watchOS 26.6 is now owner-reported; iPhone model, Watch generation and actual build fields remain pending. No HealthKit device test is marked passed yet. The current suite has 20 tests: nine M2 adapter tests replace the obsolete M0 unimplemented-HealthKit test, retaining the privacy and M1 coverage. Only synthetic data is used.
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
