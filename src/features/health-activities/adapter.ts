import type * as HealthKit from '@kingstinct/react-native-healthkit';
import type { HealthActivityReading, HealthFailure, RunningWorkout, RecordedEvent } from './port';
import { distanceInInterval, minuteDistances, type DistanceSample } from './intervals';

export type HealthClient = Pick<typeof HealthKit,
  'isHealthDataAvailable' | 'requestAuthorization' | 'queryWorkoutSamples'> & {
    queryQuantitySamples?: typeof HealthKit.queryQuantitySamples;
    runningActivityType: HealthKit.WorkoutActivityType;
  };

const DAYS = 14;
const LIMIT = 20;
const readTypes = ['HKWorkoutTypeIdentifier', 'HKQuantityTypeIdentifierDistanceWalkingRunning'] as const;
const fail = (status: HealthFailure['status'], code: string, message: string): HealthFailure => ({ status, code, message });
const missing = () => fail('unavailable', 'native-unavailable', 'HealthKit indisponível. Instale o novo development build no iPhone.');
const unsupported = () => fail('unavailable', 'health-unavailable', 'HealthKit não está disponível neste dispositivo.');
const busyResult = () => fail('busy', 'busy', 'Aguarde a operação do HealthKit.');

function value(quantity: { quantity: number; unit: string } | undefined, units: readonly string[], positive = false) {
  if (!quantity || !units.includes(quantity.unit) || !Number.isFinite(quantity.quantity) ||
      (positive ? quantity.quantity <= 0 : quantity.quantity < 0)) return undefined;
  return quantity.quantity;
}

function sourceText(input: string): string {
  if (typeof input !== 'string' || !input.trim()) throw new Error('invalid-source');
  return input.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 160);
}

// Tests inject a client; they never import or simulate a real HealthKit store.
export function createHealthActivityReading(load: () => HealthClient | undefined, now = () => new Date()): HealthActivityReading {
  let busy = false;
  let requested = false;
  let includeHeartRate = false;
  function client() {
    try { return load(); } catch { return undefined; }
  }
  return {
    async getCapability() {
      const native = client();
      if (!native) return { capability: 'unknown', implementation: 'implemented', reason: missing().message };
      try {
        return native.isHealthDataAvailable()
          ? { capability: 'supported', implementation: 'implemented', reason: 'HealthKit disponível. Permissão de leitura permanece desconhecida.' }
          : { capability: 'unsupported', implementation: 'implemented', reason: unsupported().message };
      } catch {
        return { capability: 'unknown', implementation: 'implemented', reason: 'Não foi possível consultar a disponibilidade do HealthKit.' };
      }
    },
    async requestPermission(heartRate) {
      if (busy) return busyResult();
      requested = false;
      const native = client();
      if (!native) return missing();
      busy = true;
      try {
        if (!native.isHealthDataAvailable()) return unsupported();
        const completed = await native.requestAuthorization({
          toShare: [],
          toRead: heartRate ? [...readTypes, 'HKQuantityTypeIdentifierHeartRate'] : [...readTypes],
        });
        if (completed !== true) return fail('failed', 'request-incomplete', 'O pedido de acesso não foi concluído. Isso não revela quais leituras foram permitidas.');
        requested = true;
        includeHeartRate = heartRate;
        return { status: 'requested', requestCompleted: true, readStatus: 'unknown', message: 'Pedido concluído. A Apple não informa se a leitura foi permitida; consulte as corridas para ver os dados disponíveis.' };
      } catch {
        return fail('failed', 'request-failed', 'Não foi possível concluir o pedido de acesso ao Saúde. Tente novamente no iPhone desbloqueado.');
      } finally { busy = false; }
    },
    async listRecentRunningWorkouts() {
      if (busy) return busyResult();
      if (!requested) return fail('request-required', 'request-required', 'Solicite acesso ao Saúde nesta sessão antes de consultar.');
      const native = client();
      if (!native) return missing();
      busy = true;
      try {
        if (!native.isHealthDataAvailable()) return unsupported();
        const to = now();
        const from = new Date(to.getTime() - DAYS * 24 * 60 * 60 * 1000);
        const samples = await native.queryWorkoutSamples({ limit: LIMIT, ascending: false, filter: {
          workoutActivityType: native.runningActivityType,
          date: { startDate: from, endDate: to, strictStartDate: true, strictEndDate: true },
        } });
        if (!Array.isArray(samples)) throw new Error('invalid-response');
        const workouts: RunningWorkout[] = [];
        const ids = new Set<string>();
        let metricsIncomplete = false;
        for (const sample of samples.slice(0, LIMIT)) {
          // Never serialize the proxy: it also exposes metadata, device IDs and routes.
          if (sample.workoutActivityType !== native.runningActivityType) continue;
          const start = sample.startDate.getTime();
          const end = sample.endDate.getTime();
          const durationSeconds = value(sample.duration, ['s', 'sec', 'seconds']);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || durationSeconds === undefined ||
              typeof sample.uuid !== 'string' || !sample.uuid) throw new Error('invalid-workout');
          if (start < from.getTime() || end > to.getTime() || ids.has(sample.uuid)) continue;
          ids.add(sample.uuid);
          let distanceMeters = value(sample.totalDistance, ['m', 'meters']);
          let averageHeartRateBpm: number | undefined;
          try {
            const distance = await sample.getStatistic('HKQuantityTypeIdentifierDistanceWalkingRunning', 'm');
            distanceMeters = value(distance?.sumQuantity, ['m', 'meters']) ?? distanceMeters;
          } catch { metricsIncomplete = true; }
          if (includeHeartRate) {
            try {
              const hr = await sample.getStatistic('HKQuantityTypeIdentifierHeartRate', 'count/min');
              averageHeartRateBpm = value(hr?.averageQuantity, ['count/min'], true);
            } catch { metricsIncomplete = true; }
          }
          let planLink: RunningWorkout['planLink'];
          try {
            const plan = await sample.getWorkoutPlan();
            planLink = plan && typeof plan.id === 'string' && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(plan.id)
              ? { status: 'available', id: plan.id.toLowerCase(), running: plan.activityType === native.runningActivityType }
              : plan === undefined || plan === null ? { status: 'absent' } : { status: 'failed' };
          } catch { planLink = { status: 'failed' }; }
          workouts.push({
            id: sample.uuid, startedAt: sample.startDate.toISOString(), endedAt: sample.endDate.toISOString(),
            durationSeconds,
            ...(distanceMeters === undefined ? {} : { distanceMeters }),
            ...(averageHeartRateBpm === undefined ? {} : { averageHeartRateBpm }),
            source: { name: sourceText(sample.sourceRevision.source.name), bundleIdentifier: sourceText(sample.sourceRevision.source.bundleIdentifier) },
            planLink,
          });
        }
        workouts.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
        return { status: 'queried', readStatus: 'unknown', workouts, from: from.toISOString(), to: to.toISOString(), limit: LIMIT, metricsIncomplete };
      } catch {
        return fail('failed', 'query-failed', 'Não foi possível ler as corridas. Desbloqueie o iPhone e tente novamente; confira o acesso ao app no Saúde.');
      } finally { busy = false; }
    },
    async getRunningWorkoutDetails(id) {
      if (busy) return busyResult();
      if (!requested) return fail('request-required', 'request-required', 'Solicite acesso antes de consultar detalhes.');
      const native = client();
      if (!native?.queryQuantitySamples) return missing();
      busy = true;
      try {
        if (!native.isHealthDataAvailable()) return unsupported();
        const to = now();
        const from = new Date(to.getTime() - DAYS * 86_400_000);
        const matches = await native.queryWorkoutSamples({ limit: 1, filter: { uuid: id,
          workoutActivityType: native.runningActivityType,
          date: { startDate: from, endDate: to, strictStartDate: true, strictEndDate: true },
        } });
        const sample = matches[0];
        if (!sample || sample.uuid !== id || sample.workoutActivityType !== native.runningActivityType) {
          return fail('unavailable', 'workout-not-visible', 'A corrida não está mais disponível nesta janela de leitura. Atualize a lista.');
        }
        const start = sample.startDate.getTime();
        const end = sample.endDate.getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < from.getTime() || end > to.getTime() || end <= start) throw new Error('invalid-dates');
        if (end - start > 4 * 60 * 60 * 1000) return fail('unavailable', 'details-limit', 'Detalhamento da PoC limitado a corridas de até 4 horas decorridas.');
        let distanceStatus: 'queried' | 'failed' = 'queried';
        let samplesTruncated = false;
        let invalidSamples = false;
        const distances: DistanceSample[] = [];
        try {
          const values = await native.queryQuantitySamples('HKQuantityTypeIdentifierDistanceWalkingRunning', {
            unit: 'm', limit: 2001, ascending: true, filter: { workout: sample },
          });
          samplesTruncated = values.length > 2000;
          for (const entry of values.slice(0, 2000)) {
            const left = entry.startDate.getTime();
            const right = entry.endDate.getTime();
            if (!entry.uuid || !Number.isFinite(left) || !Number.isFinite(right) || right <= left ||
                !Number.isFinite(entry.quantity) || entry.quantity < 0 || entry.unit !== 'm') {
              invalidSamples = true;
              continue;
            }
            distances.push({ id: entry.uuid, start: left, end: right, meters: entry.quantity });
          }
        } catch { distanceStatus = 'failed'; distances.length = 0; }
        const kinds: Record<number, RecordedEvent['kind']> = { 1: 'pause', 2: 'resume', 3: 'lap', 4: 'marker', 5: 'motionPaused', 6: 'motionResumed', 7: 'segment', 8: 'pauseOrResumeRequest' };
        const events: RecordedEvent[] = [];
        const rawEvents = sample.events ?? [];
        for (const event of rawEvents.slice(0, 200)) {
          const left = event.startDate.getTime();
          const right = event.endDate.getTime();
          if (!Number.isFinite(left) || !Number.isFinite(right) || left < start || right > end || right < left) continue;
          const kind = kinds[event.type] ?? 'unknown';
          events.push({ kind, startSeconds: (left - start) / 1000, endSeconds: (right - start) / 1000,
            ...((kind === 'lap' || kind === 'segment') && right > left ? { distance: distanceInInterval(distances, left, right, start) } : {}),
          });
        }
        events.sort((a, b) => a.startSeconds - b.startSeconds);
        return { status: 'queried', workoutId: id, minutes: minuteDistances(distances, start, end), events,
          distanceStatus, samplesTruncated, invalidSamples, eventsTruncated: rawEvents.length > 200,
        };
      } catch {
        return fail('failed', 'details-failed', 'Não foi possível consultar os detalhes desta corrida. Atualize e tente novamente.');
      } finally { busy = false; }
    },
  };
}
