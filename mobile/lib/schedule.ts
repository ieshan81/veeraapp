import { nextWateringDate, wateringIntervalDays } from '@/lib/care-plan';

/** Human-readable next daily reminder from DB time (HH:MM:SS) and toggle. */
export function describeNextCare(params: {
  reminder_enabled: boolean;
  reminder_time: string | null;
}): { headline: string; sub: string } {
  if (!params.reminder_enabled || !params.reminder_time) {
    return {
      headline: 'No reminder yet',
      sub: 'Turn on a daily reminder to get a gentle nudge for this plant.',
    };
  }
  const m = /^(\d{1,2}):(\d{2})/.exec(params.reminder_time.trim());
  if (!m) {
    return { headline: 'Daily reminder on', sub: 'You will get a local notification each day.' };
  }
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const timeLabel = next.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const dateLabel = next.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  return {
    headline: 'Next care',
    sub: `${dateLabel} · ${timeLabel}`,
  };
}

/** Estimated next watering window from catalog + personal dates (client-side). */
export function describeNextWatering(params: {
  waterLevel: string | null | undefined;
  acquiredAt: string | null;
  userPlantCreatedAt: string;
}): { headline: string; sub: string; date: Date } {
  const interval = wateringIntervalDays(params.waterLevel);
  const date = nextWateringDate({
    anchorIso: params.acquiredAt,
    fallbackIso: params.userPlantCreatedAt,
    intervalDays: interval,
  });
  const sub = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return {
    headline: 'Next watering',
    sub,
    date,
  };
}

export function formatReminderClock(reminderTime: string | null | undefined): string {
  if (!reminderTime) return '—';
  const m = /^(\d{1,2}):(\d{2})/.exec(reminderTime.trim());
  return m ? `${m[1]}:${m[2]}` : '—';
}
