import { requireOptionalNativeModule } from 'expo';
import type { WorkoutSchedulingNative } from '../../../src/features/workout-scheduling/port';

// A pre-M1 binary or Expo Go must open with a rebuild message, not crash at import.
export default requireOptionalNativeModule<WorkoutSchedulingNative>('VorunoApple');
