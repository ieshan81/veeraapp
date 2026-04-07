import type { Plant } from '@/types/database';
import type { UserPlantProgress } from '@/types/database';
import type { GamificationState } from '@/lib/gamification';

export type GreenGuruContext = {
  userPlantId?: string;
  nickname?: string | null;
  catalogName?: string | null;
  scientificName?: string | null;
  room?: string | null;
  waterLevel?: string | null;
  lightLevel?: string | null;
  summary?: string | null;
  nextWateringLabel?: string;
  reminderOn?: boolean;
  reminderTimeLabel?: string;
  progress: UserPlantProgress[];
  gamification: GamificationState | null;
};

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

/** Deterministic, on-device replies until a real model is wired. */
export function greenGuruReply(
  message: string,
  ctx: GreenGuruContext
): { text: string; citations: string[] } {
  const lower = message.toLowerCase();
  const citations: string[] = [];
  const name = ctx.nickname?.trim() || ctx.catalogName?.trim() || 'your plant';

  if (/\b(water|watering|thirsty|dry|soil)\b/.test(lower)) {
    if (ctx.waterLevel) citations.push(`Catalog: watering profile (${ctx.waterLevel}).`);
    return {
      text: `For ${name}, start from the plant profile: ${ctx.waterLevel ? `watering is marked “${ctx.waterLevel}”. ` : ''}${ctx.nextWateringLabel ? `Your next watering target is ${ctx.nextWateringLabel}. ` : ''}If the top inch of soil feels dry and the pot drains well, it is usually safe to water slowly until it runs through — then empty the saucer.`,
      citations,
    };
  }

  if (/\b(light|sun|window|shade)\b/.test(lower)) {
    if (ctx.lightLevel) citations.push(`Catalog: light (${ctx.lightLevel}).`);
    return {
      text: ctx.lightLevel
        ? `${name} is tagged for ${ctx.lightLevel.toLowerCase()} light in VEERA. Watch leaves: stretching or pale often means “more light”; crisp brown patches can mean “too much direct sun” for that species.`
        : `I don’t have a light tag for ${name} yet — open the catalog detail screen for the recommended placement, then match it to your brightest consistent window.`,
      citations,
    };
  }

  if (/\b(remind|schedule|when)\b/.test(lower)) {
    return {
      text: ctx.reminderOn
        ? `Reminders are on${ctx.reminderTimeLabel ? ` around ${ctx.reminderTimeLabel}` : ''}. ${ctx.nextWateringLabel ? `Your estimated next watering date is ${ctx.nextWateringLabel}.` : ''} You can tune this in My Plant anytime.`
        : `Reminders are off for ${name}. Turn them on in My Plant to get a daily nudge — VEERA will still show your next watering estimate on the home dashboard.`,
      citations,
    };
  }

  if (/\b(streak|points|progress|gamif)\b/.test(lower) && ctx.gamification) {
    return {
      text: `You’re at ${ctx.gamification.points} points with a ${ctx.gamification.streakDays}-day care streak. Logging check-ins (even quick ones) keeps the timeline meaningful.`,
      citations: ['Local VEERA progress'],
    };
  }

  if (ctx.summary) {
    citations.push('Plant overview from VEERA catalog');
    return {
      text: `${name}: ${clip(ctx.summary, 420)}`,
      citations,
    };
  }

  if (ctx.progress.length) {
    const last = ctx.progress[0];
    const bit = last.note?.trim() || (last.photo_storage_path ? 'Last entry included a photo.' : 'Last check-in recorded.');
    citations.push('Your latest care log');
    return {
      text: `Here’s what I see recently for ${name}: ${bit} Want tips on watering, light, or pests? Ask in one short sentence.`,
      citations,
    };
  }

  return {
    text: `I’m GreenGuru — focused on ${name}. Ask about watering, light, or what to do next. ${ctx.nextWateringLabel ? `(Next watering estimate: ${ctx.nextWateringLabel}.)` : ''}`,
    citations,
  };
}
