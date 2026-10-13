import { useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { version as expoVersion } from 'expo/package.json';
import { version as reactNativeVersion } from 'react-native/package.json';
import { workoutScheduling } from '../features/workout-scheduling/port';
import { healthActivityReading } from '../features/health-activities/port';
import { safeDiagnostics, safeErrorMessage } from '../shared/diagnostics/safe-diagnostics';

export default function ExperimentScreen() {
  const [result, setResult] = useState('No checks run. Native integrations are not implemented.');
  const [busy, setBusy] = useState(false);
  const diagnostics = safeDiagnostics({
    platform: Platform.OS,
    osVersion: Platform.Version,
    expoVersion,
    reactNativeVersion,
    executionEnvironment: Constants.executionEnvironment,
  });

  async function checkPlaceholders() {
    setBusy(true);
    try {
      const scheduling = await workoutScheduling.getCapability();
      const health = await healthActivityReading.getCapability();
      setResult(`${scheduling.reason}\n\n${health.reason}`);
    } catch (error: unknown) {
      setResult(safeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>VORUNO · ISOLATED TEST APP</Text>
        <Text style={styles.title}>M0 · Development foundation</Text>
        <Text style={styles.body}>Physical iPhone acceptance is pending. M1 stays blocked until the owner confirms installation, Metro connectivity and Fast Refresh.</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>Native experiments</Text>
          <Text style={styles.body}>WorkoutKit: not implemented (M1)</Text>
          <Button title="Schedule test workout · M1" disabled onPress={() => {}} />
          <Text style={styles.body}>HealthKit: not implemented (M2). Read permission unknown.</Text>
          <Button title="Request HealthKit permission · M2" disabled onPress={() => {}} />
          <Button title="Read running workouts · M2" disabled onPress={() => {}} />
          <Text style={styles.body}>No workout has been scheduled or read. Watch connectivity has not been checked.</Text>
          <Button title={busy ? 'Checking…' : 'Check implementation status'} disabled={busy} onPress={checkPlaceholders} />
          <Text accessibilityLiveRegion="polite" style={styles.body}>{result}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Local diagnostics</Text>
          {Object.entries(diagnostics).map(([key, value]) => <Text selectable key={key} style={styles.diagnostic}>{key}: {value}</Text>)}
          <Text style={styles.body}>Versions and capability states only. No health records, device identifiers or remote diagnostics.</Text>
        </View>
        <Text style={styles.body}>Fast Refresh marker: M0-A</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 20, gap: 18 },
  eyebrow: { color: '#395274', fontSize: 12, fontWeight: '700' },
  title: { color: '#13243a', fontSize: 28, fontWeight: '700' },
  heading: { color: '#13243a', fontSize: 19, fontWeight: '600' },
  body: { color: '#334155', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  diagnostic: { color: '#334155', fontSize: 14, lineHeight: 21 },
});
