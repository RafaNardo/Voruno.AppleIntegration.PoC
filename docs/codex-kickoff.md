# Codex kickoff prompt — copy into coding agent

Implement **M0 only** of this repository's Apple integration proof-of-concept.

Read `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/setup-windows-ios.md`, `docs/experiments.md`, `docs/testing.md`, `docs/privacy.md` and `docs/risks-and-findings.md` first. Respect them as the authoritative scope.

Deliver an Expo Router + React Native + TypeScript strict app, configured for EAS **iOS development builds** with `expo-dev-client`, a small test UI with clear not-yet-implemented states, typed `WorkoutScheduling` and `HealthActivityReading` ports, and safe diagnostics (versions/capability only, not health records). Check actual current Expo SDK/package compatibility rather than guessing versions. Configure a unique bundle ID without committing sensitive signing information. Add `app.config.ts`, `eas.json`, `package.json`, lockfile, appropriate ignore rules and essential tests/configuration.

Do not create a watchOS app. Do not implement backend, Training Engine, fake recorded workouts, speculative WorkoutKit Swift calls, or hard-coded success. Native WorkoutKit implementation belongs to the *next* milestone M1 after a working physical iPhone development build.

Run all available verification commands (typecheck, lint, tests, expo-doctor as appropriate); distinguish what was run locally from EAS/cloud and physical device tests that require owner action. Report exact commands, results, blockers and manual signing/build steps. Update `docs/risks-and-findings.md` with observations only. Prefer a small focused PR.

When M0 is done, provide next action for owner: enroll iPhone for development build and install via EAS. Do not mark M0 physical acceptance complete before confirmation from device owner.
