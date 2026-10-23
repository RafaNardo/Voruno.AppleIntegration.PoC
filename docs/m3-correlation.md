# M2 details + M3 correlation experiment

Status (2026-10-19): owner reported the M2 summary working and explicitly authorized expanded M2 and M3 for joint testing. Implementation is ready; detailed samples, real recorded events and actual plan linkage still require physical evidence. iPhone iOS 26.6.1 and Apple Watch SE/watchOS 26.6 are owner-reported; iPhone model, SE generation and actual build ID/Xcode remain unspecified. No production go/no-go conclusion.

## Build and scope

The features use APIs already shipped in Kingstinct HealthKit 16.2.0/core 16.2.0 and Nitro 0.37.1. During final checks, Expo Doctor flagged four newly recommended SDK 57 patches. `npx expo install --fix` selected Expo 57.0.30, expo-constants 57.0.22, expo-linking 57.0.13 and expo-router 57.0.28. Therefore **build/install a fresh EAS development binary** to align native dependencies, then run `npm start`. No new permissions, custom Swift, entitlements, GPS, raw HR series, backend or Watch target. HealthKit/Nitro and RN 0.86.3 versions are unchanged.

## What the details mean

### Pace/cadence and readability revision

The history now appears before collapsed PoC scheduling/diagnostics controls. Each run has its own dated card, prominent km/duration/HR, expandable origin/correlation evidence, and details tabs with ten rows at a time. Text wraps and controls have at least 44-point targets; physical-device readability remains to be checked.

Request read access again: `runningSpeed` and `stepCount` are added, with no write permission or GPS. Both queries are scoped to the selected workout, bounded to 2,001 samples to detect truncation. Invalid or truncated speed/step series are withheld; failed/empty series are not replaced with zero. These are JS changes using the installed library; no new native build is required for this revision on a working M2/M3 binary.

Pace is seconds/km converted from the arithmetic mean of available speed samples intersecting a minute. It is not instantaneous pace, a time-weighted average or a Fitness split; the sample count is shown and long/coalesced samples can span multiple buckets. Zero mean speed has no finite pace. Cadence uses associated step counts apportioned across the minute, divided by its elapsed duration; only full temporal coverage without overlaps produces a value. Boundary splits are labeled estimated. Missing associated steps remain unavailable even if total daily steps exist. Neither calculation excludes pauses. No raw GPS or HR series is displayed.

Sources: Apple [runningSpeed](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/runningspeed) and [stepCount](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/stepcount). Physical next checks: permit speed/steps, inspect minute metrics, deny steps while allowing speed, test zero-speed/pause periods and compare locally with Fitness without assuming equal aggregation methods.

Select **Ver detalhes · eventos e distância por minuto** on one actual run. The adapter re-queries that UUID as a running workout inside the same 14-day window; it does not retain native proxies between screen actions. No longer visible/deleted/revoked records are unavailable rather than fabricated empty details.

- Distance samples are queried with `filter: { workout: selectedWorkout }`, using the library's native workout predicate, in metres. They are not unrelated iPhone/Watch samples selected only by overlapping clock time.
- Detail limits: four elapsed hours, 2,000 samples (request 2,001 to detect truncation), 200 events, 240 minute buckets. Limits and invalid/discarded samples are surfaced. No missing value becomes zero; genuine recorded zero is preserved. A distance-query failure preserves available events and shows missing distance.
- Buckets are elapsed clock time from workout start, **including pauses**, with a shorter final bucket if necessary. Whole samples contribute their recorded sum. A sample crossing a boundary contributes proportional distance under a uniform-speed assumption, explicitly labeled **estimativa proporcional**. Coverage is the fraction of time spanned by available samples, not sensor accuracy. A partial sum is not a full interval total.
- Duplicate sample UUIDs collapse. Distinct overlapping samples make the affected bucket unavailable to avoid double counting; no arbitrary source is chosen. This is a conservative limitation, not proof that the underlying Apple data is wrong.
- Only event type and relative start/end times are exposed. Laps/segments with a positive recorded interval additionally show distance using the same rules. Pauses/resumes/markers remain points when recorded that way. No arbitrary event metadata, device IDs or routes are serialized. Zero-duration laps are not reconstructed into invented spans.
- Events are not automatically labeled warmup/work/recovery. The native Workout app may not expose those exact step boundaries here. No events means no observed step segmentation, even if the planned fixture contains steps.
- Apple can condense samples into quantity series. This PoC does not expand series; proportional estimates may lose detail and are not claimed to equal Fitness splits. A future accuracy experiment should use native statistics collections or quantity-series queries before promising precise splits. No new native adapter is justified by an untested assumption.

Official sources inspected: [associated workout samples](https://developer.apple.com/documentation/healthkit/adding-samples-to-a-workout), [event intervals](https://developer.apple.com/documentation/healthkit/hkworkoutevent/dateinterval), [condensed samples and series](https://developer.apple.com/documentation/healthkit/accessing-condensed-workout-samples). Published 16.2.0 types and implementations of `queryQuantitySamples`, `WorkoutProxy.events` and `getWorkoutPlan` were also inspected.

## M3 evidence and rules

The list now queries the documented optional [`HKWorkout.workoutPlan`](https://developer.apple.com/documentation/healthkit/hkworkout/workoutplan) through `getWorkoutPlan()`. Only its plan UUID and whether its sport is running are retained. Available, absent and failed lookup are distinct; lookup failure does not discard the workout or mean no plan exists. The UI compares the returned plan ID to the known synthetic fixture, never to the recorded workout UUID.

Reference context is the fixed test's returned schedule time, or the date of exactly one fixture found in the native scheduler list. The known fixture ID is shared by all PoC sends, with a cross-language contract test against Swift; expected duration is 300 seconds. There is no fabricated timestamp based on query time. More than one listed fixture clears the reference. Reference is memory-only, retained if its schedule is later removed in this session, replaced on a new schedule and lost on restart unless restored from the scheduler list. No schedule history is persisted.

Rules are experimental heuristics, not calibrated probabilities:

1. Consider only the running workouts visible in the current bounded query, with source provenance and start within ±15 minutes of the reference date. Keep source visible for manual inspection; do not assume a particular bundle ID proves Watch origin.
2. A known different plan ID or different plan sport excludes a candidate even if time/duration match.
3. Matching plan ID and time provide stronger evidence. A recorded duration unlike 300 seconds is flagged as a potentially altered execution, not silently normalized.
4. With absent/failed plan linkage, duration within ±60 seconds of 300 and matching time produce only a **low-confidence possible match**. An unrelated run can satisfy this heuristic.
5. More than one candidate is **ambiguous**, even if one has stronger evidence. No automatic winner is chosen. No candidates remains inconclusive, including delayed sync, limited access, missing data or starts outside the window.
6. A single candidate is always **possible match**, never exact session confirmation or proof each planned interval was executed. Reusing the plan ID prevents unique-session inference. Workout UUIDs deduplicate the list, and refresh replaces rather than appends results. No actual workout is modified.

## Joint physical test

1. On this branch, run `npx eas-cli@latest build --platform ios --profile development`, install the new build and connect to `npm start`. Remove the previous scheduled fixture explicitly, refresh, then send a new two-second schedule. The M3 reference uses that requested schedule date, not the future HealthKit query time.
2. Within 15 minutes, open the scheduled VORUNO workout on Watch, perform/save the test and wait for it to appear in Health/Fitness on iPhone. Request read access in the PoC if needed, then refresh the run list.
3. Open details. Inspect whether laps/segments actually appear, their recorded durations, distance by minute and coverage/estimate labels. Compare locally against Fitness, accounting for pauses and elapsed versus active time. Do not upload health screenshots, samples or actual timestamps.
4. Inspect M3's plan result: same test ID / other plan / not returned / failed. Report that category, candidate outcome and whether the selected run is the one actually performed. This establishes what the tested OS/device exposes; a unit test does not.
5. Refresh repeatedly: no duplicates. Clear/background while a detail read is pending: late results must not reappear. Return and query explicitly again; no automatic permission or health read.
6. Test an ordinary unrelated run, two candidate runs in the same ±15-minute window, and an altered/paused/skipped-step execution. Multiple plausible candidates must remain ambiguous. A matching ID is not proof of exact duration or step completion. A run starting outside the window will not be chosen even if its plan ID matches.
7. Test delayed sync, unavailable distance/HR and denied read access; none should become a zero-filled success. Remove/re-add the scheduled fixture and observe whether recorded plan linkage persists. After restart with the schedule removed, expect no reference context rather than invented history.
8. Record only non-sensitive pass/partial/fail, OS/build environment, event presence, estimates/coverage availability, plan-link category and correlation outcome. M2 detail and M3 physical acceptance remain pending until these observations; M4 is not started.

## Local verification

34 synthetic tests pass, including sample allocation/conservation, gaps, overlaps, real-zero preservation, detail bounds, plan lookup failures, fixed ID contract, unrelated/different-plan exclusion, altered duration, ambiguous candidates and repeat-query deduplication. Typecheck, lint, Expo Doctor 21/21, dependency check and iOS Metro export pass after the patch alignment. No real health fixtures are committed. These establish packaging only; native method behavior and screen usability must still be tested on the phone. npm still reports 30 advisories (20 high, 10 moderate), as previously documented; no forced incompatible fix was applied.
