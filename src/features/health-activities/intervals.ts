import type { DistanceInterval } from './port';

export type DistanceSample = { id: string; start: number; end: number; meters: number };

// Elapsed clock intervals, including pauses. Splitting a sample assumes uniform speed;
// this is always marked estimated and is never a measured split or a planned stage.
export function distanceInInterval(samples: readonly DistanceSample[], start: number, end: number, origin: number): DistanceInterval {
  const base = { startSeconds: (start - origin) / 1000, endSeconds: (end - origin) / 1000 };
  const seen = new Set<string>();
  const parts = samples.filter((s) => {
    if (seen.has(s.id) || s.end <= start || s.start >= end) return false;
    seen.add(s.id);
    return true;
  }).sort((a, b) => a.start - b.start);
  if (end <= start || !parts.length) return { ...base, coverage: 0, quality: 'missing' };
  let previousEnd = start;
  let covered = 0;
  let meters = 0;
  let estimated = false;
  for (const s of parts) {
    const left = Math.max(start, s.start);
    const right = Math.min(end, s.end);
    if (left < previousEnd) return { ...base, coverage: 0, quality: 'overlap' };
    previousEnd = right;
    covered += right - left;
    const fraction = (right - left) / (s.end - s.start);
    meters += s.meters * fraction;
    if (fraction < 1) estimated = true;
  }
  return { ...base, distanceMeters: meters, coverage: Math.min(1, covered / (end - start)), quality: estimated ? 'estimated' : 'sample-sum' };
}

export function minuteDistances(samples: readonly DistanceSample[], start: number, end: number): DistanceInterval[] {
  const result: DistanceInterval[] = [];
  // Details are bounded to four elapsed hours. The adapter rejects longer workouts.
  for (let cursor = start; cursor < end && result.length < 240; cursor += 60_000) {
    result.push(distanceInInterval(samples, cursor, Math.min(end, cursor + 60_000), start));
  }
  return result;
}
