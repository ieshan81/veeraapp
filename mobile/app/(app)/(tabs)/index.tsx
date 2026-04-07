import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { BotanicalBackground } from '@/components/ui/BotanicalBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { fontFamily, theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { getGamificationState } from '@/lib/gamification';
import { fetchUserPlants } from '@/lib/api/plants';
import { LAST_ADDED_PLANT_ID_KEY } from '@/lib/storage-keys';
import { describeNextCare, describeNextWatering, formatReminderClock } from '@/lib/schedule';
import { useAuth } from '@/providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function firstName(display: string | null | undefined): string {
  if (!display?.trim()) return 'there';
  return display.trim().split(/\s+/)[0] ?? 'there';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const userId = user?.id ?? '';
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const gamifyQ = useQuery({
    queryKey: ['gamification'],
    queryFn: () => getGamificationState(),
  });

  const {
    data: plants,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.userPlants(userId),
    queryFn: () => fetchUserPlants(userId),
    enabled: Boolean(userId),
  });

  useFocusEffect(
    useCallback(() => {
      void gamifyQ.refetch();
      void (async () => {
        const raw = await AsyncStorage.getItem(LAST_ADDED_PLANT_ID_KEY);
        if (raw) {
          setCelebrateId(raw);
          await AsyncStorage.removeItem(LAST_ADDED_PLANT_ID_KEY);
        }
      })();
    }, [gamifyQ.refetch])
  );

  const recent = plants?.slice(0, 4) ?? [];
  const tracked = plants?.length ?? 0;
  const withReminders = plants?.filter((p) => p.reminder_enabled).length ?? 0;

  const spotlight = plants?.[0];
  const nextWater =
    spotlight?.plant && spotlight
      ? describeNextWatering({
          waterLevel: spotlight.plant.water_level,
          acquiredAt: spotlight.acquired_at,
          userPlantCreatedAt: spotlight.created_at,
        })
      : null;

  return (
    <BotanicalBackground variant="dark">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <VeeraLogo size="sm" variant="onDark" />
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>
          {timeGreeting()},{'\n'}
          {firstName(profile?.display_name)}.
        </Text>
        <Text style={styles.tagline}>Nurture your plants with care</Text>

        {celebrateId ? (
          <GlassCard dark style={styles.celebrate}>
            <Text style={styles.celebrateTitle}>Plant added</Text>
            <Text style={styles.celebrateSub}>You’re set — care plan and reminders are ready.</Text>
            <Pressable
              style={styles.celebrateBtn}
              onPress={() => {
                router.push(`/(app)/my-plant/${celebrateId}`);
                setCelebrateId(null);
              }}
            >
              <Text style={styles.celebrateBtnText}>Open plant</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.accentLight} />
            </Pressable>
          </GlassCard>
        ) : null}

        {/* Care plan overview */}
        {spotlight && nextWater ? (
          <GlassCard dark style={styles.planHero}>
            <View style={styles.planHeroTop}>
              <View>
                <Text style={styles.planKicker}>Care plan</Text>
                <Text style={styles.planTitle} numberOfLines={1}>
                  {spotlight.nickname || spotlight.plant?.common_name || 'Your plant'}
                </Text>
              </View>
              <View style={styles.planRing}>
                <Text style={styles.planRingNum}>
                  {Math.min(100, 12 + (plants?.length ?? 0) * 6)}
                </Text>
                <Text style={styles.planRingLbl}>ready</Text>
              </View>
            </View>
            <View style={styles.planRow}>
              <View style={styles.planPill}>
                <Ionicons name="water" size={16} color={theme.accentLight} />
                <Text style={styles.planPillText}>{nextWater.sub}</Text>
              </View>
              <View style={styles.planPill}>
                <Ionicons name="notifications" size={16} color={theme.accentLight} />
                <Text style={styles.planPillText}>
                  {spotlight.reminder_enabled
                    ? formatReminderClock(spotlight.reminder_time)
                    : 'Off'}
                </Text>
              </View>
            </View>
            <View style={styles.planBar}>
              <View
                style={[
                  styles.planBarFill,
                  { width: `${Math.min(100, 20 + (withReminders / Math.max(tracked, 1)) * 80)}%` },
                ]}
              />
            </View>
            <Text style={styles.planMeta}>
              {tracked} plant{tracked === 1 ? '' : 's'} · {withReminders} reminder
              {withReminders === 1 ? '' : 's'}
            </Text>
          </GlassCard>
        ) : null}

        {gamifyQ.data ? (
          <View style={styles.gamifyRow}>
            <GlassCard dark style={styles.gamifyCard}>
              <Text style={styles.gamifyLabel}>Streak</Text>
              <Text style={styles.gamifyValue}>{gamifyQ.data.streakDays}d</Text>
            </GlassCard>
            <GlassCard dark style={styles.gamifyCard}>
              <Text style={styles.gamifyLabel}>Points</Text>
              <Text style={styles.gamifyValue}>{gamifyQ.data.points}</Text>
            </GlassCard>
            <GlassCard dark style={styles.gamifyCard}>
              <Text style={styles.gamifyLabel}>Care logs</Text>
              <Text style={styles.gamifyValue}>{gamifyQ.data.careCompletions}</Text>
            </GlassCard>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            spotlight?.id
              ? router.push(`/(app)/greenguru?userPlantId=${spotlight.id}` as Href)
              : router.push('/(app)/greenguru' as Href)
          }
          style={styles.guruCard}
        >
          <GlassCard dark style={styles.guruInner}>
            <View style={styles.guruIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.textLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guruTitle}>GreenGuru</Text>
              <Text style={styles.guruSub}>Plant-care companion — tuned to your plants and logs.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </GlassCard>
        </Pressable>

        {/* Quick Scan CTA */}
        <Pressable onPress={() => router.push('/(app)/(tabs)/scan')}>
          <GlassCard dark style={styles.scanCard}>
            <View style={styles.scanRow}>
              <View style={styles.scanIconWrap}>
                <Ionicons name="qr-code" size={22} color={theme.textLight} />
              </View>
              <Text style={styles.scanText}>Quick Scan</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </View>
          </GlassCard>
        </Pressable>

        {/* Care Overview */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Care Overview</Text>
        </View>

        <View style={styles.statRow}>
          <GlassCard dark style={styles.statCard}>
            <Ionicons name="leaf" size={20} color={theme.accentLight} />
            <Text style={styles.statNum}>{tracked}</Text>
            <Text style={styles.statLabel}>Plants{'\n'}Tracked</Text>
          </GlassCard>
          <GlassCard dark style={styles.statCard}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.accentLight}
            />
            <Text style={styles.statNum}>{withReminders}</Text>
            <Text style={styles.statLabel}>Reminders{'\n'}Active</Text>
          </GlassCard>
        </View>

        {/* Recently Added */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
        </View>

        {isPending ? (
          <View style={styles.skelWrap}>
            <Skeleton height={80} radius={theme.radiusLg} dark style={styles.skelItem} />
            <Skeleton height={80} radius={theme.radiusLg} dark style={styles.skelItem} />
            <Skeleton height={80} radius={theme.radiusLg} dark />
          </View>
        ) : isError ? (
          <ErrorState
            message={(error as Error).message}
            onRetry={() => refetch()}
          />
        ) : recent.length === 0 ? (
          <GlassCard dark style={styles.emptyCard}>
            <EmptyState
              title="No plants yet"
              subtitle="Scan a QR code or open a plant link to start."
              light
            />
          </GlassCard>
        ) : (
          recent.map((p) => {
            const care = describeNextCare({
              reminder_enabled: p.reminder_enabled,
              reminder_time: p.reminder_time,
            });
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/(app)/my-plant/${p.id}`)}
              >
                <GlassCard dark style={styles.plantCard}>
                  <View style={styles.plantCardInner}>
                    <View style={styles.plantAvatar}>
                      <Text style={styles.plantAvatarText}>
                        {(
                          p.nickname ||
                          p.plant?.common_name ||
                          'P'
                        )
                          .slice(0, 1)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.plantInfo}>
                      <Text style={styles.plantName} numberOfLines={1}>
                        {p.nickname || p.plant?.common_name || 'Plant'}
                      </Text>
                      <Text style={styles.plantCare} numberOfLines={1}>
                        {care.headline} · {care.sub}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.textMuted}
                    />
                  </View>
                </GlassCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
    lineHeight: 38,
  },
  tagline: {
    fontSize: 15,
    color: theme.textMuted,
    marginTop: 6,
    marginBottom: 24,
    fontFamily: fontFamily.body,
  },

  // Quick Scan
  scanCard: {
    marginBottom: 28,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
    letterSpacing: 0.3,
  },

  // Section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontFamily: fontFamily.semi,
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  statLabel: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    fontFamily: fontFamily.body,
    lineHeight: 17,
  },

  // Plants list
  skelWrap: { marginTop: 4 },
  skelItem: { marginBottom: 10 },
  emptyCard: { paddingVertical: 8 },
  plantCard: {
    marginBottom: 10,
  },
  plantCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  plantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(114,191,155,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },
  plantInfo: {
    flex: 1,
    gap: 3,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
  },
  plantCare: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
  },

  celebrate: {
    marginBottom: 16,
    paddingVertical: 14,
  },
  celebrateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  celebrateSub: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
    fontFamily: fontFamily.body,
  },
  celebrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  celebrateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.accentLight,
    fontFamily: fontFamily.semi,
  },

  planHero: {
    marginBottom: 16,
  },
  planHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  planKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textLight,
    marginTop: 4,
    fontFamily: fontFamily.displayBold,
  },
  planRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(114,191,155,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRingNum: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },
  planRingLbl: {
    fontSize: 9,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: fontFamily.semi,
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  planPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.radiusMd,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  planPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
  },
  planBar: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  planBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.accentMuted,
  },
  planMeta: {
    marginTop: 10,
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
  },

  gamifyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gamifyCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  gamifyLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: fontFamily.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  gamifyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textLight,
    marginTop: 4,
    fontFamily: fontFamily.displayBold,
  },

  guruCard: { marginBottom: 20 },
  guruInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guruIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(114,191,155,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guruTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  guruSub: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
    fontFamily: fontFamily.body,
  },
});
