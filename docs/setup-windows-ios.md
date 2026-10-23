# Windows → Expo Development Build → physical iPhone/Watch

## Prerequisites
- Node.js LTS, Git, package manager, Expo account, active paid Apple Developer Program, access to EAS Build.
- iPhone + paired Apple Watch (OS versions recorded in findings), connected to same network as Windows or Expo tunnel.
- Apple developer signing capabilities; private credentials must be handled by EAS/Apple secure services, never committed.
- No Mac required for day-to-day React Native UI/JS debugging; **Xcode/macOS may still be necessary for native debugging and certain Watch configurations**.

## Scaffold (Codex M0)
Use a compatible Expo TypeScript template and Expo Router. No version pin until scaffold. Commands below are a guide, to run only after initial scaffold:
```bash
npm install -g eas-cli
npx expo install expo-dev-client
eas login
eas build:configure
npx expo-doctor
```
Configure `app.config.ts` with **unique iOS bundleIdentifier**, HealthKit usage-description strings, entitlements/config plugin **only when real native integration added**, and iOS minimum deployment target from Apple API requirements. Do not commit secrets or Team ID. Choose EAS environment/Apple signing credentials through the CLI.

## Register test iPhone
For iOS development/ad hoc builds, register the physical device in EAS/Apple provisioning as required:
```bash
eas device:create
eas build --platform ios --profile development
```
This builds on a hosted Mac. Follow Apple Developer authentication and provisioning prompts. Install from the build link on the registered iPhone; trust profile/Developer Mode settings when iOS requests. Device enrollment and distribution flow can vary: inspect current official documentation.

## M0 owner checklist

This checklist describes the M0 screen. After moving to M1, use the [M1 build/Watch checklist](m1-workoutkit.md#owner-build-and-physical-acceptance); it requires a fresh native binary and raises the app minimum to iOS 17.0.

Run from the repository root in PowerShell. M0 uses SDK 57, an iOS-only development client, and bundle identifier `com.rafanardo.voruno.appleintegration.poc`. This is a project-specific identifier, not a verified Apple registration; confirm availability in your Apple account during provisioning. No signing material is committed.

1. Install dependencies with `npm ci`. Local verification used Node 22.18.0 / npm 10.9.3 on Windows.
2. Authenticate with `npx eas-cli@latest login`. This repository is already linked to its existing EAS project through a public UUID in `app.config.ts`; no `.env` is required. Run `npx eas-cli@latest project:info` to verify access. For a fork/different project only, create or select the project in your [Expo dashboard](https://expo.dev/accounts), then set `$env:EAS_PROJECT_ID = '<project UUID>'` (or use ignored `.env`) to override the default. Do not use an Apple Team ID or credentials as this value.
3. Run `npx eas-cli@latest device:create`. Open the registration link on your physical iPhone and follow the enrollment flow. Keep the UDID/private profile out of Git and public evidence.
4. Run `npx eas-cli@latest build --platform ios --profile development`. Complete Apple Developer authentication and provisioning with your paid account, selecting the registered phone. Use EAS-managed credentials. The profile requests a physical-device internal development build, not a simulator. No HealthKit entitlement or usage description is included in M0.
5. Install from the completed build link on that iPhone; enable Developer Mode if requested by iOS. Open **VORUNO Apple PoC**, not Expo Go.
6. Run `npm start` on Windows, keep the phone on the same LAN, and open the Metro URL from the development client. If blocked, check Windows firewall/LAN access; `npm start -- --tunnel` is a fallback and may prompt to install Expo's tunnel dependency.
7. Confirm the M0 screen and local diagnostics render, integrations say **not implemented**, and **Check implementation status** shows unknown capabilities without any Apple permission prompt. Scheduling/permission/read controls must stay disabled.
8. Temporarily change `Fast Refresh marker: M0-A` in `src/app/index.tsx` to `M0-B`, save, and verify the phone updates without rebuilding the binary. Revert the marker. Close/reopen the app and reconnect to Metro.
9. Record the sanitized evidence fields in `docs/testing.md`: iPhone model/iOS, commit, EAS build ID, resolved build image/Xcode, installation, Metro and Fast Refresh observations. Apple Watch model/watchOS can remain pending in M0; no Watch behavior is being tested yet. Send the result before M1 begins.

The selected EAS image is `macos-tahoe-26.5-xcode-26.6` (documented SDK 57 image; Xcode 26.6). This is configuration, **not a completed cloud build**. Capture the actual environment from **Spin up build environment** in the build log. Keep SDK defaults for the deployment target in M0; M1 must research Apple's API minimums before changing native configuration. Swift/native configuration changes require a new binary.

References checked for M0: [Expo scaffold](https://docs.expo.dev/more/create-expo/), [EAS infrastructure](https://docs.expo.dev/build-reference/infrastructure/), [internal distribution and device registration](https://docs.expo.dev/build/internal-distribution/). The scaffold and `expo install` selected package versions; `expo-doctor` verifies the resulting dependency set.

## Development loop on Windows

M2 adds native HealthKit/Nitro dependencies and a HealthKit entitlement. Follow the [M2 build/signing and real-run checklist](m2-healthkit.md#owner-build-and-physical-acceptance); a new development build is required even if the M1 app is already installed. Read permission is requested on the physical iPhone after installation, not by Expo/Metro.
```bash
npx expo start --dev-client
```
Open the installed development build and connect to Metro. Change TS/JS → Fast Refresh; change Swift/native module/Info.plist/entitlements/config plugin → rebuild with EAS. Read JS logs and remote debugger on Windows. Xcode Swift breakpoints are not available through Metro.

## Watch notes
For **WorkoutKit scheduling to the native Workout app**, first validate that a pure iPhone native module is enough. Do not create a watchOS extension/app automatically. If actual requirements force a watchOS target, record evidence and reassess cloud build support/need for Mac rather than invent a workaround.

## Troubleshooting checkpoints
- Installed Expo Go instead of custom development build → native module missing.
- Native module undefined → rebuild with module/plugin included and compatible native runtime.
- Failed EAS signing → inspect device registration, identifiers, Apple developer entitlements, certificates; never post certificates/logs with secrets.
- Swift compiler errors in EAS → save sanitized error + build environment; fix version/API mismatch, rebuild.
- Permission dialog absent → verify HealthKit entitlement, Info.plist strings and whether OS already prompted; do not equate absence with authorization.
- No Watch workout visible → confirm support/OS, app configuration, scheduling request outcome, timing and manual Watch inspection. 'submitted' is not receipt proof.
- Metro cannot connect → LAN/firewall/network, run with `--tunnel` if needed.
- Simulator behaves differently → use real iPhone/Watch for acceptance.

Official: https://docs.expo.dev/develop/development-builds/introduction/ ; https://docs.expo.dev/build/setup/ ; https://docs.expo.dev/build/internal-distribution/ ; https://docs.expo.dev/modules/overview/ .
