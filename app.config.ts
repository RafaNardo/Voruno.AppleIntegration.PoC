import type { ExpoConfig } from 'expo/config';

// Public EAS project UUID, not a signing credential or Apple Team ID.
const projectId = process.env.EAS_PROJECT_ID || '8dc3e79e-d2a8-4900-a5e1-d5fca450f162';

const config: ExpoConfig = {
  name: 'VORUNO Apple PoC',
  owner: 'rafanardo',
  slug: 'voruno-apple-integration-poc',
  version: '0.1.0',
  icon: './assets/icon.png',
  scheme: 'voruno-apple-poc',
  platforms: ['ios'],
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    deploymentTarget: '17.0',
    bundleIdentifier: 'com.rafanardo.voruno.appleintegration.poc',
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  plugins: ['expo-router', 'expo-dev-client', ['@kingstinct/react-native-healthkit', {
    NSHealthShareUsageDescription: 'A PoC VORUNO lê suas corridas, distância e, se você escolher, frequência cardíaca para validar a integração com o Apple Watch. Os dados ficam apenas nesta tela.',
    NSHealthUpdateUsageDescription: false,
    background: false,
  }]],
  extra: { eas: { projectId } },
};

export default config;
