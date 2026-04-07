import { Button } from '@/components/ui/Button';
import { BotanicalBackground } from '@/components/ui/BotanicalBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { fontFamily, theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import {
  fetchPlantPhotos,
  fetchProgress,
  fetchUserPlant,
  getSignedCatalogPhotoUrl,
  getSignedProgressPhotoUrl,
  updateUserPlant,
} from '@/lib/api/plants';
import { cancelPlantReminder, schedulePlantReminder } from '@/lib/reminders';
import { getGamificationState } from '@/lib/gamification';
import { describeNextCare, describeNextWatering } from '@/lib/schedule';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/providers/AuthProvider';
import type { Plant, UserPlantProgress } from '@/types/database';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toPgTime(s: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

function formatTimeDisplay(t: string | null): string {
  if (!t) return '09:00';
  const m = /^(\d{2}):(\d{2})/.exec(t);
  return m ? `${m[1]}:${m[2]}` : '09:00';
}

function ProgressThumb({ path }: { path: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    getSignedProgressPhotoUrl(path).then((u) => {
      if (!c) setUri(u);
    });
    return () => {
      c = true;
    };
  }, [path]);
  if (!uri) return <View style={styles.phSmall} />;
  return <Image source={{ uri }} style={styles.thumb} />;
}

export default function MyPlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rowId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const plantQ = useQuery({
    queryKey: qk.userPlant(rowId ?? '', userId),
    queryFn: () => fetchUserPlant(rowId!, userId),
    enabled: Boolean(rowId && userId),
  });

  const progressQ = useQuery({
    queryKey: qk.progress(rowId ?? '', userId),
    queryFn: () => fetchProgress(rowId!, userId),
    enabled: Boolean(rowId && userId),
  });

  const gamifyQ = useQuery({
    queryKey: ['gamification'],
    queryFn: () => getGamificationState(),
  });

  const catalog = plantQ.data?.plant as Plant | null | undefined;
  const photosQ = useQuery({
    queryKey: qk.plantPhotos(catalog?.id ?? ''),
    queryFn: () => fetchPlantPhotos(catalog!.id),
    enabled: Boolean(catalog?.id),
  });

  const coverPath = useMemo(() => {
    const list = photosQ.data ?? [];
    const cover = list.find((p) => p.is_cover);
    return cover?.storage_path ?? list[0]?.storage_path ?? null;
  }, [photosQ.data]);

  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    (async () => {
      if (!coverPath) {
        setHeroUrl(null);
        return;
      }
      const u = await getSignedCatalogPhotoUrl(coverPath);
      if (!c) setHeroUrl(u);
    })();
    return () => {
      c = true;
    };
  }, [coverPath]);

  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState('');
  const [acquired, setAcquired] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = plantQ.data;
    if (!p) return;
    setNickname(p.nickname ?? '');
    setRoom(p.room ?? '');
    setAcquired(p.acquired_at ?? '');
    setNotes(p.notes ?? '');
    setReminderOn(p.reminder_enabled);
    setReminderTime(formatTimeDisplay(p.reminder_time));
  }, [plantQ.data]);

  const save = async () => {
    if (!rowId || !userId || !plantQ.data) return;
    const pgTime = reminderOn ? toPgTime(reminderTime) : null;
    if (reminderOn && !pgTime) return;
    setSaving(true);
    try {
      const updated = await updateUserPlant(rowId, userId, {
        nickname: nickname.trim() || null,
        room: room.trim() || null,
        acquired_at: acquired.trim() || null,
        notes: notes.trim() || null,
        reminder_enabled: reminderOn,
        reminder_time: pgTime,
      });
      await queryClient.invalidateQueries({ queryKey: qk.userPlants(userId) });
      await queryClient.invalidateQueries({ queryKey: qk.userPlant(rowId, userId) });
      const label = updated.nickname?.trim() || catalog?.common_name || 'your plant';
      if (updated.reminder_enabled && updated.reminder_time) {
        await schedulePlantReminder(updated.id, label, updated.reminder_time);
      } else {
        await cancelPlantReminder(updated.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const journeyMilestones = useMemo(() => {
    const p = plantQ.data;
    if (!p) return [];
    const items: { label: string; date: Date; detail: string }[] = [];
    items.push({
      label: 'Joined VEERA',
      date: new Date(p.created_at),
      detail: 'Care plan and reminders initialized from the catalog.',
    });
    if (p.acquired_at) {
      items.push({
        label: 'In your space',
        date: new Date(p.acquired_at),
        detail: 'You noted when this plant arrived.',
      });
    }
    for (const e of progressQ.data ?? []) {
      items.push({
        label: e.note?.trim() ? 'Check-in' : e.photo_storage_path ? 'Photo log' : 'Progress',
        date: new Date(e.created_at),
        detail:
          e.note?.trim() ||
          (e.photo_storage_path ? 'Added a progress photo.' : 'Logged a care moment.'),
      });
    }
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items.slice(0, 12);
  }, [plantQ.data, progressQ.data]);

  if (!rowId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ color: theme.textLight }}>Invalid plant.</Text>
      </View>
    );
  }

  if (plantQ.isPending) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.accentLight} size="large" />
      </View>
    );
  }

  if (plantQ.isError || !plantQ.data) {
    return (
      <ScrollView
        contentContainerStyle={[styles.center, { paddingTop: insets.top + 40 }]}
        style={{ backgroundColor: theme.bg }}
      >
        <ErrorState message={(plantQ.error as Error).message} onRetry={() => plantQ.refetch()} />
      </ScrollView>
    );
  }

  const p = plantQ.data;
  const nextCare = describeNextCare({
    reminder_enabled: p.reminder_enabled,
    reminder_time: p.reminder_time,
  });
  const nextWater =
    catalog && p
      ? describeNextWatering({
          waterLevel: catalog.water_level,
          acquiredAt: p.acquired_at,
          userPlantCreatedAt: p.created_at,
        })
      : null;
  const latest = progressQ.data?.[0];

  return (
    <BotanicalBackground variant="dark">
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 52 }}>
      {/* Hero area */}
      <View style={{ paddingTop: headerHeight }}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPh]}>
            <Text style={styles.heroLetter}>
              {(p.nickname || catalog?.common_name || 'P').slice(0, 1)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.pad}>
        <Text style={styles.title}>
          {p.nickname || catalog?.common_name || 'Plant'}
        </Text>
        {catalog?.scientific_name ? (
          <Text style={styles.sci}>{catalog.scientific_name}</Text>
        ) : null}

        {/* Schedule card */}
        <GlassCard dark style={styles.scheduleCard}>
          <Text style={styles.scheduleLabel}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Ionicons name="water-outline" size={18} color={theme.accentLight} />
              <Text style={styles.scheduleItemLabel}>Water</Text>
              <Text style={styles.scheduleItemValue}>
                {p.reminder_enabled ? formatTimeDisplay(p.reminder_time) : 'Off'}
              </Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Ionicons name="time-outline" size={18} color={theme.accentLight} />
              <Text style={styles.scheduleItemLabel}>Reminder</Text>
              <Text style={styles.scheduleItemValue}>
                {p.reminder_enabled ? 'Daily' : 'Off'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Next Watering */}
        <GlassCard dark style={styles.nextCareCard}>
          <Text style={styles.nextCareHeadline}>{nextCare.headline}</Text>
          <Text style={styles.nextCareSub}>{nextCare.sub}</Text>
          <Text style={styles.nextCareMeta}>
            Daily time · {formatTimeDisplay(p.reminder_time)} · Reminder{' '}
            {p.reminder_enabled ? 'on' : 'off'}
          </Text>
        </GlassCard>

        {nextWater ? (
          <GlassCard dark style={styles.waterEst}>
            <Text style={styles.nextCareHeadline}>Watering estimate</Text>
            <Text style={styles.nextCareSub}>{nextWater.sub}</Text>
            <Text style={styles.nextCareMeta}>
              Based on catalog watering profile
              {catalog?.water_level ? ` (${catalog.water_level})` : ''}.
            </Text>
          </GlassCard>
        ) : null}

        {gamifyQ.data ? (
          <GlassCard dark style={styles.gamifyStrip}>
            <View style={styles.gamifyInner}>
              <View>
                <Text style={styles.gamifyLabel}>Your progress</Text>
                <Text style={styles.gamifySub}>
                  {gamifyQ.data.points} pts · {gamifyQ.data.streakDays}-day streak
                </Text>
              </View>
              <View style={styles.gamifyRing}>
                <Text style={styles.gamifyRingText}>{gamifyQ.data.careCompletions}</Text>
                <Text style={styles.gamifyRingLbl}>logs</Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        <Pressable
          style={styles.guruBtn}
          onPress={() => router.push(`/(app)/greenguru?userPlantId=${p.id}` as Href)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.textLight} />
          <Text style={styles.guruBtnText}>Ask GreenGuru</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>

        {/* Latest growth */}
        {latest ? (
          <GlassCard dark style={styles.latestCard}>
            <Text style={styles.latestLabel}>Latest Progress</Text>
            <Text style={styles.latestText} numberOfLines={4}>
              {latest.note?.trim() ||
                (latest.photo_storage_path
                  ? 'New progress photo added.'
                  : 'Check-in logged.')}
            </Text>
            {latest.photo_storage_path ? (
              <ProgressThumb path={latest.photo_storage_path} />
            ) : null}
          </GlassCard>
        ) : null}

        <Button
          title="View catalog details"
          variant="ghost"
          textStyle={{ color: theme.accentLight }}
          disabled={!catalog?.id}
          onPress={() => catalog?.id && router.push(`/(app)/plant/${catalog.id}`)}
          style={styles.catalogLink}
        />

        {/* Your Details Section */}
        <Text style={styles.sectionTitle}>Your Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholderTextColor={theme.textMuted}
            placeholder="My little Monstera…"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Room</Text>
          <TextInput
            style={styles.input}
            value={room}
            onChangeText={setRoom}
            placeholderTextColor={theme.textMuted}
            placeholder="Living room"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Acquired (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={acquired}
            onChangeText={setAcquired}
            placeholderTextColor={theme.textMuted}
            placeholder="2025-01-15"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.area]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={theme.textMuted}
            placeholder="Anything you want to remember…"
          />
        </View>

        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Daily Reminder</Text>
            <Text style={styles.reminderHint}>
              {reminderOn ? 'Tap to disable' : 'Enable daily watering reminder'}
            </Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={setReminderOn}
            trackColor={{
              false: 'rgba(255,255,255,0.12)',
              true: theme.accentMuted,
            }}
            thumbColor="#fff"
          />
        </View>

        {reminderOn ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Time (24h)</Text>
            <TextInput
              style={styles.input}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholderTextColor={theme.textMuted}
              placeholder="09:00"
            />
          </View>
        ) : null}

        <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>

        {/* Growth + Progress */}
        <Text style={styles.sectionTitle}>Growth & Progress</Text>

        <Pressable
          style={styles.addProgressBtn}
          onPress={() => router.push(`/(app)/add-progress?userPlantId=${p.id}`)}
        >
          <Text style={styles.addProgressText}>Add Progress Entry</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Plant journey</Text>
        <Text style={styles.journeyHint}>
          We build a timeline from your add date, reminders, and logs — add photos anytime.
        </Text>
        {journeyMilestones.map((m, idx) => (
          <GlassCard dark key={`${m.label}-${idx}`} style={styles.journeyCard}>
            <Text style={styles.journeyDate}>
              {m.date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.journeyTitle}>{m.label}</Text>
            <Text style={styles.journeyDetail}>{m.detail}</Text>
          </GlassCard>
        ))}

        {progressQ.isPending ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={theme.accentLight} />
        ) : (
          (progressQ.data ?? []).map((e: UserPlantProgress) => (
            <GlassCard dark key={e.id} style={styles.entry}>
              <Text style={styles.entryDate}>
                {new Date(e.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
              {e.note ? <Text style={styles.entryNote}>{e.note}</Text> : null}
              <View style={styles.tagRow}>
                {e.health_tag ? (
                  <View style={styles.entryTag}>
                    <Text style={styles.entryTagText}>Health: {e.health_tag}</Text>
                  </View>
                ) : null}
                {e.issue_tag ? (
                  <View style={styles.entryTag}>
                    <Text style={styles.entryTagText}>Issue: {e.issue_tag}</Text>
                  </View>
                ) : null}
                {e.height_estimate != null ? (
                  <View style={styles.entryTag}>
                    <Text style={styles.entryTagText}>H: {e.height_estimate} cm</Text>
                  </View>
                ) : null}
              </View>
              {e.photo_storage_path ? <ProgressThumb path={e.photo_storage_path} /> : null}
            </GlassCard>
          ))
        )}
      </View>
    </ScrollView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.bg,
  },

  // Hero
  hero: { width: '100%', height: 220, backgroundColor: theme.bgElevated, borderRadius: theme.radiusLg, marginHorizontal: 0 },
  heroPh: { justifyContent: 'center', alignItems: 'center' },
  heroLetter: {
    fontSize: 64,
    fontWeight: '200',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },

  pad: { paddingHorizontal: 20, marginTop: 16 },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  sci: {
    fontSize: 15,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    fontFamily: fontFamily.body,
  },

  // Schedule
  scheduleCard: { marginTop: 20 },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
    marginBottom: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  scheduleItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
    fontFamily: fontFamily.semi,
  },
  scheduleItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  scheduleDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // Next Care
  nextCareCard: { marginTop: 12 },
  nextCareHeadline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.accentLight,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  nextCareSub: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  nextCareMeta: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
  },

  waterEst: { marginTop: 12 },

  gamifyStrip: { marginTop: 12 },
  gamifyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gamifyLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  gamifySub: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
  },
  gamifyRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(114,191,155,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamifyRingText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },
  gamifyRingLbl: {
    fontSize: 9,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },

  guruBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  guruBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
  },

  journeyHint: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },
  journeyCard: {
    marginBottom: 10,
  },
  journeyDate: {
    fontSize: 12,
    color: theme.accentLight,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  journeyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textLight,
    marginTop: 6,
    fontFamily: fontFamily.displayBold,
  },
  journeyDetail: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },

  // Latest
  latestCard: { marginTop: 12 },
  latestLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  latestText: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.80)',
    fontFamily: fontFamily.body,
  },
  catalogLink: { marginTop: 12 },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.textMuted,
    marginTop: 28,
    marginBottom: 14,
    fontFamily: fontFamily.semi,
  },

  // Fields
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
    fontFamily: fontFamily.semi,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textLight,
    backgroundColor: 'rgba(255,255,255,0.06)',
    fontFamily: fontFamily.body,
  },
  area: { minHeight: 80, textAlignVertical: 'top' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
  },
  reminderHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
    fontFamily: fontFamily.body,
  },

  // Buttons
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadow.soft,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.semi,
    letterSpacing: 0.3,
  },
  addProgressBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  addProgressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.semi,
    letterSpacing: 0.3,
  },

  // Progress entries
  entry: { marginTop: 12 },
  entryDate: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 6,
    fontFamily: fontFamily.body,
  },
  entryNote: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
    fontFamily: fontFamily.body,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  entryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radiusFull,
    backgroundColor: 'rgba(114,191,155,0.15)',
  },
  entryTagText: {
    fontSize: 12,
    color: theme.accentLight,
    fontWeight: '600',
    fontFamily: fontFamily.semi,
  },
  thumb: {
    width: '100%',
    height: 180,
    borderRadius: theme.radiusMd,
    marginTop: 12,
  },
  phSmall: { height: 4 },
});
