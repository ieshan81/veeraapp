import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'veera_scheduled_reminder_ids';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function loadMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveMap(map: Record<string, string>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function parseTime(t: string | null): { hour: number; minute: number } | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export async function schedulePlantReminder(
  userPlantId: string,
  label: string,
  reminderTime: string | null
): Promise<void> {
  const parsed = parseTime(reminderTime);
  const map = await loadMap();
  const existing = map[userPlantId];
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});
    delete map[userPlantId];
  }
  if (!parsed) {
    await saveMap(map);
    return;
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'VEERA',
      body: `Care check: ${label}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
      channelId: 'default',
    },
  });
  map[userPlantId] = id;
  await saveMap(map);
}

export async function cancelPlantReminder(userPlantId: string): Promise<void> {
  const map = await loadMap();
  const existing = map[userPlantId];
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});
    delete map[userPlantId];
    await saveMap(map);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
