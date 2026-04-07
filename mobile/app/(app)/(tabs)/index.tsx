import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { fontFamily, theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { fetchUserPlants } from '@/lib/api/plants';
import { describeNextCare } from '@/lib/schedule';
import { useAuth } from '@/providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const recent = plants?.slice(0, 4) ?? [];
  const tracked = plants?.length ?? 0;
  const withReminders = plants?.filter((p) => p.reminder_enabled).length ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <VeeraLogo size="sm" light />
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>
          {timeGreeting()},{'\n'}
          {firstName(profile?.display_name)}.
        </Text>
        <Text style={styles.tagline}>Nurture your plants with care</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
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
});
