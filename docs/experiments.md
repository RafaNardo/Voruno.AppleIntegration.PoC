# Experiments and acceptance criteria

**Do not skip gates; status is pending until physical-device evidence.** Scope is one runner's test hardware and native Workout app, not production guarantees.

## M0 — Expo development foundation
**Implement:** minimal Expo TypeScript app, Expo Router (simple single-screen), expo-dev-client, EAS configuration, platform capability panel, two typed ports with real 'not implemented' states, diagnostics safe from health PII, clear placeholder UI.
**Acceptance:** reproducible `npm install`, `npx expo-doctor`, iOS development EAS build installed and opened on physical iPhone from Windows, Metro connectivity/Fast Refresh confirmed. No fabricated native status. Document Expo SDK, React Native version, Xcode image and device OS.
**PR:** foundation only, no invented WorkoutKit API.
**Owner manual task:** Apple signing, device registration, install test app.

## M1 — WorkoutKit scheduled intervals (highest risk)
**Research before implementation:** exact Apple SDK availability, required OS targets, native framework APIs, authorization, app entitlement and capabilities. Document sources and decisions.
**Build:** small native Expo Swift module or compatible proven bridge; TypeScript port; fixed test-only interval workout with warmup, 2 work segments, 2 recoveries and cooldown, clearly labeled PoC.
**Observe:** schedule attempt, result returned by OS, presence/absence in Apple's native Workout app on Watch, app restart, duplicate attempt and failure. Record scheduling vs manually observed Watch visibility separately.
**Acceptance:** real non-simulated WorkoutKit API call succeeds, **owner visually verifies** structured workout available in Apple's Workout app on physical Watch, parameters match requested steps; if API cannot reveal receipt, preserve `submitted` status and separate manual evidence. Failed or unsupported capabilities present actionable reason. Update findings.
**Stop gate:** if EAS/cloud build or WorkoutKit API cannot deliver test workout, write blocker and alternative evaluation; do not jump to writing our own watch app without signoff.

## M2 — HealthKit real activity reading
**Research:** inspect candidate maintained Expo HealthKit library compatibility with selected Expo SDK / iOS and license; record selection. Use native module when compatibility blocks a library.
**Build:** permission request for workouts and optional distance/HR; narrow recent-running-workouts query; UI for actual metadata and provenance. Do not show route or raw HR sample traces without separate requirement.
**Observe:** execute an actual test run on Watch, let Watch/iPhone sync, refresh UI. Include zero activity/denied/unknown permission cases, iPhone background/foreground and app restart.
**Acceptance:** one real running workout returned from native HealthKit with source, accurate start/end and duration, distance only if present and plausible, HR only if available. Device screenshot/log redacted; source and limitations recorded. Do not infer read authorization from zero results.

## M3 — planned-to-recorded correlation
**Build:** local test fixture ID + scheduling timestamp and planned duration; candidate activity selection by temporal window, sport, provenance, optional metadata. Avoid claiming reliable WorkoutKit↔HealthKit shared ID without Apple-supported evidence.
**Observe:** matching run, unrelated run, duplicate imports, multiple candidate runs, altered/scheduled workout, late sync, missing HR.
**Acceptance:** one candidate can be labeled `possible match` with confidence/reason; ambiguous cases refuse automatic match; re-query is deduplicated; record whether exact matching is feasible or needs VORUNO backend reconciliation strategy.

## M4 — recommendation to VORUNO
**Deliver:** docs/findings finalized with environment matrix, Apple permission constraints, native module choice, required capabilities, confirmed observable events, failure modes, security/privacy, and go / conditional-go / no-go.
**Acceptance:** clear implementation contract and integration plan for production; links to reproducible commits, non-sensitive proof of device tests, known unknowns, and recommendation whether Watch app is unnecessary.

## Definition of done per milestone
- Build reproducible with compatible Expo version + lockfile; no repo secrets.
- Real capability, unavailable and permission flows; safe error states.
- Physical iPhone + Watch evidence where acceptance requires.
- Typecheck/lint/tests appropriate to slice, no fixtures shipped as real data.
- Findings log updated with version, device, date and exact proven behavior.

## Expected task sequencing for Codex
**First PR M0 only**. Ask for device signing/build result before claiming physical test pass. Then M1 independent small PR; M2 after gate; M3 after both verified. No premature backend or production architecture.
