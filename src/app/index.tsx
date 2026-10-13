import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { version as expoVersion } from 'expo/package.json';
import { version as reactNativeVersion } from 'react-native/package.json';
import { workoutScheduling } from '../features/workout-scheduling';
import type { ScheduleAction, ScheduleSnapshot } from '../features/workout-scheduling/port';
import { safeDiagnostics, safeErrorMessage } from '../shared/diagnostics/safe-diagnostics';

export default function ExperimentScreen() {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshot>();
  const [result, setResult] = useState<ScheduleAction>();
  const [observation, setObservation] = useState('not checked');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const diagnostics = safeDiagnostics({
    platform: Platform.OS,
    osVersion: Platform.Version,
    expoVersion,
    reactNativeVersion,
    executionEnvironment: Constants.executionEnvironment,
  });

  const refresh = useCallback(async () => {
    setSnapshot(await workoutScheduling.getCapability());
  }, []);

  useEffect(() => {
    let mounted = true;
    void workoutScheduling.getCapability().then((state) => {
      if (mounted) setSnapshot(state);
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => { mounted = false; subscription.remove(); };
  }, [refresh]);

  async function run(operation: () => Promise<ScheduleAction>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setObservation('not checked');
    try {
      setResult(await operation());
      await refresh();
    } catch (error: unknown) {
      setResult({ status: 'unknown', code: 'ui-call-failed', message: safeErrorMessage(error) });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const canSchedule = !busy && snapshot?.capability === 'supported' && snapshot.authorization === 'authorized';

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>VORUNO · ISOLATED TEST APP</Text>
        <Text style={styles.title}>M1 · WorkoutKit experiment</Text>
        <Text style={styles.body}>Requires a new M1 development build. Scheduling, scheduler listing and manual Watch visibility are separate observations. Native build and Watch validation are pending.</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>TEST ONLY · Outdoor run</Text>
          <Text style={styles.body}>VORUNO TEST ONLY 2x1m{ '\n' }Warmup 1 min → 2 × (work 1 min + recovery 30 sec) → cooldown 1 min. Total: 5 min. No pace or heart-rate targets.</Text>
          <Text style={styles.body}>Capability: {snapshot?.capability ?? 'unknown'}{ '\n' }Authorization: {snapshot?.authorization ?? 'unknown'}</Text>
          <Text style={styles.body}>{snapshot?.reason ?? 'Checking the native module…'}</Text>
          <Button title="Refresh OS state / scheduler list" disabled={busy} onPress={() => { void refresh(); }} />
          <Button title="Request WorkoutKit authorization" disabled={busy || snapshot?.capability !== 'supported'} onPress={() => run(() => workoutScheduling.requestAuthorization())} />
          <Button title="Schedule test · about 5 min from now" disabled={!canSchedule} onPress={() => run(() => workoutScheduling.scheduleTestWorkout())} />
          <Button title="Remove this test fixture only" disabled={!canSchedule || !snapshot?.fixtureCount} onPress={() => run(() => workoutScheduling.removeTestWorkout())} />
          <Text style={styles.body}>Fixture entries in OS scheduler: {snapshot?.fixtureCount ?? 'not queried / unknown'}</Text>
          {snapshot?.scheduledFor && <Text style={styles.body}>Listed date (local): {new Date(snapshot.scheduledFor).toLocaleString()}</Text>}
          <Text accessibilityLiveRegion="polite" style={styles.body}>{busy ? 'Waiting for the OS…' : result ? `${result.status} · ${result.code}\n${result.message}` : 'No action requested this session.'}</Text>
          {result?.authorization && <Text style={styles.body}>Authorization returned: {result.authorization}</Text>}
          {result?.scheduledFor && <Text style={styles.body}>Action date (local): {new Date(result.scheduledFor).toLocaleString()}</Text>}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Manual Watch observation</Text>
          <Text style={styles.body}>Open Apple’s Workout app on the paired Watch and inspect the name and all steps. These buttons record only your visual observation in memory; they do not establish execution or import.</Text>
          <Button title="I see the matching test and steps" disabled={busy} onPress={() => setObservation('observed-on-watch — owner visual report, this session only')} />
          <Button title="I do not see the test on Watch" disabled={busy} onPress={() => setObservation('not visible — owner visual report, this session only')} />
          <Text style={styles.body}>{observation}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>HealthKit · M2 deferred</Text>
          <Text style={styles.body}>HealthKit: not implemented (M2). Read permission unknown.</Text>
          <Button title="Request HealthKit permission · M2" disabled onPress={() => {}} />
          <Button title="Read running workouts · M2" disabled onPress={() => {}} />
          <Text style={styles.body}>No recorded activity is queried. Watch connectivity is not measured by this app.</Text>
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
