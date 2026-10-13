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

## Development loop on Windows
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
