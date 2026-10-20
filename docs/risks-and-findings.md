# Apple integration — risk register, decisions and findings

**Owner reports M1 scheduling and M2 summary reading working on Apple Watch SE/watchOS 26.6 with iPhone iOS 26.6.1. On 2026-10-19 the owner authorized expanded M2 details and M3 together. Their implementation awaits joint physical validation; M4 has not started.**

## Open risks
| ID | Severity | Risk / unknown | Validation |
|---|---|---|---|
| A01 | Critical | WorkoutKit availability and exact capability for structured scheduling via iPhone | M1 API research + physical Watch test |
| A02 | High | EAS dev build native Swift modules and native entitlements on Windows-only development | M0/M1 cloud build |
| A03 | High | Workout app does not expose reliable delivery/receipt or execution identity | M1/M3 record observability |
| A04 | High | HealthKit read-authorization privacy semantics mean true permission status is unknowable | M2 empty/denied behavior |
| A05 | High | WorkoutKit ↔ HealthKit matching has no guaranteed shared identifier | M3 ambiguity tests |
| A06 | Medium | iOS/watchOS OS minimums, Xcode build image and provisioning compatibility | M0/M1 environment matrix |
| A07 | Medium | Background HealthKit sync and Watch-to-iPhone delay | M2 delayed results |
| A08 | Medium | Library compatibility with selected Expo SDK / RN new architecture | M2 dependency evaluation |
| A09 | Medium | Public repository may leak actual health data or signing material | privacy review per PR |
| A10 | Medium | Installing/debugging additional watchOS target without local Mac may be impractical | Only reassess if native Workout app approach fails |
| A11 | High | SDK 57 dependency audit reports unresolved transitive advisories | Track compatible upstream fixes; see M0 findings below |

## Locked decisions
- No proprietary watchOS app in the initial spike.
- WorkoutKit first, HealthKit second, correlation last.
- Development on Windows, EAS iOS development builds; physical iPhone and Apple Watch.
- Test-only hard-coded interval fixture; no backend and no production app implementation.
- Do not infer Watch delivery from successful scheduling nor read permission from empty HealthKit samples.

## Findings template (append, do not rewrite history)
### YYYY-MM-DD — [experiment]
- Status: pending / tested / blocked
- Hardware / OS:
- Native library / APIs:
- Repro:
- Observation:
- Evidence ref (no PHI):
- Limitations:
- Decision and next action:

## Go/no-go rubric
- **GO:** real Watch app scheduling and real HealthKit import both demonstrated; limitations and correlation strategy understood.
- **CONDITIONAL GO:** one integration works but important behaviors require platform or UX mitigation; plan/risks explicit.
- **NO-GO:** critical user experience cannot be delivered with acceptable security, reliability or feasible tooling.

### 2026-10-12 — M0 development foundation (Windows)

- Status: **partial**. Implementation and local checks completed; no EAS build, installed binary or physical acceptance evidence. M1 remains gated on the owner's iPhone validation.
- Environment: Windows; Node 22.18.0; npm 10.9.3. `create-expo-app@latest --template default --no-install` selected the SDK 57 template. Retained its compatible core versions and installed development client/tooling with `npx expo install`; committed npm lockfile.
- Exact installed versions: Expo 57.0.28, Expo Router 57.0.26, expo-dev-client 57.0.20, React 19.2.3, React Native 0.86.3, TypeScript 6.0.3. `expo-doctor` 1.20.4.
- Dependency finding: removing template peer dependencies let npm select incompatible React DOM/worklets versions. Resolved by explicitly installing Expo-selected React DOM, web, gesture handler, Reanimated and worklets versions. No `--force` or `--legacy-peer-deps` used. These dependencies do not add Android/web product scope.
- Configuration: physical-device internal development profile; project-specific bundle ID `com.rafanardo.voruno.appleintegration.poc` (Apple registration/availability unverified). Selected image `macos-tahoe-26.5-xcode-26.6`, listed by [Expo infrastructure](https://docs.expo.dev/build-reference/infrastructure/) for SDK 57, Xcode 26.6. Actual EAS image/Xcode/build ID: **pending owner build**. Deployment target stays at SDK defaults; no WorkoutKit availability claim.
- iPhone model/iOS: **not supplied, not tested**. Apple Watch model/watchOS: **not supplied, not tested**. No Apple framework APIs, permissions, HealthKit entitlements, watchOS target or sensitive signing configuration added.
- Implementation evidence: `src/app/index.tsx` is the sole test screen; two separate typed ports return `not-implemented`. Capability is unknown; reads do not manufacture an empty query result. Future controls are disabled. On-screen diagnostics only include versions, platform and fixed capability states; errors are replaced with a fixed safe message and source logging is lint-prohibited.
- Local reproduction/results: `npm install` and clean `npm ci` succeeded; `npm run typecheck`, `npm run lint`, `npm test` (2 passing tests), `npx expo install --check`, `npx expo-doctor` (21/21), `npm run export:ios`, `npx expo config --type public`, and `git diff --check` passed. Bundle generation proves JavaScript/Metro resolution, **not native compilation or on-device behavior**. CI is configured separately; its hosted result must be checked on the PR.
- Audit: `npm audit fix` applied compatible transitive updates but exits 1 with **28 findings (18 high, 10 moderate)** remaining. Root advisories include `braces`, `decode-uri-component`, `node-forge`, and `uuid`; totals include dependents. npm suggests incompatible changes (including Expo 44 and Router 58); these were not applied. No claim that the dependency tree is vulnerability-free. Re-evaluate upstream compatible fixes before expanding the experiment; do not process untrusted workout/URL inputs in M0.
- Limitations: no physical UI/layout observation, signing, installation, phone Metro connectivity or Fast Refresh verified. No health records or identifiers collected. No M1/M2 native API evidence or HealthKit library evaluation is claimed.
- Hosted CI: [first M0 workflow run](https://github.com/RafaNardo/Voruno.AppleIntegration.PoC/actions/runs/38333542141) could not start. GitHub's check annotation says the account is locked due to a billing issue. This is a runner/account blocker, not a test result; owner must resolve the GitHub billing issue and rerun CI. Local checks above are the available verification evidence.
- Next experiment: owner follows [M0 owner checklist](setup-windows-ios.md#m0-owner-checklist), registers iPhone, builds/installs through EAS and reports sanitized environment plus Metro/Fast Refresh observations using the testing template. Only that confirmation unlocks M1 research/implementation. No go/no-go conclusion about Apple integration yet.

### 2026-10-12 — M0 owner report and M1 implementation

- Status: **partial, physical M1 acceptance pending**. Owner supplied iPhone iOS **26.6.1** and confirmed development mode with refresh in response to the gate question. M1 entry accepted on this report, not an agent-observed phone test. iPhone model and M0 build ID/actual Xcode image remain unspecified. Watch was discharged; model/watchOS pending. No Watch capability inferred.
- Scope: a local Expo Swift module, real WorkoutScheduler authorization/support/list/schedule/remove APIs, five-minute fixed **TEST ONLY** running fixture, separate TS port and safe test UI. No watchOS app, backend, HealthKit query, activity fixtures or M2 dependency selection.
- Research: official Apple declarations/availability metadata and downloaded sample inspected before Swift implementation. [Full research and exact API/source map](m1-workoutkit.md#research-before-swift-implementation). Uses iOS 17.0/watchOS 10.0 baseline APIs; real device support remains runtime-dependent. Current Apple's broader sample requires newer OS versions for its newer features.
- Native config: `ios.deploymentTarget = 17.0`, iOS-only local pod linking WorkoutKit/HealthKit (enum use only), no extra entitlements or HealthKit usage descriptions based on the inspected scheduling sample. EAS image remains `macos-tahoe-26.5-xcode-26.6`; actual M1 image/Xcode/build ID are pending. Native module template matches installed Expo 57; package versions/lockfile unchanged from M0, including known audit risks.
- Proven locally: TypeScript, ESLint, nine tests, Expo Doctor 21/21, Expo compatibility check, iOS Metro export. Autolinking resolves `VorunoAppleModule`; config introspection produces the iOS 17.0 pod property and empty entitlements. No private health/device/signing data collected or committed.
- Native limitation: `npx expo prebuild --platform ios --no-install` exits 1 on this Windows host, explicitly requiring macOS/Linux for iOS generation. No Swift compiler is available here. Autolinking/config/bundling tests are **not** native compilation. EAS must validate the Swift bridge and signing. Prior GitHub CI billing blocker is recorded above; hosted checks are not substituted for hardware evidence.
- Observability: returned schedule call is `submitted`, queried list count is separate, owner Watch inspection is separate. `ScheduledWorkoutPlan.complete` exists but is unused; it is not HealthKit import/correlation evidence. Duplicate guard relies on the native list and is not an exactly-once guarantee across OS list lag. Removal never touches plans outside the synthetic fixture UUID.
- Next action: build/install the M1 binary, charge/pair Watch and supply model/watchOS, request actual permission, schedule the fixture and compare every step in Apple's native Workout app. Execute restart/duplicate/offline/removal cases from [M1 checklist](m1-workoutkit.md). Do not mark M1 complete or start M2 before actual results.

### 2026-10-12 — EAS project linkage repair

- Owner's build command stopped at `EAS project not configured`, before native compilation. Locally, no `.env` or `EAS_PROJECT_ID` was present; the dynamic config therefore omitted `extra.eas.projectId`.
- EAS CLI 24.13.0 found an existing project for this app's slug. Added its public project UUID as the config default, retaining the optional environment override. This is project metadata, not Apple signing information. No new project or credentials were created.
- This repairs project discovery only. Native build, provisioning and Watch acceptance remain pending; prior development-mode/refresh reports do not substitute for a successful M1 signed build.

### 2026-10-13 — Unscheduled export and verification boundaries

- Owner reports “funcionou” after the EAS linkage repair and requests immediate export without scheduling plus an integration check. Record this as a working-version report, not independent proof of exact Watch contents; model/watchOS/build ID still not supplied.
- Official Apple symbol metadata confirms `openInWorkoutApp()` is not an iOS API. Implemented the documented iOS 17+ SwiftUI `workoutPreview` flow instead: user selects Add to Watch in Apple's preview, with no date and no call to WorkoutScheduler.schedule. Scheduling remains an optional experiment. [Sources, decisions and device checklist](m1-workoutkit.md#send-without-scheduling-2026-10-13).
- Verification constraint: no documented callback distinguishes preview saving from cancellation, nor a query confirming these unscheduled workouts on Watch. The app returns `preview-closed` / `not-observable`, requiring separate visual observation. It does not silently infer success from dismissal, app foregrounding or existing scheduler entries.
- Scheduling verification strengthened: after a returned schedule call, up to three native list queries (500 ms apart) compare the exact WorkoutPlan and requested date. Match/missing/mismatch are explicit and none establish Watch receipt or execution. Native waiting is bounded between queries; OS call latency itself is not controlled by the app.
- HealthKit reading, watchOS targets and remote logs remain absent. This SwiftUI revision needs a new signed build; Windows tests/bundling cannot establish Swift compilation or physical behavior. Tests cover cancellation/no fabricated receipt, old native binaries and read-back mapping. M1 is still partial; M2 remains gated.

### 2026-10-13 — Short schedule correction and preview lifecycle review

- Status: **partial**. Owner reports the five-minute scheduling path continues to show the workout on Watch. For unscheduled export, Apple's UI displayed “Exercício adicionado ao Apple Watch”, but the owner could not find the workout on Watch. Record the system message and missing visual observation separately; no successful unscheduled delivery is claimed. iPhone iOS 26.6.1; Watch model/watchOS and exact build environment remain pending.
- Owner changed the scheduling delay to 30 seconds and paused the build for this correction. The old minute truncation could move that proposed date into the past (12:00:10 + 30 seconds became 12:00:00). Preserve seconds, discard only nanoseconds, retain the future-date guard and exact scheduler read-back. Update the button to describe the actual delay. Apple honoring second-level scheduling is not proven; this does not promise delivery or automatic start within 30 seconds.
- Reviewed Apple's documented `workoutPreview` API and the official sample's `PresentPreviewDemo.swift`. The API choice matches the sample. Removed the PoC's automatic dismissal of the hosting controller when the preview binding becomes false; the host now stays alive until **Voltar à PoC**. This avoids overlapping parent/child dismissal and follows the sample's persistent-host pattern. It is a preventive lifecycle adjustment, **not a proven explanation or fix for missing Watch visibility**. No extra send call, retry, permission or success inference is added.
- Next device experiment: install a fresh native binary; remove the previous scheduled fixture explicitly and confirm it is no longer listed before testing the new 30-second schedule (otherwise the duplicate guard returns `already-scheduled`). Separately test Add to Watch, close Apple's preview, return via **Voltar à PoC**, and inspect the Outdoor Run custom workout options as well as the scheduled area. Record confirmation text and actual visibility independently. Repeat preview cancellation and reopening to verify the host closes cleanly and the PoC controls become available again. No M2 work is started.
- Local validation: `npm run typecheck`, `npm run lint`, `npm test` (12 passing tests) and `git diff --check` passed. These checks do not execute Swift or establish Watch delivery. Native compilation and both revised flows require the owner's new EAS build and physical-device checks.

### 2026-10-13 — Owner validates two-second scheduling; selected PoC approach

- Owner changed the native delay to two seconds and reports it worked. Preserved that change and made scheduling the primary UI, removing the unscheduled-preview controls from the screen. The native preview bridge remains available for historical compatibility; it is no longer the selected experiment. The reported success is device-owner evidence, not an independently observed timing guarantee or complete M1 acceptance. Watch model/watchOS, build ID and exact step/read-back evidence remain pending.
- No automatic replacement or new UUID per send is introduced. The fixed PoC fixture still rejects duplicate scheduling; removal remains explicit and restricted to its synthetic UUID. Proposed future policy: one stable ID per planned session and a new ID per distinct session, with retained revision/history for reconciliation. No persistence/backend or M2 code is introduced.
- HealthKit boundary: scheduler removal manages a planned entry, not deletion of a recorded HealthKit workout. No supported shared identifier was established by this review; do not assume `WorkoutPlan.id == HKWorkout.uuid`. M2/M3 must compare actual recorded activity and test rescheduling/repetition before deciding production matching behavior. Record import and planned-session matching are separate concerns.
- Added an original simple V icon for the PoC, opaque 1024×1024 PNG with SVG source, configured through Expo's `icon` field. Apple's [WorkoutKit overview](https://developer.apple.com/documentation/workoutkit) documents the app icon/name in the scheduled-workout area. No per-workout custom-image parameter was found in the consulted API. New EAS build/install and Watch inspection are required to verify the icon; no Watch extension is added.
- Local validation: typecheck, lint, 12 tests, Expo Doctor 21/21, iOS Metro export, public Expo config (icon path present) and diff whitespace check passed. The generated icon was visually inspected. These do not compile Swift or validate the icon on Watch. Physical next step: rebuild/install for the icon, inspect the scheduled card and exact interval steps, then record duplicate/restart/offline/removal results before completing M1.

### 2026-10-13 — M2 authorized and read adapter implemented

- Status: **partial; native compilation and physical HealthKit reading pending**. Owner explicitly asked to begin M2 after reporting two-second scheduling working, and supplied Apple Watch **SE / watchOS 26.6**. iPhone iOS **26.6.1** remains the reported OS; iPhone model/Watch generation and actual EAS build fields are pending. The transition is authorized; untested M1 acceptance cases are not retroactively passed.
- Evaluated/selected maintained MIT library `@kingstinct/react-native-healthkit` **16.2.0**, matching MIT core **16.2.0**, Nitro **0.37.1** (MIT), installed with `npx expo install`. Published peer ranges accept React 19.2.3 / RN 0.86.3 / Expo 57.0.28's installed stack; native compilation is unproven. No custom HealthKit Swift adapter or Watch target added. [API, licensing, version evaluation and limitations](m2-healthkit.md#library-evaluation-and-native-configuration).
- Read-only plugin configuration introspects to HealthKit entitlement + localized read purpose, with no write-purpose string or background-delivery entitlement. Explicit authorization requests share nothing and read only workouts/distance plus opt-in HR. Completion never becomes a read-granted state. Failed query and successful empty query are distinct.
- Query and screen: last 14 days, up to 20 running workouts, real source/start/end/recorded duration, optional metres and average bpm from workout statistics. Fixed allowlist excludes raw metadata/device IDs/routes. Memory-only results clear on background/unmount/manual clear, including late query protection. UUID deduplication is local to the query; no plan matching or persistent import is claimed.
- Research correction for future M3: Apple documents optional async/throwing `HKWorkout.workoutPlan` (iOS 17+) and the selected library exposes `getWorkoutPlan()`. This provides a concrete API to test, unlike the earlier review which had not identified one. It does not establish ID equality with HKWorkout.uuid or presence on actual recorded runs. Not called in M2.
- Local evidence: typecheck, lint, 20 synthetic tests, Expo Doctor 21/21, `expo install --check`, iOS Metro export, config introspection, HealthKit/core/Nitro iOS autolinking and `git diff --check` passed. Initial autolinking output parsing without `--json` failed; rerunning with the documented flag succeeded. No native compiler/signing/device result claimed.
- Dependency audit: 30 findings (20 high/10 moderate). Two additional affected package entries are HealthKit/core through existing React Native dependency advisories; no new own-code advisory identified for those libraries. Incompatible downgrade suggested by npm was not applied.
- Next action: owner builds/installs with EAS, completes the real read prompt, records/saves a Watch run and compares the locally returned activity. Follow [M2 physical acceptance](m2-healthkit.md#owner-build-and-physical-acceptance), including denied/empty/optional metrics/repeated refresh/background/relaunch cases. No health exports or private screenshots requested. M3 remains gated.
- Hosted CI for [M2 PR #4](https://github.com/RafaNardo/Voruno.AppleIntegration.PoC/pull/4): [run 38427166482](https://github.com/RafaNardo/Voruno.AppleIntegration.PoC/actions/runs/38427166482) could not start any steps. GitHub's annotation again reports the account locked due to a billing issue. This is an account/runner blocker; it does not invalidate or substitute for the local checks above. Owner must resolve GitHub billing and rerun CI.

### 2026-10-19 — Expanded M2 details and M3, authorized for joint testing

- Owner reported M2 summary reading working, requested per-stage/minute data, then explicitly authorized expanded M2 and M3 together. This is not a claim that every prior physical acceptance case passed. Known owner-reported hardware remains iPhone iOS 26.6.1 and Apple Watch SE/watchOS 26.6; exact build environment and missing models remain pending.
- M2 detail query re-fetches the selected running workout and reads only its associated distance samples plus recorded events. Displays elapsed-minute distances and actual event durations; proportional allocation is explicitly estimated, gaps remain missing, overlaps are withheld, truncation/invalid samples are surfaced. Limits: 4 hours, 2,000 distance samples and 200 events. No GPS, raw HR, arbitrary metadata or planned-stage labels are added. Condensed quantity series are not expanded; exact Fitness splits are not claimed.
- M3 now calls the documented optional `HKWorkout.workoutPlan` via the existing library. Available/absent/failed are distinct. Known fixture ID plus native schedule time supplies reference; matching plan ID strengthens evidence but cannot identify a unique execution because this PoC reuses the ID. Time/duration-only candidates have low confidence; more than one candidate stays ambiguous. All results are possible matches, with no automatic association, overwrite or persistent health storage.
- Schedule reference is in-memory, recovered only from one listed fixture after restart, retained if removed in the same session and replaced on rescheduling. No historical schedule is invented. Tests verify native/TS fixture identity agrees and duplicates do not inflate candidates. [Exact rules and combined owner checklist](m3-correlation.md).
- Final Expo checks initially flagged four patch mismatches. Applied only Expo-selected fixes with `npx expo install --fix`: Expo 57.0.30, constants 57.0.22, linking 57.0.13, router 57.0.28; RN/HealthKit/Nitro unchanged. This revises the initial JS-only delivery expectation: owner should install a new EAS build to align native patches. No signing material or native API configuration changed.
- Local checks after alignment: typecheck, lint, 34 synthetic tests, Expo Doctor 21/21, dependency check, iOS Metro export and diff whitespace check passed. Audit remains 30 findings (20 high/10 moderate). Real event availability, distance resolution, plan linkage, ambiguity cases and revised native build behavior remain unvalidated on hardware. No M4 recommendation yet.

### 2026-10-19 — Pace/cadence and clearer history

- Added read-only running-speed and step-count requests and bounded queries associated with the selected workout. Pace converts arithmetic mean speed samples; cadence derives from allocated steps with complete temporal coverage. Missing/overlapping/truncated/invalid data is withheld, with quality notes; zero speed never becomes infinite pace. GPS remains deferred as agreed.
- Reorganized history into dated cards with large km/duration/HR metrics, collapsible plan/source evidence, minute/event tabs and incremental rows. Scheduling and diagnostics are collapsed below the history. No production navigation/backend introduced.
- Uses existing native APIs/dependencies; this revision needs JS reload and a renewed authorization request for the added types, not a new native build on the working M2/M3 binary. Device readability, actual speed/step availability and metric comparisons remain owner checks. See the [updated method and checklist](m3-correlation.md#pacecadence-and-readability-revision).
- Validation: typecheck, lint, 38 synthetic tests, iOS Metro export and diff whitespace check passed. Added checks for workout-scoped speed/step queries, unit conversion, zero/missing/overlapping values, duplicate samples and partial final minutes. No on-device UI inspection or metric observation claimed.
