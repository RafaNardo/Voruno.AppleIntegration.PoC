import { useEffect, useRef, useState } from 'react';
import { AppState, Button, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { CapabilityResult } from '../../shared/types/integration';
import { healthActivityReading } from './index';
import type { HealthPermission, HealthQuery, HealthDetails } from './port';
import { Metric, WorkoutDetails } from './WorkoutDetails';
import { clockDuration } from './running-metrics';
import { correlate, TEST_PLAN_ID, type PlannedTest } from '../correlation/reconcile';

export function HealthActivitiesPanel({ planned }: { planned?: PlannedTest }) {
  const [capability, setCapability] = useState<CapabilityResult>();
  const [includeHeartRate, setIncludeHeartRate] = useState(false);
  const [permission, setPermission] = useState<HealthPermission>();
  const [query, setQuery] = useState<HealthQuery>();
  const [details, setDetails] = useState<{ id: string; result: HealthDetails }>();
  const [busy, setBusy] = useState(false);
  const [showEvidence, setShowEvidence] = useState<string>();
  const [showAccess, setShowAccess] = useState(true);
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
      if (mounted.current && result.status === 'requested') setShowAccess(false);
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
    <Text style={styles.heading}>Suas corridas</Text>
    <Text style={styles.body}>Últimos 14 dias · até 20 atividades</Text>
    <Button title={showAccess ? 'Ocultar acesso e permissões' : 'Acesso e permissões'} onPress={() => setShowAccess(!showAccess)} />
    {showAccess && <View style={styles.access}>
    <Text style={styles.body}>{capability?.reason ?? 'Verificando disponibilidade…'}</Text>
    <Text style={styles.body}>Leitura de corridas, percurso GPS, distância, velocidade, passos, potência, passada, contato com o solo, oscilação vertical e energia ativa. Solicite acesso novamente para as novas categorias. Abrir detalhes consulta também o percurso salvo; não grava sua localização. Dados somente nesta tela; a lista é limpa ao sair do app.</Text>
    <View style={styles.row}>
      <Text style={styles.body}>Incluir frequência cardíaca e detalhes</Text>
      <Switch accessibilityLabel="Incluir frequência cardíaca e detalhes" value={includeHeartRate} disabled={busy}
        onValueChange={(value) => { setIncludeHeartRate(value); setPermission(undefined); setQuery(undefined); setDetails(undefined); }} />
    </View>
    <Button title="Solicitar acesso de leitura ao Saúde" disabled={busy || capability?.capability !== 'supported'} onPress={() => { void request(); }} />
    <Text accessibilityLiveRegion="polite" style={styles.body}>{permission?.message ?? 'Acesso de leitura desconhecido. Solicite acesso antes de consultar.'}</Text>
    </View>}
    <Button title="Ler / atualizar corridas reais" disabled={busy || permission?.status !== 'requested'} onPress={() => { void read(); }} />
    <Button title="Limpar dados da tela" onPress={() => { queryGeneration.current += 1; setQuery(undefined); setDetails(undefined); }} />
    {busy && <Text style={styles.body}>Aguardando o Saúde…</Text>}
    {query && query.status !== 'queried' && <Text accessibilityLiveRegion="polite" style={styles.body}>{query.message}</Text>}
    {query?.status === 'queried' && <>
      <Text style={styles.count}>{query.workouts.length} corrida(s) encontradas</Text>
      {query.workouts.length === 0 && <Text style={styles.body}>Nenhuma corrida disponível nesta consulta. Isso pode significar ausência de registros no período, sincronização pendente ou leitura não permitida. Não é possível distinguir essas causas pelo resultado vazio.</Text>}
      {query.metricsIncomplete && <Text style={styles.body}>Algumas consultas de métricas falharam. Os registros abaixo podem estar incompletos.</Text>}
      {query.workouts.map((workout) => <View key={workout.id} style={styles.workout}>
        <Text style={styles.date}>{new Date(workout.startedAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
        <Text style={styles.heading}>Corrida · {new Date(workout.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <View style={styles.metrics}>
          <Metric label="DISTÂNCIA" value={workout.distanceMeters === undefined ? '—' : `${(workout.distanceMeters / 1000).toFixed(2)} km`} />
          <Metric label="DURAÇÃO" value={clockDuration(workout.durationSeconds)} />
          <Metric label="FC MÉDIA" value={workout.averageHeartRateBpm === undefined ? '—' : `${workout.averageHeartRateBpm.toFixed(0)} bpm`} />
        </View>
        <Text style={styles.body}>{workout.source.name}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showEvidence === workout.id }} onPress={() => setShowEvidence(showEvidence === workout.id ? undefined : workout.id)} style={styles.evidenceButton}><Text style={styles.link}>{showEvidence === workout.id ? 'Ocultar vínculo e origem' : 'Ver vínculo com VORUNO e origem'}</Text></Pressable>
        {showEvidence === workout.id && <View style={styles.access}>
        <Text style={styles.body}>{correlation?.message}</Text>
        <Text style={styles.body}>{planned ? `Agendamento de referência: ${new Date(planned.scheduledFor).toLocaleString()}` : 'Sem referência de agendamento.'}</Text>
        <Text style={styles.body}>Fim: {new Date(workout.endedAt).toLocaleString()}{'\n'}Fonte: {workout.source.bundleIdentifier}</Text>
        <Text style={styles.body}>Plano no HealthKit: {workout.planLink?.status === 'available' ? workout.planLink.running && workout.planLink.id.toLowerCase() === TEST_PLAN_ID ? 'ID igual ao plano de teste VORUNO; não identifica uma execução única' : 'outro plano ou modalidade' : workout.planLink?.status === 'absent' ? 'não retornado' : 'consulta indisponível / falhou'}.</Text>
        {correlation?.candidates.some((c) => c.workoutId === workout.id) && <Text style={styles.body}>Confiança: {correlation.candidates.find((c) => c.workoutId === workout.id)?.confidence === 'stronger' ? 'evidência mais forte (ID do plano + horário)' : 'baixa (somente horário e duração)'}.</Text>}
        <Text style={styles.body}>{correlation?.candidates.find((c) => c.workoutId === workout.id)?.reason ?? 'Não selecionada como candidata nesta comparação.'}</Text>
        </View>}
        <Button title={details?.id === workout.id ? 'Fechar detalhes' : 'Detalhes completos e GPS'} disabled={busy} onPress={() => { if (details?.id === workout.id) setDetails(undefined); else void readDetails(workout.id); }} />
        {details?.id === workout.id && <WorkoutDetails key={workout.id} result={details.result} />}
      </View>)}
    </>}
    <Text style={styles.body}>Para validar: grave e salve uma corrida no Watch, aguarde aparecer no Saúde do iPhone e atualize. Compare início, fim, duração e fonte. Não publique capturas com seus dados de saúde.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  heading: { color: '#13243a', fontSize: 19, fontWeight: '600' },
  body: { color: '#334155', fontSize: 16, lineHeight: 24 },
  row: { gap: 8, alignItems: 'flex-start' },
  workout: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe2ea', borderRadius: 16, padding: 18, gap: 12 },
  date: { color: '#52667b', fontSize: 14, textTransform: 'uppercase', fontWeight: '600' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 8 },
  access: { backgroundColor: '#eaf0f7', borderRadius: 12, padding: 14, gap: 10 },
  count: { fontWeight: '600', color: '#42566e', marginTop: 10 },
  evidenceButton: { minHeight: 44, justifyContent: 'center' }, link: { color: '#185185', fontSize: 15, fontWeight: '600' },
});
