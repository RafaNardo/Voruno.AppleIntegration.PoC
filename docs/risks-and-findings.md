# Apple integration — risk register, decisions and findings

**M0 local foundation checks pass; cloud/native build and physical-device acceptance are pending. M1–M4 have not started.**

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
