import { Text, View } from 'react-native';
import type { DistanceInterval, HealthDetails, RecordedEvent } from './port';

const labels: Record<RecordedEvent['kind'], string> = {
  pause: 'Pausa', resume: 'Retomada', lap: 'Volta', marker: 'Marcador', motionPaused: 'Pausa automática',
  motionResumed: 'Retomada automática', segment: 'Segmento', pauseOrResumeRequest: 'Pedido de pausa/retomada', unknown: 'Evento desconhecido',
};
function distanceText(interval: DistanceInterval): string {
  if (interval.quality === 'overlap') return 'indisponível: amostras sobrepostas (risco de contagem dupla)';
  if (interval.distanceMeters === undefined) return 'distância indisponível';
  return `${interval.distanceMeters.toFixed(1)} m · ${interval.quality === 'estimated' ? 'estimativa proporcional' : 'soma das amostras'} · cobertura temporal ${(interval.coverage * 100).toFixed(0)}%`;
}
export function WorkoutDetails({ result }: { result: HealthDetails }) {
  if (result.status !== 'queried') return <Text>{result.message}</Text>;
  return <View style={{ gap: 8 }}>
    <Text style={{ fontWeight: '700' }}>Detalhes registrados / calculados</Text>
    <Text>Tempo decorrido desde o início, incluindo pausas. Os eventos não são automaticamente as etapas do plano. Distâncias estimadas supõem velocidade uniforme dentro de cada amostra; podem diferir dos splits do Fitness.</Text>
    {(result.samplesTruncated || result.invalidSamples || result.distanceStatus === 'failed') && <Text>Distâncias incompletas: {result.distanceStatus === 'failed' ? 'consulta de amostras falhou. ' : ''}{result.samplesTruncated ? 'limite de 2.000 amostras atingido. ' : ''}{result.invalidSamples ? 'amostras sem intervalo/unidade válidos foram descartadas.' : ''} Valores disponíveis não representam necessariamente o total do intervalo.</Text>}
    <Text style={{ fontWeight: '700' }}>Eventos do HealthKit</Text>
    {result.events.length === 0 && <Text>Nenhum evento disponível. Não foi possível identificar as etapas executadas.</Text>}
    {result.eventsTruncated && <Text>Mostrando apenas os primeiros 200 eventos.</Text>}
    {result.events.map((event, index) => <Text key={index}>
      {labels[event.kind]} · {event.startSeconds.toFixed(1)}–{event.endSeconds.toFixed(1)} s · duração registrada {(event.endSeconds - event.startSeconds).toFixed(1)} s
      {event.distance ? `\n${distanceText(event.distance)}` : ''}
    </Text>)}
    <Text style={{ fontWeight: '700' }}>Distância por minuto decorrido</Text>
    <Text>Cobertura indica o tempo abrangido pelas amostras, não precisão do sensor. Lacunas não significam distância zero. Amostras condensadas podem reduzir a resolução desta estimativa.</Text>
    {result.minutes.map((minute, index) => <Text key={index}>{minute.startSeconds.toFixed(0)}–{minute.endSeconds.toFixed(0)} s: {distanceText(minute)}</Text>)}
  </View>;
}
