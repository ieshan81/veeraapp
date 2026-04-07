import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { insertUserPlant } from '@/lib/api/plants';
import { cancelPlantReminder, schedulePlantReminder } from '@/lib/reminders';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/lib/query-client';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

function toPgTime(s: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

export default function AddPlantScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const pid = Array.isArray(plantId) ? plantId[0] : plantId;
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [acquired, setAcquired] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!pid || !userId) {
      setError('Missing plant or user.');
      return;
    }
    setError(null);
    const pgTime = reminderOn ? toPgTime(reminderTime) : null;
    if (reminderOn && !pgTime) {
      setError('Reminder time must be HH:MM (24h), e.g. 09:00');
      return;
    }
    setLoading(true);
    try {
      const row = await insertUserPlant({
        user_id: userId,
        plant_id: pid,
        nickname: nickname.trim() || null,
        room: room.trim() || null,
        acquired_at: acquired.trim() ? acquired.trim() : null,
        notes: notes.trim() || null,
        reminder_enabled: reminderOn,
        reminder_time: pgTime,
      });
      await queryClient.invalidateQueries({ queryKey: qk.userPlants(userId) });
      const label = row.nickname?.trim() || 'your plant';
      if (row.reminder_enabled && row.reminder_time) {
        await schedulePlantReminder(row.id, label, row.reminder_time);
      } else {
        await cancelPlantReminder(row.id);
      }
      router.replace(`/(app)/my-plant/${row.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.h1}>Add to My Plants</Text>
      <Text style={styles.sub}>Create a personal instance — you can add the same species more than once.</Text>

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

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="Optional care notes"
        placeholderTextColor={theme.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View style={styles.row}>
        <Text style={styles.label}>Daily reminder</Text>
        <Switch value={reminderOn} onValueChange={setReminderOn} trackColor={{ true: theme.accentMuted }} />
      </View>
      {reminderOn ? (
        <>
          <Text style={styles.label}>Time (24h)</Text>
          <TextInput
            style={styles.input}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="09:00"
            placeholderTextColor={theme.textSecondary}
          />
        </>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Button title="Save plant" onPress={save} loading={loading} style={styles.btn} />
      <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 8 },
  sub: { fontSize: 15, color: theme.textSecondary, marginTop: 8, marginBottom: 16, lineHeight: 22 },
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
  area: { minHeight: 88, textAlignVertical: 'top' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  err: { color: theme.danger, marginTop: 12 },
  btn: { marginTop: 20 },
});
