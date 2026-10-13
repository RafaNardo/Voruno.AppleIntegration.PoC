# Codex / coding agent instructions — VORUNO Apple Integration PoC

Read **README.md**, **docs/architecture.md**, **docs/experiments.md**, **docs/setup-windows-ios.md**, **docs/testing.md** and **docs/risks-and-findings.md** before implementation.

## Mission
Validate a REAL end-to-end Apple workflow on the owner's iPhone + Apple Watch, developing on Windows:
1. **WorkoutKit**: create and schedule a structured interval workout in Apple's native Workout app on Watch, if supported on tested OS/device.
2. **HealthKit**: read a real recorded run and available metrics with proper permissions.
3. Attempt honest correlation of scheduled workout to recorded activity; record constraints and uncertainties.

No watchOS app, backend, LLM, subscription or production VORUNO UI. This repository is an **isolated spike**, not a production feature.

## Coding constraints
- Expo + React Native + TypeScript strict, Expo Router when scaffolding, EAS development builds. Use compatible versions selected by `npx expo install` and `expo-doctor`, never speculative versions.
- The WorkoutKit native functionality may require a custom Swift Expo Module and config plugin/native project configuration. Consult official Apple documentation **before coding API signatures**; do not invent Swift classes/methods or assert scheduled/confirmed states the SDK cannot expose.
- Evaluate a maintained Expo-compatible HealthKit library first; if inadequate, implement minimal native read adapter. Record package/version/SDK compatibility and licensing.
- Separate `WorkoutScheduling` and `HealthActivityReading` TypeScript ports even if housed in a single Expo native module.
- Keep navigation/UI tiny: test controls, actual results, error details sanitized, logging, capability diagnostics. Static interval **test fixture** permitted in this PoC only and visibly labeled test.
- No fake permissions, activity metrics, watch connectivity, scheduling success or imported activities.
- Permissions through real Apple dialogs and entitlement configuration; permission unreadability must be handled without inferring denial/success.
- Store no sensitive health information in console/remote logs, Git, screenshots uploaded publicly, analytics or test fixtures. Never commit team IDs, certificates, provisioning profiles, keys, device IDs, secrets, or actual health export data.
- Do not add a .NET backend or Watch extension until a concrete validated need is recorded.
- User develops primarily on Windows. EAS cloud build can compile native iOS code; Xcode debugging, signing edge cases, Apple Watch extension troubleshooting may still require macOS.
- Small milestone-focused PRs, accurate findings notes. No claimed success absent test on physical devices.

## Execution order / stop gates
Follow milestone order in docs/experiments.md. Start with repository foundation + a physical-device development build, then WorkoutKit, HealthKit, reconciliation. Where a platform limitation blocks a milestone, **document evidence and alternatives, do not fake completion**.

## Deliverables for each PR
- implementation and focused tests; device/OS versions, Expo SDK, Xcode/EAS build environment, and steps to reproduce;
- clear success/partial/blocked status with captured **non-sensitive** evidence;
- updated docs/risks-and-findings.md;
- next experiment and what the actual SDK proved.

## Architecture reference
Main VORUNO backend/mobile contracts: https://github.com/RafaNardo/Voruno/blob/main/docs/architecture/mobile-code-design.md . This PoC should stay small rather than copy all application layers.
