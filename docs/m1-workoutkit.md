# M1 — WorkoutKit short-delay scheduling experiment

Status: owner reports scheduling working on Watch with both the earlier five-minute delay and a two-second delay. Unscheduled preview export did not produce a visible workout despite Apple's confirmation. Scheduling is now the primary UI flow; the preview bridge is retained for historical experiment compatibility but is not exposed on the screen. Exact steps, device/build fields and remaining M1 cases still need evidence. M2 is not implemented.

## Current approach and identity decision

Use the scheduling controls directly: request authorization, then **Enviar ao Watch · agendar em ~2 s**. Keep exact native scheduler read-back separate from manual Watch visibility. Repeated sends preserve an existing fixture; remove it explicitly and refresh before sending at another time. There is no automatic remove-and-add or random new ID on each tap.

For a future app, the proposed identity is one ID per planned session, stable across retries/rescheduling, with a new ID for a distinct session. This is a design proposal, not implemented session storage. M2/M3 must test whether any reliable relationship exists between `WorkoutPlan.id` and an actual HealthKit workout; [HKObject.uuid](https://developer.apple.com/documentation/healthkit/hkobject/uuid) identifies the recorded HealthKit object, and equality with the plan ID must not be assumed. Removing a scheduler entry is not a HealthKit deletion API, but losing schedule context may affect later matching. Preserve plan/revision/history before considering automated replacement in a production app.

The app now configures a simple opaque 1024×1024 PoC V icon (`assets/icon.png`, editable SVG source alongside it). [Apple's WorkoutKit overview](https://developer.apple.com/documentation/workoutkit) says the scheduled area uses the app's icon and name. The consulted custom-workout API has no per-workout custom-image parameter. A fresh EAS binary and Watch inspection must validate icon propagation; no watchOS target is added.

## Historical experiment: send without scheduling (2026-10-13)

The following describes the previous revision, no longer the selected UI flow. Owner reported Apple's added-to-Watch confirmation but could not find the workout. Do not repeat this checklist as the primary acceptance path.

The primary button now opens Apple's iPhone preview via [`workoutPreview(_:isPresented:)`](https://developer.apple.com/documentation/swiftui/view/workoutpreview(_:ispresented:)), available from iOS 17. The user chooses **Add to Watch** in Apple's UI, with no scheduled date. Apple describes this export flow in [WWDC23, preview section](https://developer.apple.com/videos/play/wwdc2023/10016/?time=660); the current official sample's `PresentPreviewDemo.swift` uses this SwiftUI modifier. UIKit hosts that SwiftUI view over the Expo app. The flow does not call `schedule` or require WorkoutScheduler authorization. It does not start a running workout automatically, and no immediate sync-time guarantee is claimed.

Do not call [`openInWorkoutApp()`](https://developer.apple.com/documentation/workoutkit/workoutplan/openinworkoutapp()) from iOS: the official symbol's availability metadata lists watchOS and macOS, not iOS. Its name alone is not proof of iPhone availability. No watchOS target is added.

The preview modifier takes a plan and presentation binding, with **no documented save result, delivery receipt or saved-on-Watch query**. Dismissal can mean saved or canceled; both return `preview-closed` with verification `not-observable`. The app discards any supposed success flag and asks for manual observation. A canceled preview must never turn green as an integration success. Existing scheduled entries neither prove nor disprove preview export; the two paths are distinct. Removing a schedule does not delete an unscheduled workout saved by the user.

The optional scheduling panel retains M1's earlier experiment. After scheduling, native code re-reads the OS list up to three times, 500 ms apart, comparing the full `WorkoutPlan` and normalized requested date. It reports `scheduler-match`, `not-listed`, or `scheduler-mismatch`; even an exact match confirms only the scheduler list, **not Watch receipt**. An old M1 binary without this verification field remains `unknown`, and an old binary without the preview method explicitly requests a rebuild.

Device checks for this revision:

1. Build/install the new EAS binary. Tap **Enviar agora · Adicionar ao Watch**, then use Apple's **Add to Watch** action. No scheduler authorization or schedule should be created by this action.
2. Close Apple's preview, then tap **Voltar à PoC** on the host screen and inspect the returned verification limitation. The host intentionally stays open after Apple's preview closes. Open Apple's Workout app on Watch, check the custom workout options for Outdoor Run for **VORUNO TEST ONLY 2x1m**, inspect all five minutes of steps and record the separate manual observation. Also record any Apple confirmation text separately; it is not an app-observed delivery receipt.
3. Repeat but **cancel** the Apple preview; expect the same inconclusive dismissal state, never a success claim. Test the old M1 binary to confirm the rebuild message.
4. With Watch offline/unpaired as feasible, record the actual Apple UI response and whether export becomes visible after reconnection. No simulated receipt or timeout success.
5. Expand the optional scheduling panel to test automatic read-back independently. An earlier identical plan/date in the scheduler cannot confirm an unscheduled export. Do not automatically remove the owner's existing scheduled fixture when opening the preview.

## Entry evidence

The owner reported iPhone iOS **26.6.1** and a working development-mode app with refresh, in response to the M0 physical-build gate question. This is owner-reported evidence, not an agent-observed test. iPhone model, EAS build ID/resolved environment, Apple Watch model and watchOS are still pending. The Watch was discharged when M1 began; that is not evidence of unsupported hardware.

## Research before Swift implementation

Official Apple symbol pages (including their Markdown availability metadata) were consulted before writing signatures:

| Decision / API | Source and limit |
|---|---|
| iOS 17.0 / watchOS 10.0 API baseline | [WorkoutScheduler](https://developer.apple.com/documentation/workoutkit/workoutscheduler). The module and app now target iOS 17.0. This is API availability, not proof that the owner's paired devices support scheduling. |
| Real runtime support | [isSupported](https://developer.apple.com/documentation/workoutkit/workoutscheduler/issupported); simulator is explicitly unsupported by this PoC. Support does not imply connection, authorization or Watch receipt. |
| Real scheduling permission | [requestAuthorization](https://developer.apple.com/documentation/workoutkit/workoutscheduler/requestauthorization()) and [authorizationState](https://developer.apple.com/documentation/workoutkit/workoutscheduler/authorizationstate-swift.property). Preserve authorized, denied, restricted, not-determined and unknown separately. No HealthKit read authorization is inferred. |
| Fixed interval composition | [CustomWorkout](https://developer.apple.com/documentation/workoutkit/customworkout), [WorkoutStep](https://developer.apple.com/documentation/workoutkit/workoutstep), [IntervalStep](https://developer.apple.com/documentation/workoutkit/intervalstep), [IntervalBlock](https://developer.apple.com/documentation/workoutkit/intervalblock), [WorkoutGoal](https://developer.apple.com/documentation/workoutkit/workoutgoal). Check running and time-goal support; no alerts. |
| Stable synthetic fixture identity | [WorkoutPlan](https://developer.apple.com/documentation/workoutkit/workoutplan), with an explicit UUID for this test plan. This is not a HealthKit activity identity. |
| Scheduling result | [schedule(_:at:)](https://developer.apple.com/documentation/workoutkit/workoutscheduler/schedule(_:at:)) is nonthrowing async with no receipt result. `submitted` means the call returned. Never fabricate a success Bool or Watch callback. |
| List, capacity, targeted removal | [scheduledWorkouts](https://developer.apple.com/documentation/workoutkit/workoutscheduler/scheduledworkouts), scheduler capacity and `remove(_:at:)`. Only entries matching this fixture UUID are exposed/removed. Never remove all plans or mark a workout complete. |

The current [Apple sample](https://developer.apple.com/documentation/workoutkit/customizing-workouts-with-workoutkit) includes newer swimming features and recommends iOS 18/watchOS 11 for that sample. Its downloaded project was inspected outside the repository: no entitlement file or HealthKit usage-description configuration was found; its planner uses WorkoutScheduler directly. M1 uses only the iOS 17 baseline APIs above. No HealthKit entitlement, HealthKit permission string or invented WorkoutKit entitlement is added. Importing HealthKit here supplies activity/location enums, not a HealthKit data store. This configuration still needs a real signed build and authorization test.

`ScheduledWorkoutPlan.complete` exists in the SDK, but M1 does not read it or infer execution/HealthKit correlation from it. No evidence yet proves a shared ID between WorkoutKit and HealthKit.

The local module was generated with [create-expo-module](https://docs.expo.dev/more/create-expo-module/) (`--local --platform apple --name VorunoApple --features AsyncFunction`) against installed Expo SDK 57, then reduced to iOS only. [Expo module APIs](https://docs.expo.dev/modules/module-api/) supply Promise bridging; OS operations run on the main actor. Expo's [SDK 57 app configuration](https://docs.expo.dev/versions/v57.0.0/config/app/) supplies `ios.deploymentTarget`, so no custom config plugin/manual generated-project edit is needed. The podspec links WorkoutKit and HealthKit. Generated template MIT license is retained; Apple's sample source is not vendored. No HealthKit library was selected: that evaluation belongs to M2.

## Exact test input and result semantics

- Name: **VORUNO TEST ONLY 2x1m**, outdoor running, total **5 minutes**.
- Warmup: 60 seconds. Block repeated twice: work 60 seconds, recovery 30 seconds. Cooldown: 60 seconds. No pace/HR goal and no recorded activity fixture.
- Date: native current time plus two seconds, preserving seconds and dropping only fractional seconds in the current local calendar/time zone (approximately one to two seconds ahead). Phone displays the returned date locally. No date supplied by JS is trusted or required. This is the requested schedule time, not a Watch delivery deadline or automatic workout start. Owner reports this short-delay approach working on Watch; exact read-back/date handling still requires captured results. The future-date guard remains; read-back mismatch remains explicit.
- Authorization is requested only by the authorization button; schedule always checks authorization again.
- Native mutations are serialized across async suspension. Before scheduling, the native scheduler list is checked for the fixed fixture UUID and capacity. An existing fixture produces `already-scheduled` without a new call; remove it explicitly before changing its scheduled date.
- A restart re-queries the OS list instead of restoring a success flag from JS storage. List absence after bounded read-back is possible; `submitted` with `not-listed` remains inconclusive. Deduplication relies on what the OS list currently exposes and is not an exactly-once guarantee across list lag/restarts.
- Removal only requests removal of listed entries with the fixture UUID. It returns `removal-requested` plus a fresh count; it does not claim removal from the Watch.
- Manual Watch observations are separate, explicitly owner-reported, in-memory and reset on an action/restart. A matching name and all steps must be inspected. No health query, console telemetry or persisted activity data is added.
- An old M0 binary or Expo Go opens with a rebuild message and unknown capability instead of throwing for a missing module. Native/invalid-response errors expose fixed codes/messages only. A call whose response is lost stays `unknown`; refresh before retrying.

## Owner build and physical acceptance

1. On this branch, use the linked EAS project/registered phone from M0. Run `npx eas-cli@latest build --platform ios --profile development`. The image remains `macos-tahoe-26.5-xcode-26.6`. Record the actual resolved image/Xcode and new build ID. **Fast Refresh cannot add this Swift module to the M0 binary.**
2. Install the new binary on the iPhone, run `npm start`, and connect to Metro. If it still says module missing, confirm that the new binary, not Expo Go or the M0 build, is open.
3. Charge/pair the Apple Watch and record its model/watchOS plus iPhone model. Refresh OS state. Do not treat iOS version alone as support evidence.
4. Tap **Request WorkoutKit authorization**. Observe the actual Apple dialog and returned status. If denied/restricted/unsupported, record the code and stop scheduling. Investigate settings/pairing/provisioning with sanitized evidence; do not infer HealthKit permission.
5. Inspect the fixed test steps, then tap **Enviar ao Watch · agendar em ~2 s** once. Record the action status, exact read-back result and scheduler count separately. Open Apple's native Workout app on the Watch; verify the app icon, exact name and each interval. Record visible/not visible using the separate manual observation controls. No execution is required to prove M1 scheduling.
6. Tap schedule again: if the fixture is listed, expect `already-scheduled`, without a new entry. Close/reopen the app and refresh; state must come from the OS. Test background/foreground after changing authorization in Settings if available.
7. Tap **Remove this test fixture only** and refresh. Observe Watch removal separately. Then test scheduling while the Watch is offline and after reconnecting: phone submission must never become automatic Watch receipt.
8. Capture only sanitized results: commit/build ID, hardware/OS, authorization enum, capability, action code, fixture count, whether the fixed steps were visible and any sanitized compiler error. Do not upload health records, UDIDs, provisioning material, account identities or personal workout timestamps.

M1 remains **partial** until the signed build compiles, a real scheduling call returns and the owner verifies the structured test workout on the Watch. A cloud compiler/signing failure or an unsupported SDK/device response is evidence to investigate, not a reason to introduce a Watch app. M2/M3 remain out of scope.

## Local checks and limits

`npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`, `npx expo install --check`, `npm run export:ios`, `npx expo config --type introspect --json`, and `npx expo-modules-autolinking resolve --platform apple --json` are available on Windows. Tests cover the TypeScript boundary, not Apple's framework implementation. The app config introspection resolves the iOS 17.0 pod property and no entitlements; autolinking discovers `VorunoAppleModule`.

`npx expo prebuild --platform ios --no-install` was attempted on Windows and refused by this Expo CLI with guidance to generate iOS on macOS/Linux. No native project or CocoaPods/Swift compilation result is claimed. EAS must perform native prebuild and compilation; macOS/Xcode may be needed if native debugging is required.
