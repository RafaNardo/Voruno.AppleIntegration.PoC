import native from '../../../modules/voruno-apple/src/VorunoAppleModule';
import { createWorkoutScheduling } from './adapter';

export const workoutScheduling = createWorkoutScheduling(native);
