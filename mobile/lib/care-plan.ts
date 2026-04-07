import type { Plant } from '@/types/database';

/** Heuristic watering interval from catalog text (no extra DB columns). */
export function wateringIntervalDays(waterLevel: string | null | undefined): number {
  const w = (waterLevel || '').toLowerCase();
  if (w.includes('low') || w.includes('drought') || w.includes('succulent')) return 14;
  if (w.includes('high') || w.includes('frequent') || w.includes('moist') || w.includes('wet')) return 3;
  if (w.includes('moderate') || w.includes('medium') || w.includes('average')) return 7;
  return 7;
}

export function defaultDailyReminderTime(): string {
  return '09:00:00';
}

/** Next calendar date for a recurring watering interval anchored to add/acquire date. */
export function nextWateringDate(params: {
  anchorIso: string | null;
  fallbackIso: string;
  intervalDays: number;
  now?: Date;
}): Date {
  const now = params.now ?? new Date();
  let anchor = params.anchorIso ? new Date(params.anchorIso) : new Date(params.fallbackIso);
  if (Number.isNaN(anchor.getTime())) anchor = new Date(params.fallbackIso);
  anchor.setHours(12, 0, 0, 0);
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);
  const d = new Date(anchor);
  while (d < target) {
    d.setDate(d.getDate() + params.intervalDays);
  }
  return d;
}

export function carePlanSummary(plant: Pick<Plant, 'water_level' | 'light_level' | 'common_name'>): string[] {
  const lines: string[] = [];
  const w = wateringIntervalDays(plant.water_level);
  lines.push(`Water about every ${w} days (based on this plant’s profile).`);
  if (plant.light_level?.trim()) {
    lines.push(`Light: ${plant.light_level}.`);
  }
  lines.push(`Daily reminder at a gentle time — adjust anytime in My Plant.`);
  return lines;
}
