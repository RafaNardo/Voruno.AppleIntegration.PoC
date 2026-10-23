import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HealthDetails, RecordedEvent } from './port';
import { clockDuration } from './running-metrics';
import { RouteDetails } from './RouteDetails';

const labels: Record<RecordedEvent['kind'], string> = {
  pause: 'Pausa', resume: 'Retomada', lap: 'Volta', marker: 'Marcador', motionPaused: 'Pausa automática',
  motionResumed: 'Retomada automática', segment: 'Segmento', pauseOrResumeRequest: 'Pedido de pausa', unknown: 'Outro evento',
};
export function WorkoutDetails({ result }: { result: HealthDetails }) {
  const [tab, setTab] = useState<'overview' | 'route' | 'minutes' | 'events'>('overview');
  const [visible, setVisible] = useState(10);
  if (result.status !== 'queried') return <Text style={styles.note}>{result.message}</Text>;
  const incomplete = result.samplesTruncated || result.invalidSamples || result.distanceStatus === 'failed' || result.speedStatus !== 'queried' || result.cadenceStatus !== 'queried';
  return <View style={styles.container}>
    <View style={styles.tabs}>
      {(['overview', 'route', 'minutes', 'events'] as const).map((key) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => { setTab(key); setVisible(10); }} style={[styles.tab, tab === key && styles.active]}>
        <Text style={[styles.tabLabel, tab === key && styles.activeLabel]}>{{ overview: 'Resumo técnico', route: 'GPS / altitude', minutes: 'Por minuto', events: `Eventos (${result.events.length})` }[key]}</Text>
      </Pressable>)}
    </View>
    {incomplete && <Text style={styles.warning}>Dados incompletos ou limite de leitura atingido. Campos ausentes não significam zero.</Text>}
    {tab === 'overview' && <>
      <Text style={styles.note}>Estatísticas do HealthKit associadas a esta corrida. Disponibilidade depende da gravação, do acesso e da sincronização. Ausente não significa zero.</Text>
      {result.statistics.map(stat => <View key={stat.label} style={styles.interval}>
        <Text style={styles.intervalTitle}>{stat.label}</Text>
        {stat.status === 'available' ? <View style={styles.metrics}>
          {([['average', 'MÉDIA'], ['minimum', 'MÍNIMA'], ['maximum', 'MÁXIMA'], ['total', 'TOTAL']] as const).map(([key, label]) => stat[key] === undefined ? null : <Metric key={key} label={label} value={`${stat[key].toFixed(stat.unit === 'm' || stat.unit === 'cm' ? 2 : 0)} ${stat.unit}`} />)}
        </View> : <Text style={styles.note}>{stat.status === 'failed' ? 'Falha na leitura' : stat.status === 'not-requested' ? 'Não solicitado: ative a opção cardíaca e solicite acesso novamente' : 'Sem dados disponíveis'}</Text>}
      </View>)}
      <Text style={styles.intervalTitle}>Dados para avaliar o treino</Text>
      <Text style={styles.note}>Minutos com dados: ritmo {result.minutes.filter(m => m.paceSecondsPerKm !== undefined).length}/{result.minutes.length}; cadência {result.minutes.filter(m => m.cadenceStepsPerMinute !== undefined).length}/{result.minutes.length}; FC {result.minutes.filter(m => m.heartRateBpm !== undefined).length}/{result.minutes.length}; potência {result.minutes.filter(m => m.powerWatts !== undefined).length}/{result.minutes.length}.</Text>
      <Text style={styles.note}>FC por minuto: {result.heartRateStatus === 'queried' ? 'consulta concluída' : result.heartRateStatus === 'not-requested' ? 'não solicitada' : 'incompleta ou falhou'}. Potência por minuto: {result.powerStatus === 'queried' ? 'consulta concluída' : 'incompleta ou falhou'}.</Text>
      <Text style={styles.warning}>Estes dados permitem inspecionar a execução. Avaliar cumprimento de cada etapa ainda depende de identificar as etapas planejadas; zonas e esforço exigem referências individuais do aluno. Nenhuma nota automática é atribuída.</Text>
    </>}
    {tab === 'route' && <RouteDetails route={result.route} />}
    {tab === 'minutes' && <>
      <Text style={styles.note}>Tempo decorrido, incluindo pausas. Ritmo = conversão da velocidade média das amostras do minuto; não é ritmo instantâneo. Cadência = passos por minuto, somente com cobertura temporal completa.</Text>
      {result.minutes.slice(0, visible).map((minute, index) => <View key={index} style={styles.interval}>
        <Text style={styles.intervalTitle}>{clockDuration(minute.startSeconds)} — {clockDuration(minute.endSeconds)}</Text>
        <View style={styles.metrics}>
          <Metric label="DISTÂNCIA" value={minute.distanceMeters === undefined ? '—' : `${minute.distanceMeters.toFixed(0)} m`} />
          <Metric label="RITMO /KM" value={minute.paceSecondsPerKm === undefined ? '—' : clockDuration(minute.paceSecondsPerKm)} />
          <Metric label="PASSOS/MIN" value={minute.cadenceStepsPerMinute === undefined ? '—' : minute.cadenceStepsPerMinute.toFixed(0)} />
          <Metric label="FC MÉDIA" value={minute.heartRateBpm === undefined ? '—' : `${minute.heartRateBpm.toFixed(0)} bpm`} />
          <Metric label="POTÊNCIA MÉDIA" value={minute.powerWatts === undefined ? '—' : `${minute.powerWatts.toFixed(0)} W`} />
        </View>
        <Text style={styles.note}>{minute.quality === 'overlap' ? 'Distância: amostras sobrepostas.' : `Distância: ${(minute.coverage * 100).toFixed(0)}% de cobertura${minute.quality === 'estimated' ? ' · estimada proporcionalmente' : ''}.`} Ritmo: {minute.speedSampleCount ?? 0} amostra(s).{minute.cadenceEstimated ? ' Cadência estimada ao dividir amostras.' : ''}</Text>
      </View>)}
      {result.minutes.length > visible && <Pressable accessibilityRole="button" style={styles.more} onPress={() => setVisible(visible + 10)}><Text style={styles.link}>Mostrar mais 10 minutos</Text></Pressable>}
      <Text style={styles.note}>— = sem dados suficientes, leitura indisponível ou velocidade zero. Cobertura não mede precisão. Amostras condensadas podem reduzir o detalhe; os valores podem diferir do Fitness.</Text>
      <Text style={styles.note}>FC e potência são médias aritméticas das amostras que intersectam o minuto, sem interpolação. A presença de amostras não garante cobertura contínua.</Text>
    </>}
    {tab === 'events' && <>
      <Text style={styles.note}>Eventos realmente registrados pela Apple. Não são automaticamente as etapas de esforço e recuperação planejadas.</Text>
      {result.events.length === 0 && <Text style={styles.empty}>Sem etapas ou eventos disponíveis nesta corrida.</Text>}
      {result.events.slice(0, visible).map((event, index) => <View key={index} style={styles.interval}>
        <Text style={styles.intervalTitle}>{labels[event.kind]}</Text>
        <Text style={styles.note}>{clockDuration(event.startSeconds)} — {clockDuration(event.endSeconds)}</Text>
        <View style={styles.metrics}>
          <Metric label="DURAÇÃO" value={clockDuration(event.endSeconds - event.startSeconds)} />
          <Metric label="DISTÂNCIA" value={event.distance?.distanceMeters === undefined ? '—' : `${event.distance.distanceMeters.toFixed(0)} m`} />
        </View>
        {event.distance && <Text style={styles.note}>Cobertura: {(event.distance.coverage * 100).toFixed(0)}%{event.distance.quality === 'estimated' ? ' · distância estimada' : ''}{event.distance.quality === 'overlap' ? ' · amostras sobrepostas' : ''}</Text>}
      </View>)}
      {result.events.length > visible && <Pressable accessibilityRole="button" style={styles.more} onPress={() => setVisible(visible + 10)}><Text style={styles.link}>Mostrar mais 10 eventos</Text></Pressable>}
      {result.eventsTruncated && <Text style={styles.warning}>Limite de 200 eventos atingido.</Text>}
    </>}
  </View>;
}
export function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  container: { gap: 12, marginTop: 12 }, tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { padding: 12, minHeight: 44, borderRadius: 10, backgroundColor: '#e9eef5' }, active: { backgroundColor: '#153e65' },
  tabLabel: { color: '#23415f', fontWeight: '600', fontSize: 15 }, activeLabel: { color: '#fff' },
  interval: { backgroundColor: '#f0f5fa', borderRadius: 12, padding: 14, gap: 10 },
  intervalTitle: { color: '#13243a', fontWeight: '700', fontSize: 17 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, metric: { minWidth: 78, flexGrow: 1, gap: 4 },
  metricValue: { fontSize: 23, fontWeight: '700', color: '#13243a', fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: 11, color: '#42566e', fontWeight: '600', letterSpacing: 0.5 },
  note: { color: '#42566e', fontSize: 14, lineHeight: 21 }, warning: { color: '#78440b', backgroundColor: '#fff3dc', padding: 12, borderRadius: 8, lineHeight: 21 },
  empty: { color: '#42566e', paddingVertical: 20 }, more: { minHeight: 44, padding: 12 }, link: { color: '#185185', fontWeight: '600' },
});
