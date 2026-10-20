# M2 — Read actual running workouts

Status update (2026-10-19): owner reports the original M2 summary working and authorized details plus M3 for joint testing. Follow the [current combined checklist](m3-correlation.md). The sections below document the original M2 summary implementation and build setup; its statements about deferred detail/correlation work describe that earlier revision. Exact environment and full physical acceptance matrix remain pending. iPhone iOS 26.6.1 (model pending); Apple Watch SE, watchOS 26.6 (generation unspecified), owner-reported.

## Library evaluation and native configuration

Selected [`@kingstinct/react-native-healthkit`](https://github.com/kingstinct/react-native-healthkit) **16.2.0**, MIT, with matching transitive `@react-native-healthkit/core` **16.2.0**, MIT, and `react-native-nitro-modules` **0.37.1**, MIT. The maintained package provides an Expo plugin, Promise-based authorization/workout queries and workout statistics. npm latest/release history, published package sources, type declarations, plugin and podspec were inspected before implementation. Installed through `npx expo install @kingstinct/react-native-healthkit react-native-nitro-modules`; no forced/legacy peer resolution or speculative version selection.

The published peer ranges are React >=19, React Native >=0.79, Nitro >=0.35. Installed React 19.2.3, RN 0.86.3 and Expo 57.0.28 satisfy those declarations; Expo Doctor passes. The library's own package development versions are React 19.1/RN 0.81.5, so the peer range is not independent proof of native SDK 57 compatibility. The podspec includes an upstream Swift 6.2/Xcode 26 interop workaround. EAS compilation with the configured Xcode 26.6 image remains required. No custom HealthKit Swift adapter is justified yet; the existing custom module still handles only WorkoutKit.

The Expo plugin sets `com.apple.developer.healthkit = true` and a Portuguese `NSHealthShareUsageDescription`. `background: false` disables background-delivery entitlement; `NSHealthUpdateUsageDescription: false` omits the write-purpose string. Introspection confirms those results. Runtime requests use `toShare: []`; no HealthKit write/delete operation, route access, observer subscription or background task is called.

Sources and inspected API surface:

- [Library installation / Expo setup](https://github.com/kingstinct/react-native-healthkit#installation), published `app.plugin.ts`, `CoreModule.nitro.ts`, `WorkoutsModule.nitro.ts`, `WorkoutProxy.nitro.ts`, `WorkoutProxy.swift`, query/types and exact dependency lockfile.
- [Apple authorization and read privacy](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data): completion of an authorization request is not proof of read access. Empty results cannot distinguish denied access from absent records; limited historical access may also restrict results.
- [Workout statistics](https://developer.apple.com/documentation/healthkit/hkworkout/statistics(for:)): the library's `getStatistic` reads statistics associated with the workout rather than attributing unrelated time-overlapping HR samples to it.
- [HKWorkout.workoutPlan](https://developer.apple.com/documentation/healthkit/hkworkout/workoutplan): official declaration is optional, async/throwing, iOS 17+. The library exposes `getWorkoutPlan()`. This corrects the earlier lack of an identified API for plan linkage; availability and identity on actual runs are **M3 experiments**, not proof that `HKWorkout.uuid` equals `WorkoutPlan.id`. M2 does not call it.

## Read contract and privacy

`HealthActivityReading` stays separate from `WorkoutScheduling`. A lazy library loader keeps a missing/older native binary inside a fixed error boundary. `isHealthDataAvailable` is capability, not permission. No permission prompt or health query runs automatically on mount.

1. Owner requests read access to workouts and walking/running distance. HR is off by default; enabling it and requesting again adds only heart rate. GPS, energy, other sample types and write permissions are excluded.
2. Only after a completed request in the current JS session can a query run. Even a completed request with all read toggles denied remains `readStatus: unknown` and may return an empty list. Relaunch requires another explicit request; the OS may remember choices and not show a dialog again.
3. Query: running activity predicate, start and end inside a rolling 14×24-hour window, descending start date, maximum 20 workouts. Manual refresh replaces the list; duplicate UUIDs within a response are collapsed. This is not a full historical import or persistent sync.
4. Map only workout UUID (internal React key/deduplication), start/end ISO dates (shown locally), **recorded** duration in seconds, optional distance in metres, optional average HR in beats/minute, source name and bundle identifier. Source is not guessed to be Apple Watch; the owner must inspect it. Duration may exclude pauses and is not replaced by end minus start.
5. Distance uses associated workout statistics in `m`, falling back to the workout's reported total in metres when available. HR uses associated average statistics in `count/min` only when requested. Unsupported units, negative/nonfinite values and missing metrics are omitted; missing values are never filled with zero. A genuine recorded zero distance remains zero. Optional statistics failures retain the workout with an incomplete-metrics notice; a failed/malformed workout query is not presented as an empty success.
6. No proxy serialization (`toJSON`), arbitrary metadata, device IDs, routes, raw HR series, persistent store, console/remote logs or analytics. Results stay in screen memory. Clear/background/unmount discards displayed results; late query results cannot repopulate the screen after clearing or backgrounding. This is not a secure-memory-erasure or OS app-switcher snapshot guarantee.

## Owner build and physical acceptance

1. Build a new binary from this branch:
   ```powershell
   npx eas-cli@latest build --platform ios --profile development
   ```
   HealthKit/Nitro and the entitlement require a rebuild; Fast Refresh cannot add them. Allow EAS signing to sync HealthKit capability/provisioning for the existing app identifier. Do not disable capability syncing. If signing fails, inspect the sanitized entitlement/provisioning error; keep credentials/profiles private. Record actual EAS build ID and resolved Xcode/image, not just the configured `macos-tahoe-26.5-xcode-26.6`.
2. Install on the physical iPhone, unlock it, run `npm start`, connect the development client. Locate **M2 · Corridas registradas no Saúde**. It must not request health access automatically. The M1 scheduling controls remain available.
3. Leave HR off initially. Tap **Solicitar acesso de leitura ao Saúde**, inspect the real Apple UI and allow the desired read types. No write permission should be requested. Completion must still show unknown read access.
4. Record and **save** a short actual run using the Watch's Workout app. It may be the VORUNO test or an ordinary run; M2 does not claim matching. Wait until it appears in the iPhone Health/Fitness apps, then tap **Ler / atualizar corridas reais**.
5. Compare the actual run's start/end, recorded duration and source locally. Compare distance when available. Enable HR, request access again and refresh; average HR may remain unavailable. Compare to Apple's workout summary if present. Do not send raw values, IDs or unredacted screenshots to the repository/chat as public evidence.
6. Refresh again: no appended duplicates. Background/foreground: results should clear and require manual refresh. Relaunch: no cached records; request access before reading again. Clear while a read is pending: late results must not reappear.
7. Test read access denied/revoked (through Health settings), no visible recent runs, HR denied while workouts allowed, and delayed Watch sync. An empty list must say causes are indistinguishable. Optional missing metrics must not become zeros. Record sanitized result codes only.
8. Report model/OS, build/commit, whether the real permission UI and actual Watch run were observed, whether dates/duration/source matched, whether optional metrics were available, and pass/partial/fail for the cases above. M2 is not complete until a real run is read and compared. Do not start M3 automatically.

## Local evidence and limits

Typecheck, lint, 20 tests, Expo Doctor 21/21, Expo dependency check, iOS Metro export and config introspection passed. Tests are synthetic and cover least-privilege requests, unknown read permission, empty/error distinction, bounds, deduplication, units, optional statistics failure, sanitization and serialization of operations. They do not establish Apple native behavior, UI/device acceptance or EAS compilation on Windows.

`npm audit` reports 30 advisories (20 high, 10 moderate), versus 28 previously documented. The two additional affected package entries are HealthKit and its core via the existing `react-native` advisory chain; no new package-specific advisory was reported for their own code. npm proposes an incompatible major downgrade; no force fix applied. This is not a vulnerability-free dependency claim.

The focused M2 PR is based on `feat/m1-workoutkit-scheduling` (53b1b81), because `main` currently contains M0 while the M1 PR was merged into the M0 feature branch. Retarget after the M1 integration reaches main; do not silently include/reimplement M1 in this diff.
