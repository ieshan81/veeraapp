import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { fontFamily, theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import {
  fetchPlant,
  fetchPlantPhotos,
  fetchPlantSections,
  fetchPlantTags,
  getSignedCatalogPhotoUrl,
} from '@/lib/api/plants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CareItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <GlassCard dark style={styles.careCard}>
      <Ionicons name={icon} size={22} color={theme.accentLight} />
      <Text style={styles.careLabel}>{label}</Text>
      <Text style={styles.careValue}>{value}</Text>
    </GlassCard>
  );
}

export default function CatalogPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  const plantQ = useQuery({
    queryKey: qk.plant(plantId ?? ''),
    queryFn: () => fetchPlant(plantId!),
    enabled: Boolean(plantId),
  });

  const photosQ = useQuery({
    queryKey: qk.plantPhotos(plantId ?? ''),
    queryFn: () => fetchPlantPhotos(plantId!),
    enabled: Boolean(plantId),
  });

  const tagsQ = useQuery({
    queryKey: qk.plantTags(plantId ?? ''),
    queryFn: () => fetchPlantTags(plantId!),
    enabled: Boolean(plantId),
  });

  const sectionsQ = useQuery({
    queryKey: qk.plantSections(plantId ?? ''),
    queryFn: () => fetchPlantSections(plantId!),
    enabled: Boolean(plantId),
  });

  const coverPath = useMemo(() => {
    const list = photosQ.data ?? [];
    const cover = list.find((p) => p.is_cover);
    return cover?.storage_path ?? list[0]?.storage_path ?? null;
  }, [photosQ.data]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!coverPath) {
        setHeroUrl(null);
        return;
      }
      const url = await getSignedCatalogPhotoUrl(coverPath);
      if (!cancelled) setHeroUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [coverPath]);

  const plant = plantQ.data;

  if (!plantId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ color: theme.textLight }}>Missing plant id.</Text>
      </View>
    );
  }

  if (plantQ.isPending) {
    return (
      <View style={styles.loadingRoot}>
        <Skeleton height={340} width="100%" radius={0} dark />
        <View style={styles.loadingSkeleton}>
          <Skeleton height={28} width="70%" dark />
          <Skeleton height={18} width="45%" dark style={{ marginTop: 10 }} />
          <Skeleton height={90} radius={theme.radiusLg} dark style={{ marginTop: 18 }} />
          <Skeleton height={120} radius={theme.radiusLg} dark style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  if (plantQ.isError || !plant) {
    return (
      <ScrollView
        contentContainerStyle={[styles.center, { paddingTop: insets.top + 40 }]}
        style={{ backgroundColor: theme.bg }}
      >
        <ErrorState
          message={
            plantQ.isError
              ? (plantQ.error as Error).message
              : 'Plant not found or unavailable.'
          }
          onRetry={() => plantQ.refetch()}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Hero */}
      <View style={styles.heroWrap}>
        {heroUrl ? (
          <Image source={{ uri: heroUrl }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPhText}>
              {plant.common_name.slice(0, 1)}
            </Text>
          </View>
        )}
        <View style={styles.heroGradient} />
        <View
          style={[styles.heroOverlay, { paddingTop: insets.top + 10 }]}
          pointerEvents="box-none"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textLight} />
          </Pressable>
          <GlassPanel dark style={styles.heroBadge} intensity={40}>
            <VeeraLogo size="sm" light showWordmark={false} />
          </GlassPanel>
        </View>

        <View style={styles.heroNameWrap} pointerEvents="none">
          <Text style={styles.heroName}>{plant.common_name}</Text>
          {plant.scientific_name ? (
            <Text style={styles.heroSci}>{plant.scientific_name}</Text>
          ) : null}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Tags */}
        {tagsQ.data?.length ? (
          <View style={styles.tags}>
            {tagsQ.data.map((t) => (
              <View key={t.id} style={styles.tag}>
                <Text style={styles.tagText}>{t.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Care Grid */}
        {(plant.water_level || plant.light_level) ? (
          <View style={styles.careGrid}>
            {plant.water_level ? (
              <CareItem icon="water-outline" label="Watering" value={plant.water_level} />
            ) : null}
            {plant.light_level ? (
              <CareItem icon="sunny-outline" label="Light" value={plant.light_level} />
            ) : null}
          </View>
        ) : null}

        {/* Summary */}
        {plant.summary ? (
          <GlassCard dark style={styles.section}>
            <Text style={styles.sectionLabel}>Overview</Text>
            <Text style={styles.sectionBody}>{plant.summary}</Text>
          </GlassCard>
        ) : null}

        {/* Content sections */}
        {sectionsQ.data?.map((s) => (
          <GlassCard dark key={s.id} style={styles.section}>
            <Text style={styles.sectionLabel}>{s.section_label}</Text>
            <Text style={styles.sectionBody}>{s.content}</Text>
          </GlassCard>
        ))}

        {/* CTAs */}
        <Pressable
          style={styles.ctaBtn}
          onPress={() => router.push(`/(app)/add-plant?plantId=${plant.id}`)}
        >
          <Text style={styles.ctaBtnText}>Add to My Plants</Text>
        </Pressable>

        {plant.qr_target_url ? (
          <Button
            title="Buy on website"
            onPress={() => Linking.openURL(plant.qr_target_url!)}
            variant="ghost"
            textStyle={{ color: theme.accentLight }}
            style={styles.ghostCta}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  loadingRoot: { flex: 1, backgroundColor: theme.bg },
  loadingSkeleton: { paddingHorizontal: 20, paddingTop: 20 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.bg,
  },

  // Hero
  heroWrap: { width: '100%', position: 'relative' },
  hero: { width: '100%', height: 360, backgroundColor: theme.bgElevated },
  heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroPhText: {
    fontSize: 80,
    fontWeight: '200',
    color: theme.accentLight,
    fontFamily: fontFamily.displayBold,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulated bottom gradient
    borderBottomWidth: 0,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radiusMd,
  },
  heroNameWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  heroName: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSci: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
    fontStyle: 'italic',
    marginTop: 4,
    fontFamily: fontFamily.body,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 20 },

  // Tags
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radiusFull,
    backgroundColor: 'rgba(114,191,155,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(114,191,155,0.25)',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accentLight,
    fontFamily: fontFamily.semi,
  },

  // Care grid
  careGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  careCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  careLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: theme.textMuted,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  careValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
    textAlign: 'center',
  },

  // Sections
  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontFamily: fontFamily.semi,
  },
  sectionBody: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 24,
    fontFamily: fontFamily.body,
  },

  // CTAs
  ctaBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    ...theme.shadow.soft,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fontFamily.semi,
    letterSpacing: 0.3,
  },
  ghostCta: {
    marginTop: 8,
  },
});
