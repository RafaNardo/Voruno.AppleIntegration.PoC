import type { WorkoutRoute as NativeRoute } from '@kingstinct/react-native-healthkit';
import type { RoutePoint, WorkoutRoute } from './port';

// Cap JS processing; the library itself returns all native locations before this cap.
export function normalizeRoute(routes: readonly NativeRoute[], start: number, end: number): WorkoutRoute {
  const segments: RoutePoint[][] = [];
  let accepted = 0, rejected = 0, visited = 0;
  let minimumAltitude: number | undefined, maximumAltitude: number | undefined;
  let truncated = false;
  outer: for (const route of routes) {
    let segment: RoutePoint[] = [];
    for (const p of route.locations) {
      if (++visited > 20000) { truncated = true; break outer; }
      const time = p.date.getTime();
      if (!Number.isFinite(time) || time < start || time > end || !Number.isFinite(p.latitude) || Math.abs(p.latitude) > 90 ||
          !Number.isFinite(p.longitude) || Math.abs(p.longitude) > 180 || !Number.isFinite(p.horizontalAccuracy) ||
          p.horizontalAccuracy < 0 || p.horizontalAccuracy > 50) {
        rejected++; segment = []; continue;
      }
      const point: RoutePoint = { latitude: p.latitude, longitude: p.longitude, seconds: (time - start) / 1000,
        ...(Number.isFinite(p.altitude) && Number.isFinite(p.verticalAccuracy) && p.verticalAccuracy >= 0 && p.verticalAccuracy <= 30 ? { altitude: p.altitude } : {}),
      };
      const previous = segment.at(-1);
      if (previous && (point.seconds <= previous.seconds || point.seconds - previous.seconds > 30 || Math.abs(point.longitude - previous.longitude) > 180)) segment = [];
      if (!segment.length) segments.push(segment);
      segment.push(point); accepted++;
      if (point.altitude !== undefined) {
        minimumAltitude = Math.min(minimumAltitude ?? point.altitude, point.altitude);
        maximumAltitude = Math.max(maximumAltitude ?? point.altitude, point.altitude);
      }
    }
  }
  // Preserve breaks; do not connect across discarded samples. Bound rendering to 500 points.
  const stride = Math.max(1, Math.ceil(accepted / 500));
  let index = 0;
  const display = segments.map(segment => segment.filter(() => index++ % stride === 0)).filter(segment => segment.length);
  return { status: 'queried', segments: display, accepted, rejected, truncated, minimumAltitude, maximumAltitude };
}

export type PlotPoint = { x: number; y: number };
export function routePlot(segments: WorkoutRoute['segments'], altitude = false): PlotPoint[][] {
  const all = segments.flat();
  if (!all.length) return [];
  const latitude = all.reduce((sum, p) => sum + p.latitude, 0) / all.length;
  const scale = Math.cos(latitude * Math.PI / 180);
  const projected = segments.flatMap(segment => {
    const parts: PlotPoint[][] = []; let current: PlotPoint[] = [];
    for (const p of segment) {
      if (altitude && p.altitude === undefined) { current = []; continue; }
      if (!current.length) parts.push(current);
      current.push({ x: altitude ? p.seconds : p.longitude * scale, y: altitude ? -p.altitude! : -p.latitude });
    }
    return parts;
  });
  const points = projected.flat();
  if (!points.length) return [];
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  const dx = maxX - minX, dy = maxY - minY;
  const factor = Math.min(280 / (dx || 1e-9), 180 / (dy || 1e-9));
  return projected.map(segment => segment.map(p => ({
    x: altitude ? 10 + (dx ? (p.x - minX) / dx * 280 : 140) : 150 + (p.x - (minX + maxX) / 2) * factor,
    y: altitude ? 10 + (dy ? (p.y - minY) / dy * 180 : 90) : 100 + (p.y - (minY + maxY) / 2) * factor,
  })));
}
