import type { RunningWorkout } from '../health-activities/port';

// Same synthetic fixed fixture as WorkoutSchedulingService.swift, not a person/activity ID.
export const TEST_PLAN_ID = '79424a80-25a6-4ee7-8a82-748851535fa1';
export type PlannedTest = { planId: string; scheduledFor: string; durationSeconds: number; origin: 'schedule-returned' | 'scheduler-list' };
export type Candidate = { workoutId: string; confidence: 'stronger' | 'low'; reason: string };
export type Correlation = {
  status: 'no-context' | 'no-candidate' | 'possible-match' | 'ambiguous';
  candidates: Candidate[];
  message: string;
};

export function plannedTest(scheduledFor: string | undefined, origin: PlannedTest['origin']): PlannedTest | undefined {
  if (!scheduledFor || !Number.isFinite(Date.parse(scheduledFor))) return undefined;
  return { planId: TEST_PLAN_ID, scheduledFor, durationSeconds: 300, origin };
}

// Experimental thresholds, not a probabilistic confidence score or automatic association.
export function correlate(target: PlannedTest | undefined, workouts: readonly RunningWorkout[]): Correlation {
  if (!target || !Number.isFinite(Date.parse(target.scheduledFor))) return {
    status: 'no-context', candidates: [], message: 'Sem horário de referência. Envie o teste ou consulte um único agendamento existente. Após reiniciar, um agendamento já removido não pode ser recuperado pela PoC.',
  };
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  for (const workout of workouts) {
    if (seen.has(workout.id)) continue;
    seen.add(workout.id);
    const delta = Math.abs(Date.parse(workout.startedAt) - Date.parse(target.scheduledFor));
    if (!Number.isFinite(delta) || delta > 15 * 60 * 1000 || !workout.source.bundleIdentifier ||
        !Number.isFinite(workout.durationSeconds) || workout.durationSeconds < 0) continue;
    const link = workout.planLink;
    if (link?.status === 'available' && (!link.running || link.id.toLowerCase() !== target.planId.toLowerCase())) continue;
    const durationClose = Number.isFinite(workout.durationSeconds) && Math.abs(workout.durationSeconds - target.durationSeconds) <= 60;
    if (link?.status === 'available') {
      candidates.push({ workoutId: workout.id, confidence: 'stronger', reason:
        `HealthKit retornou o ID deste plano e início na janela de ±15 min. ${durationClose ? 'Duração próxima dos 300 s planejados.' : 'Duração diferente do planejado; pode haver execução alterada.'} O ID é reutilizado: isso não confirma a sessão nem cada etapa.` });
    } else if (durationClose) {
      candidates.push({ workoutId: workout.id, confidence: 'low', reason:
        `Início na janela de ±15 min e duração a até 60 s dos 300 s planejados. ${link?.status === 'absent' ? 'Sem plano retornado.' : 'Vínculo com plano não pôde ser verificado.'} Outra corrida pode coincidir; fonte deve ser conferida manualmente.` });
    }
  }
  if (candidates.length > 1) return { status: 'ambiguous', candidates, message: 'Múltiplas corridas candidatas. Nenhuma associação selecionada automaticamente.' };
  if (candidates.length === 1) return { status: 'possible-match', candidates, message: 'Possível correspondência, sujeita à conferência manual. Não é comprovação de execução das etapas.' };
  return { status: 'no-candidate', candidates, message: 'Nenhuma candidata nesta consulta. Sincronização, acesso limitado, início fora da janela ou alteração da duração podem impedir a correspondência.' };
}
