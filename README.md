# VORUNO — Apple Integration PoC

**Status: technical experiment — implementation and device validation pending.**

Goal: validate that **Expo / React Native on Windows** can schedule a structured running workout for Apple's **Workout app on Apple Watch** via **WorkoutKit**, and then read an actually completed activity through **HealthKit**, without initially building our own watchOS app.

> WorkoutKit ≠ HealthKit. WorkoutKit designs/schedules workouts (when supported); HealthKit supplies permissioned recorded workout and measurement data. Scheduling ≠ arriving on Watch ≠ execution ≠ HealthKit import ≠ matched planned workout.

## Operating assumptions
- Windows development machine, **physical iPhone and Apple Watch**, both on recent operating systems.
- Active paid Apple Developer Program account.
- Builds created through **EAS Build cloud** and installed on physical iPhone.
- **Development build**, not Expo Go, because Apple native frameworks are required.
- Expo handles JS/TS Fast Refresh; **changes to Swift or native entitlements require rebuilding** a native binary.
- Native Swift debugging with Xcode usually needs macOS. EAS may compile this prototype but is not a replacement for Xcode native debugging.
- No Watch app target planned until validated requirements show one is needed.

## Quick start for Codex
1. Read [AGENTS.md](AGENTS.md), [experiment milestones](docs/experiments.md), [architecture](docs/architecture.md) and [Windows setup](docs/setup-windows-ios.md).
2. Implement **M0 only** in the first PR: scaffold Expo TypeScript development client, tiny status UI, EAS config, typed adapter contracts and sanitized diagnostics. Don't claim native capabilities before tested.
3. Owner configures signing/device registration and makes first EAS iOS development build.
4. M1: validate WorkoutKit on hardware with one fixed **test-only** structured interval workout.
5. M2: request HealthKit permissions and list **actual** running workouts.
6. M3: test matching and failure cases; publish a go/no-go report.

## Documentation
- [Codex instructions](AGENTS.md)
- [Architecture & native boundary](docs/architecture.md)
- [Windows + iPhone + EAS setup](docs/setup-windows-ios.md)
- [Experiments, milestones and acceptance criteria](docs/experiments.md)
- [Test matrix](docs/testing.md)
- [Risks, decisions and findings log](docs/risks-and-findings.md)
- [Privacy/security](docs/privacy.md)
- [Copy/paste Codex kickoff](docs/codex-kickoff.md)

## Definition of success
A native Apple Workout app workout is actually available/schedulable in the supported Watch experience, **plus** HealthKit returns an actual running session recorded by the Watch, and we document what correlation can and cannot be guaranteed. If Watch delivery cannot be confirmed programmatically, use an honest manual observation and state that distinction.

## Non-goals
Production UI, account system/backend, training engine, complete GPS/health export, subscriptions, autonomous coach, polished watchOS app, Garmin and Android.

## References
- Expo native modules: https://docs.expo.dev/modules/overview/
- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- EAS build: https://docs.expo.dev/build/introduction/
- Apple WorkoutKit: https://developer.apple.com/documentation/workoutkit
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
