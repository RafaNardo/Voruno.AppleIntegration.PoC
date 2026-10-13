# Apple integration — risk register, decisions and findings

**All experiments pending; no native build or device validation has yet been performed in this repository.**

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
