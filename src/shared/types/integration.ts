export type Capability = 'supported' | 'unsupported' | 'unknown';

export type CapabilityResult = Readonly<{
  capability: Capability;
  implementation: 'not-implemented' | 'implemented';
  reason: string;
}>;

export type NotImplemented = Readonly<{
  status: 'not-implemented';
  message: string;
}>;
