import { distanceInInterval, type DistanceSample } from './intervals';
import type { DistanceInterval } from './port';

export type SpeedSample = { id: string; start: number; end: number; metersPerSecond: number };

export function addRunningMetrics(minutes: readonly DistanceInterval[], origin: number, speeds: readonly SpeedSample[], steps: readonly DistanceSample[]): DistanceInterval[] {
  return minutes.map((minute) => {
    const start = origin + minute.startSeconds * 1000;
    const end = origin + minute.endSeconds * 1000;
    const seen = new Set<string>();
    const selected = speeds.filter((s) => {
      const intersects = s.end === s.start ? s.start >= start && s.start < end : s.start < end && s.end > start;
      if (!intersects || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    // Explicit arithmetic sample mean, NOT instantaneous pace or a time-weighted split.
    const speed = selected.length ? selected.reduce((sum, s) => sum + s.metersPerSecond, 0) / selected.length : 0;
    // Reuse allocation with step counts in the amount field; no distance is inferred.
    const count = distanceInInterval(steps, start, end, origin);
    const cadence = count.coverage >= 0.999999 && count.distanceMeters !== undefined
      ? count.distanceMeters * 60 / (minute.endSeconds - minute.startSeconds) : undefined;
    return { ...minute,
      ...(speed > 0 && Number.isFinite(1000 / speed) ? { paceSecondsPerKm: 1000 / speed } : {}),
      speedSampleCount: selected.length,
      ...(cadence === undefined ? {} : { cadenceStepsPerMinute: cadence, cadenceEstimated: count.quality === 'estimated' }),
    };
  });
}

export function clockDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  return `${hours ? `${hours}:` : ''}${hours ? String(minutes).padStart(2, '0') : minutes}:${String(total % 60).padStart(2, '0')}`;
}
