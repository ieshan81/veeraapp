import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { fetchPlant, insertUserPlant } from '@/lib/api/plants';
import { carePlanSummary, defaultDailyReminderTime } from '@/lib/care-plan';
import { queryClient } from '@/lib/query-client';
import { schedulePlantReminder } from '@/lib/reminders';
import { LAST_ADDED_PLANT_ID_KEY } from '@/lib/storage-keys';
import { useAuth } from '@/providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddPlantScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const pid = Array.isArray(plantId) ? plantId[0] : plantId;
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const plantQ = useQuery({
    queryKey: qk.plant(pid ?? ''),
    queryFn: () => fetchPlant(pid!),
    enabled: Boolean(pid),
  });

  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [acquired, setAcquired] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalog = plantQ.data;

  const save = async () => {
    if (!pid || !userId) {
      setError('Missing plant or user.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const reminderTime = defaultDailyReminderTime();
      const row = await insertUserPlant({
        user_id: userId,
        plant_id: pid,
        nickname: nickname.trim() || null,
        room: room.trim() || null,
        acquired_at: acquired.trim() ? acquired.trim() : null,
        notes: null,
        reminder_enabled: true,
        reminder_time: reminderTime,
      });
      await queryClient.invalidateQueries({ queryKey: qk.userPlants(userId) });
      const label = row.nickname?.trim() || catalog?.common_name || 'your plant';
      await schedulePlantReminder(row.id, label, row.reminder_time);
      await AsyncStorage.setItem(LAST_ADDED_PLANT_ID_KEY, row.id);
      router.replace('/(app)/(tabs)');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.h1}>Add to My Plants</Text>
      <Text style={styles.sub}>
        VEERA sets reminders and a watering estimate from this plant’s profile — no care notes needed here.
      </Text>

      {catalog ? (
        <View style={styles.planBox}>
          <Text style={styles.planTitle}>Your care plan preview</Text>
          {carePlanSummary(catalog).map((line, i) => (
            <Text key={i} style={styles.planLine}>
              • {line}
            </Text>
          ))}
        </View>
      ) : plantQ.isPending ? (
        <Text style={styles.hint}>Loading plant…</Text>
      ) : null}

      <Text style={styles.label}>Nickname</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Kitchen Monstera"
        placeholderTextColor={theme.textSecondary}
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>Room / location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Living room east window"
        placeholderTextColor={theme.textSecondary}
        value={room}
        onChangeText={setRoom}
      />

      <Text style={styles.label}>Acquired date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="optional"
        placeholderTextColor={theme.textSecondary}
        value={acquired}
        onChangeText={setAcquired}
      />

      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Button title="Save plant" onPress={save} loading={loading} style={styles.btn} />
      <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 8 },
  sub: { fontSize: 15, color: theme.textSecondary, marginTop: 8, marginBottom: 12, lineHeight: 22 },
  planBox: {
    backgroundColor: theme.accentSoft,
    borderRadius: theme.radiusMd,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  planTitle: { fontSize: 13, fontWeight: '700', color: theme.accent, marginBottom: 8 },
  planLine: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 4 },
  hint: { fontSize: 14, color: theme.textSecondary, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surfaceElevated,
  },
  err: { color: theme.danger, marginTop: 12 },
  btn: { marginTop: 20 },
});
