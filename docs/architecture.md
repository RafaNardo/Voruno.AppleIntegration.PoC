# PoC architecture — minimal native bridge

## Flow
```text
Expo Router test screen (TypeScript)
    |--> WorkoutScheduling port --> Expo native Swift adapter --> WorkoutKit (iOS)
    |--> HealthActivityReading port --> compatible library OR Swift adapter --> HealthKit (iOS)
    |--> Test correlation (local-only, best effort) -> actual observations + findings
```
Nothing here is a backend contract. The production project owns plan persistence/reconciliation; **do not implement a .NET API** here.

## Suggested structure (adjust to actual Expo scaffold)
```text
src/app/index.tsx             # clear experiment controls and results
src/features/workout-scheduling/
src/features/health-activities/
src/features/correlation/
src/shared/types/
src/shared/diagnostics/
modules/voruno-apple/         # optional Expo local native module (Swift)
docs/
app.config.ts
eas.json
```

## Typed ports; shape illustrative (not proven native SDK API)
```ts
type Capability = 'supported' | 'unsupported' | 'unknown';
type ActionStatus = 'not-started' | 'requested' | 'submitted' | 'observed-on-watch' | 'failed' | 'unknown';

interface WorkoutScheduling {
  getCapability(): Promise<{ capability: Capability; reason?: string }>;
  scheduleTestWorkout(): Promise<{ status: ActionStatus; requestedAt: string; opaqueReference?: string; message?: string }>;
}
interface HealthActivityReading {
  requestPermission(): Promise<{ requestCompleted: boolean; readStatus: 'unknown' | 'unavailable'; note?: string }>;
  listRecentRunningWorkouts(): Promise<ReadonlyArray<{
    sourceId: string; startedAt: string; endedAt: string;
    distanceMeters?: number; durationSeconds?: number; heartRateSummary?: { averageBpm?: number };
    dataProvenance?: string;
  }>>;
}
```
Never infer read permission from a successful permission prompt or empty queries; HealthKit has privacy-preserving behavior. No API shall claim Watch delivery/receipt unless actually observable. Use `submitted` for scheduling call that succeeds; `observed-on-watch` requires user/device evidence (manual observation labeled as such).

The ports live separately in `src/features/*/port.ts`. M1 implements `WorkoutScheduling` through a local iOS Expo module at `modules/voruno-apple`. Its TS adapter validates native responses, maps only fixed status/error codes and keeps OS capability, scheduling authorization, list evidence and manual Watch observations separate. The native module exclusively owns the fixed fixture, dates, support checks, capacity, duplicate checks and targeted removal. It never queries HealthKit.

`HealthActivityReading` remains explicitly `not-implemented`; it does not return an empty array that could be mistaken for an executed query. An absent M1 module leaves scheduling capability `unknown` and asks for a rebuild instead of declaring unsupported hardware. Diagnostics remain on-screen with version/platform fields and no raw errors. See [M1 decisions and limitations](m1-workoutkit.md).

## Scheduling experiment
- Consult current WorkoutKit documentation/API availability and minimum OS versions; select matching EAS macOS/Xcode build image.
- Construct a short, **test-only** running workout with warmup, two intervals, recoveries and cooldown using documented framework APIs, validating unsupported options and permission requirements.
- Determine whether Apple Workout app on Watch shows workout and whether edits/cancellation can be observed/managed.
- Separate capability detection from the result of one operation.
- Do not assume a universal callback identifying actual Workout app execution.

## Health read experiment
- Prefer compatible, actively maintained HealthKit Expo library **only after checking package health, native bridge maintenance and licensing**.
- Request only required HealthKit read categories: workout sessions, distance and optional heart-rate samples. GPS route access only later with explicit permission and need.
- Filter running workouts, time-window bound queries, convert native units/dates accurately, source provenance if available.
- Data is private and never placed in commits or public logs.

## Correlation experiment
- Define a local test ID and planned start window; compare with actual start/end times, activity type, duration, target interval structure only if exposed and credible.
- Deduplicate by stable source identity where available, otherwise clearly document fallback, confidence and ambiguity.
- Avoid auto-link claim when multiple runs overlap or a user executes an unrelated run. Never overwrite original activity.
- Document whether WorkoutKit scheduling offers any ID accessible from HealthKit; **do not assume it does**.

## Separation of responsibilities
- React Native: UI, prompts, event instrumentation, minimal orchestration.
- Native module/bridge: Apple permissions and frameworks only.
- Production backend (later): plan generation, canonical storage, reconciliation and Coach behavior.
- Do not make the PoC a production-grade architecture demonstration.

## Handling native builds
Swift, config plugins, entitlements, Info.plist and deployment targets must be checked into reproducible configuration. EAS builds native binary. Do not rely on manual edits in generated ios/ that disappear on prebuild.
