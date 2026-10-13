import type { ExpoConfig } from 'expo/config';

const projectId = process.env.EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: 'VORUNO Apple PoC',
  slug: 'voruno-apple-integration-poc',
  version: '0.1.0',
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
  plugins: ['expo-router', 'expo-dev-client'],
  extra: projectId ? { eas: { projectId } } : {},
};

export default config;
