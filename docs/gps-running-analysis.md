# GPS and running analysis experiment

Status: implemented, physical acceptance pending. Owner explicitly authorized GPS and additional running data. This extends M2 inspection; it does not complete M3 matching or produce an automated coaching verdict.

## Data and interpretation

| Data | Method | Limit |
| --- | --- | --- |
| Route | Selected workout's `getWorkoutRoutes()`; local north-up drawing | No street tiles, network or location recording; missing route is not denied permission |
| Altitude | Route locations with valid vertical accuracy <=30 m; profile and extrema | Simplified profile, not cumulative ascent; measurement noise remains |
| Power, stride length, ground contact time, vertical oscillation | Workout `getStatistic` average/minimum/maximum in W, m, ms, cm | Only actual returned values; may be absent |
| Active energy | Workout sum in kcal | Device estimate, not independently measured energy |
| Heart rate | Opt-in workout statistics + associated samples | Request completion does not prove read access |
| Minute HR/power | Arithmetic mean of distinct associated samples intersecting each elapsed minute | Not time-weighted; spanning samples can contribute to adjacent minutes; no interpolation or continuous coverage claim |
| Pace/cadence/distance/events | Existing bounded detail calculations | Elapsed time includes pauses; recorded events are not automatically planned steps |

All detail queries are explicit, read-only and limited to the selected recent running workout, up to four elapsed hours. Quantity series keep the existing 2,000-sample limit; invalid or truncated HR/power series are withheld, while independent summary statistics may remain available. Only allowlisted fields reach memory. Background/unmount clearing and stale-result protection also apply to route coordinates. No coordinates, samples or identifiers go to logs, disk, backend or map providers.

Route filtering rejects invalid coordinates/time and horizontal accuracy outside 0..50 m. It breaks lines at rejected points, gaps >30 seconds, nonincreasing timestamps, antimeridian crossings and separate native routes. JS processing stops after 20,000 locations, with a partial-result warning; rendering samples at most 500 points. Reduced geometry cannot represent every bend. The library fetches **all native route locations before JS filtering** and exposes no query cancellation/limit here. Thus the JS cap is not a native memory bound. Very large routes and foreground/background behavior need physical validation; production may need a bounded native adapter. Separate route samples are not merged or treated as a unique authoritative track.

## Evidence and environment

Uses existing MIT `@kingstinct/react-native-healthkit` 16.2.0/core 16.2.0 and Nitro 0.37.1. No dependency, native module, entitlement or config change. Inspected installed `WorkoutProxy.swift`, `WorkoutProxy.nitro.ts` and route/quantity types. The library scopes route and statistic queries to the workout.

Official references: [reading route data](https://developer.apple.com/documentation/healthkit/reading-route-data), [running power](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/runningpower), [ground contact time](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/runninggroundcontacttime), [stride length](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/runningstridelength), [vertical oscillation](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/runningverticaloscillation). Apple documents delayed/updated route data and running dynamics for supported outdoor recordings, including SE; actual fields on the owner's device remain unverified.

Environment: Expo 57.0.30, React Native 0.86.3, configured EAS image `macos-tahoe-26.5-xcode-26.6`, iOS target 17.0. Owner reports iPhone iOS 26.6.1, Watch SE/watchOS 26.6. Exact phone model, Watch generation and installed build ID remain unknown. Windows checks do not establish native execution or physical UI readability.

## Owner checklist

1. Reload the existing working M2/M3 development client. This change itself needs no EAS rebuild; older binaries lacking the existing HealthKit library still require one.
2. Open access/permissions, enable optional heart rate if wanted, and request access again. Review Apple's new route/running-metric read categories.
3. Save an outdoor run on Watch, wait for iPhone sync, query history and open **Detalhes completos e GPS**. Existing recent outdoor runs can also be used.
4. Compare route shape and altitude range locally with Fitness; inspect summary metrics, HR/power by minute, pace, cadence and events. Check which fields are actually available on this SE. Do not upload health screenshots or coordinates.
5. Test indoor/no-route workout, declined route/HR access, delayed route sync (close/reopen details), partial data and a longer run. Missing fields must stay absent, without crashing or reporting denial.
6. Background the app during loading and after display, then return: health results must remain cleared. Refresh repeatedly and check no duplicated activities or stale route display. Check layout with larger text.
7. Report only non-sensitive observations: categories available/missing, whether shape/units agree, delays and fixed error messages. Keep exact health values and route on-device.

To assess the whole prescribed workout, further evidence is needed: reliable execution-to-plan correlation, actual stage boundaries/targets, individual intensity references and missing-data criteria. The current screen supplies measurements and availability indicators for that feasibility decision, not an assessment of the athlete.
