import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import type { WorkoutRoute } from './port';
import { routePlot, type PlotPoint } from './route';

function Plot({ segments, label }: { segments: PlotPoint[][]; label: string }) {
  const [widthAvailable, setWidthAvailable] = useState(300);
  const scale = widthAvailable / 300;
  return <View accessible accessibilityLabel={label} onLayout={event => setWidthAvailable(event.nativeEvent.layout.width)} style={[styles.plot, { height: 200 * scale }]}>
    {segments.flatMap((segment, s) => segment.map(p => ({ x: p.x * scale, y: p.y * scale })).map((point, i, scaled) => {
      const next = scaled[i + 1];
      if (!next) return <View key={`${s}-${i}`} style={[styles.dot, { left: point.x - 2, top: point.y - 2 }]} />;
      const width = Math.hypot(next.x - point.x, next.y - point.y);
      return <View key={`${s}-${i}`} style={[styles.line, { width, left: (point.x + next.x - width) / 2, top: (point.y + next.y) / 2 - 1.5, transform: [{ rotate: `${Math.atan2(next.y - point.y, next.x - point.x)}rad` }] }]} />;
    }))}
  </View>;
}
export function RouteDetails({ route }: { route: WorkoutRoute }) {
  if (route.status === 'failed') return <Text style={styles.note}>Falha na leitura do percurso. Tente novamente após sincronizar o Watch.</Text>;
  if (!route.accepted) return <Text style={styles.note}>Sem pontos GPS utilizáveis. Pode faltar gravação, sincronização ou acesso ao percurso; isso não confirma permissão negada. Pontos descartados: {route.rejected}.</Text>;
  return <View style={styles.container}>
    <Text style={styles.heading}>Percurso · norte acima</Text>
    <Plot segments={routePlot(route.segments)} label="Traçado GPS local, norte acima; lacunas não são conectadas." />
    <Text style={styles.note}>Traçado local sem mapa de ruas. {route.accepted} pontos aceitos · {route.rejected} descartados. Desenho reduzido a até 500 pontos; não representa cada curva.</Text>
    <Text style={styles.note}>Precisão horizontal aceita até 50 m. Intervalos acima de 30 s, pontos inválidos e rotas separadas interrompem a linha. A cobertura GPS não garante precisão da distância.</Text>
    {route.truncated && <Text style={styles.note}>Leitura parcial: limite de processamento de 20.000 pontos atingido.</Text>}
    {route.minimumAltitude !== undefined && <>
      <Text style={styles.heading}>Altitude · ao longo do tempo</Text>
      <Text style={styles.note}>Mínima {route.minimumAltitude.toFixed(0)} m · máxima {route.maximumAltitude?.toFixed(0)} m</Text>
      <Plot segments={routePlot(route.segments, true)} label="Perfil de altitude em metros ao longo do tempo decorrido, da esquerda para a direita." />
      <Text style={styles.note}>Altitude dos pontos com precisão vertical até 30 m. Perfil simplificado; variação de altitude não equivale a ganho acumulado de elevação.</Text>
    </>}
    {route.minimumAltitude === undefined && <Text style={styles.note}>Sem altitude com precisão suficiente.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 }, heading: { fontWeight: '700', fontSize: 18, color: '#13243a' },
  note: { fontSize: 14, lineHeight: 21, color: '#42566e' },
  plot: { width: 300, maxWidth: '100%', height: 200, alignSelf: 'center', backgroundColor: '#e9eef5', borderRadius: 12, overflow: 'hidden' },
  line: { position: 'absolute', height: 3, backgroundColor: '#176b94' },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#176b94' },
});
