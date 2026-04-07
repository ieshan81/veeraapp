import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { BotanicalBackground } from '@/components/ui/BotanicalBackground';
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

export default function MyPlantsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: qk.userPlants(userId),
    queryFn: () => fetchUserPlants(userId),
    enabled: Boolean(userId),
  });

  return (
    <BotanicalBackground variant="dark">
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <VeeraLogo size="sm" variant="onDark" />
        </View>

        <Text style={styles.h1}>My Plants</Text>
        <Text style={styles.sub}>
          Each card is one plant you track — duplicates are OK.
        </Text>

        {isPending ? (
          <View style={styles.skelWrap}>
            <Skeleton height={100} radius={theme.radiusLg} dark style={styles.skelItem} />
            <Skeleton height={100} radius={theme.radiusLg} dark style={styles.skelItem} />
            <Skeleton height={100} radius={theme.radiusLg} dark />
          </View>
        ) : isError ? (
          <ErrorState
            message={(error as Error).message}
            onRetry={() => refetch()}
          />
        ) : !data?.length ? (
          <GlassCard dark style={{ marginTop: 16 }}>
            <EmptyState
              title="Nothing here yet"
              subtitle="Add a plant from a catalog detail screen."
              light
            />
          </GlassCard>
        ) : (
          <View style={styles.list}>
            {data.map((p) => {
              const care = describeNextCare({
                reminder_enabled: p.reminder_enabled,
                reminder_time: p.reminder_time,
              });
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/(app)/my-plant/${p.id}`)}
                >
                  <GlassCard dark style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardAvatar}>
                        <Text style={styles.cardAvatarText}>
                          {(p.nickname || p.plant?.common_name || 'P')
                            .slice(0, 1)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {p.nickname || p.plant?.common_name || 'Plant'}
                        </Text>
                        {p.plant?.scientific_name ? (
                          <Text style={styles.cardSci} numberOfLines={1}>
                            {p.plant.scientific_name}
                          </Text>
                        ) : null}
                        <Text style={styles.cardSchedule} numberOfLines={1}>
                          {care.headline} · {care.sub}
                        </Text>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.badge,
                              p.reminder_enabled && styles.badgeActive,
                            ]}
                          >
                            <Ionicons
                              name={
                                p.reminder_enabled
                                  ? 'notifications'
                                  : 'notifications-off-outline'
                              }
                              size={11}
                              color={
                                p.reminder_enabled
                                  ? theme.accentLight
                                  : theme.textMuted
                              }
                            />
                            <Text
                              style={[
                                styles.badgeText,
                                p.reminder_enabled && styles.badgeTextActive,
                              ]}
                            >
                              {p.reminder_enabled ? 'On' : 'Off'}
                            </Text>
                          </View>
                          {p.room ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{p.room}</Text>
                            </View>
                          ) : null}
                        </View>
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
            })}
          </View>
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
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  sub: {
    fontSize: 15,
    color: theme.textMuted,
    marginTop: 6,
    marginBottom: 20,
    fontFamily: fontFamily.body,
  },

  // Skeleton
  skelWrap: { marginTop: 8 },
  skelItem: { marginBottom: 10 },

  // List
  list: { gap: 10 },

  // Card
  card: { padding: 16 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(114,191,155,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  cardSci: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    fontFamily: fontFamily.body,
  },
  cardSchedule: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeActive: {
    backgroundColor: 'rgba(114,191,155,0.12)',
  },
  badgeText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    fontFamily: fontFamily.semi,
  },
  badgeTextActive: {
    color: theme.accentLight,
  },
});
