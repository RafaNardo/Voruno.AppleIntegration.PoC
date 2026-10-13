export type DiagnosticInput = Readonly<{
  platform: string;
  osVersion: string | number;
  expoVersion: string;
  reactNativeVersion: string;
  executionEnvironment: string;
}>;

// Explicit allowlist. Never spread native payloads, manifests, errors or health records.
export function safeDiagnostics(input: DiagnosticInput) {
  return {
    platform: input.platform,
    osVersion: String(input.osVersion),
    expoVersion: input.expoVersion,
    reactNativeVersion: input.reactNativeVersion,
    executionEnvironment: input.executionEnvironment,
    workoutKit: 'unknown / not implemented',
    healthKit: 'unknown / not implemented',
    watchConnectivity: 'not checked',
    physicalAcceptance: 'pending owner confirmation',
  } as const;
}

export function safeErrorMessage(_error: unknown): string {
  return 'The local check failed. Native capability remains unknown. No raw error details are displayed or logged.';
}
