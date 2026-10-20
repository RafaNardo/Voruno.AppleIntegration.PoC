import { useEffect, useRef, useState } from 'react';
import { AppState, Button, StyleSheet, Switch, Text, View } from 'react-native';
import type { CapabilityResult } from '../../shared/types/integration';
import { healthActivityReading } from './index';
import type { HealthPermission, HealthQuery, HealthDetails } from './port';
import { WorkoutDetails } from './WorkoutDetails';
import { correlate, TEST_PLAN_ID, type PlannedTest } from '../correlation/reconcile';

export function HealthActivitiesPanel({ planned }: { planned?: PlannedTest }) {
  const [capability, setCapability] = useState<CapabilityResult>();
  const [includeHeartRate, setIncludeHeartRate] = useState(false);
  const [permission, setPermission] = useState<HealthPermission>();
  const [query, setQuery] = useState<HealthQuery>();
  const [details, setDetails] = useState<{ id: string; result: HealthDetails }>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const queryGeneration = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void healthActivityReading.getCapability().then((value) => { if (mounted.current) setCapability(value); });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        queryGeneration.current += 1;
        setQuery(undefined);
        setDetails(undefined);
      }
    });
    return () => { mounted.current = false; queryGeneration.current += 1; subscription.remove(); };
  }, []);

  async function request() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setQuery(undefined);
    setDetails(undefined);
    setPermission(undefined);
    try {
      const result = await healthActivityReading.requestPermission(includeHeartRate);
      if (mounted.current) setPermission(result);
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }

  async function read() {
    if (inFlight.current) return;
    inFlight.current = true;
    const generation = ++queryGeneration.current;
    setBusy(true);
    setQuery(undefined);
    setDetails(undefined);
    try {
      const result = await healthActivityReading.listRecentRunningWorkouts();
      if (mounted.current && generation === queryGeneration.current && AppState.currentState === 'active') setQuery(result);
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }

  async function readDetails(id: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    const generation = ++queryGeneration.current;
    setBusy(true);
    setDetails(undefined);
    try {
      const result = await healthActivityReading.getRunningWorkoutDetails(id);
      if (mounted.current && generation === queryGeneration.current && AppState.currentState === 'active') setDetails({ id, result });
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const correlation = query?.status === 'queried' ? correlate(planned, query.workouts) : undefined;

  return <View style={styles.card}>
    <Text style={styles.heading}>M2 · Corridas registradas no Saúde</Text>
    <Text style={styles.body}>{capability?.reason ?? 'Verificando disponibilidade…'}</Text>
    <Text style={styles.body}>Até 20 corridas dos últimos 14 dias. Dados somente em memória nesta tela; ao sair do app, a lista e os detalhes são limpos. Nenhuma associação automática ao treino VORUNO.</Text>
    <View style={styles.row}>
      <Text style={styles.body}>Incluir frequência cardíaca média</Text>
      <Switch accessibilityLabel="Incluir frequência cardíaca média" value={includeHeartRate} disabled={busy}
        onValueChange={(value) => { setIncludeHeartRate(value); setPermission(undefined); setQuery(undefined); setDetails(undefined); }} />
    </View>
    <Button title="Solicitar acesso de leitura ao Saúde" disabled={busy || capability?.capability !== 'supported'} onPress={() => { void request(); }} />
    <Text accessibilityLiveRegion="polite" style={styles.body}>{permission?.message ?? 'Acesso de leitura desconhecido. Solicite acesso antes de consultar.'}</Text>
    <Button title="Ler / atualizar corridas reais" disabled={busy || permission?.status !== 'requested'} onPress={() => { void read(); }} />
    <Button title="Limpar dados da tela" onPress={() => { queryGeneration.current += 1; setQuery(undefined); setDetails(undefined); }} />
    {busy && <Text style={styles.body}>Aguardando o Saúde…</Text>}
    {query && query.status !== 'queried' && <Text accessibilityLiveRegion="polite" style={styles.body}>{query.message}</Text>}
    {query?.status === 'queried' && <>
      <Text style={styles.heading}>M3 · Correspondência experimental</Text>
      <Text style={styles.body}>{planned ? `Referência: ${new Date(planned.scheduledFor).toLocaleString()} · 300 s · ${planned.origin === 'scheduler-list' ? 'consultada no agendador' : 'retornada no envio'}. ID do teste reutilizado.` : 'Sem referência de agendamento nesta sessão.'}</Text>
      <Text style={styles.body}>{correlation?.message} A análise cobre apenas as corridas visíveis desta consulta, não o histórico completo.</Text>
      <Text style={styles.body}>Janela: {new Date(query.from).toLocaleString()} até {new Date(query.to).toLocaleString()}. Máximo: {query.limit}.</Text>
      {query.workouts.length === 0 && <Text style={styles.body}>Nenhuma corrida disponível nesta consulta. Isso pode significar ausência de registros no período, sincronização pendente ou leitura não permitida. Não é possível distinguir essas causas pelo resultado vazio.</Text>}
      {query.metricsIncomplete && <Text style={styles.body}>Algumas consultas de métricas falharam. Os registros abaixo podem estar incompletos.</Text>}
      {query.workouts.map((workout) => <View key={workout.id} style={styles.workout}>
        <Text style={styles.heading}>Corrida</Text>
        <Text style={styles.body}>Início: {new Date(workout.startedAt).toLocaleString()}{'\n'}Fim: {new Date(workout.endedAt).toLocaleString()}</Text>
        <Text style={styles.body}>Duração registrada: {workout.durationSeconds.toFixed(0)} s{'\n'}Distância: {workout.distanceMeters === undefined ? 'não disponível' : `${workout.distanceMeters.toFixed(0)} m`}{'\n'}FC média: {workout.averageHeartRateBpm === undefined ? 'não disponível / não solicitada' : `${workout.averageHeartRateBpm.toFixed(0)} bpm`}</Text>
        <Text style={styles.body}>Fonte: {workout.source.name}{'\n'}{workout.source.bundleIdentifier}</Text>
        <Text style={styles.body}>Plano no HealthKit: {workout.planLink?.status === 'available' ? workout.planLink.running && workout.planLink.id.toLowerCase() === TEST_PLAN_ID ? 'ID igual ao plano de teste VORUNO; não identifica uma execução única' : 'outro plano ou modalidade' : workout.planLink?.status === 'absent' ? 'não retornado' : 'consulta indisponível / falhou'}.</Text>
        {correlation?.candidates.some((c) => c.workoutId === workout.id) && <Text style={styles.body}>Confiança: {correlation.candidates.find((c) => c.workoutId === workout.id)?.confidence === 'stronger' ? 'evidência mais forte (ID do plano + horário)' : 'baixa (somente horário e duração)'}.</Text>}
        <Text style={styles.body}>{correlation?.candidates.find((c) => c.workoutId === workout.id)?.reason ?? 'Não selecionada como candidata nesta comparação.'}</Text>
        <Button title="Ver detalhes · eventos e distância por minuto" disabled={busy} onPress={() => { void readDetails(workout.id); }} />
        {details?.id === workout.id && <WorkoutDetails result={details.result} />}
      </View>)}
    </>}
    <Text style={styles.body}>Para validar: grave e salve uma corrida no Watch, aguarde aparecer no Saúde do iPhone e atualize. Compare início, fim, duração e fonte. Não publique capturas com seus dados de saúde.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  heading: { color: '#13243a', fontSize: 19, fontWeight: '600' },
  body: { color: '#334155', fontSize: 16, lineHeight: 24 },
  row: { gap: 8, alignItems: 'flex-start' },
  workout: { borderTopWidth: 1, borderTopColor: '#dbe2ea', paddingTop: 12, gap: 8 },
});
