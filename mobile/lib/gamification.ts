import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'veera_gamification_v1';

export type GamificationState = {
  points: number;
  streakDays: number;
  lastCareDate: string | null;
  careCompletions: number;
};

const defaultState = (): GamificationState => ({
  points: 0,
  streakDays: 0,
  lastCareDate: null,
  careCompletions: 0,
});

async function load(): Promise<GamificationState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaultState();
  try {
    return { ...defaultState(), ...(JSON.parse(raw) as GamificationState) };
  } catch {
    return defaultState();
  }
}

async function save(s: GamificationState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/** Call when the user completes a meaningful care action (e.g. progress entry). */
export async function recordCareCompletion(): Promise<GamificationState> {
  const prev = await load();
  const today = dayKey(new Date());
  if (prev.lastCareDate === today) {
    const next: GamificationState = {
      ...prev,
      points: prev.points + 5,
      careCompletions: prev.careCompletions + 1,
    };
    await save(next);
    return next;
  }
  let streak = 1;
  if (prev.lastCareDate === yesterdayKey()) {
    streak = prev.streakDays + 1;
  } else if (prev.lastCareDate) {
    streak = 1;
  }
  const points = prev.points + 15 + Math.min(streak, 14);
  const next: GamificationState = {
    points,
    streakDays: streak,
    lastCareDate: today,
    careCompletions: prev.careCompletions + 1,
  };
  await save(next);
  return next;
}

export async function getGamificationState(): Promise<GamificationState> {
  return load();
}
