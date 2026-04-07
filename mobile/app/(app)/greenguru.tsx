import { BotanicalBackground } from '@/components/ui/BotanicalBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { fontFamily, theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { fetchProgress, fetchUserPlant } from '@/lib/api/plants';
import { getGamificationState } from '@/lib/gamification';
import { greenGuruReply, type GreenGuruContext } from '@/lib/greenguru';
import { describeNextWatering, formatReminderClock } from '@/lib/schedule';
import { useAuth } from '@/providers/AuthProvider';
import type { Plant } from '@/types/database';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Msg = { role: 'user' | 'assistant'; text: string; citations?: string[] };

export default function GreenGuruScreen() {
  const { userPlantId } = useLocalSearchParams<{ userPlantId?: string }>();
  const upId = Array.isArray(userPlantId) ? userPlantId[0] : userPlantId;
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const plantQ = useQuery({
    queryKey: qk.userPlant(upId ?? '', userId),
    queryFn: () => fetchUserPlant(upId!, userId),
    enabled: Boolean(upId && userId),
  });

  const progressQ = useQuery({
    queryKey: qk.progress(upId ?? '', userId),
    queryFn: () => fetchProgress(upId!, userId),
    enabled: Boolean(upId && userId),
  });

  const gamifyQ = useQuery({
    queryKey: ['gamification'],
    queryFn: () => getGamificationState(),
  });

  const catalog = (plantQ.data?.plant ?? null) as Plant | null;
  const p = plantQ.data;

  const ctx = useMemo((): GreenGuruContext => {
    const progress = progressQ.data ?? [];
    const nw =
      p && catalog
        ? describeNextWatering({
            waterLevel: catalog.water_level,
            acquiredAt: p.acquired_at,
            userPlantCreatedAt: p.created_at,
          })
        : null;
    return {
      userPlantId: upId,
      nickname: p?.nickname,
      catalogName: catalog?.common_name,
      scientificName: catalog?.scientific_name,
      room: p?.room,
      waterLevel: catalog?.water_level,
      lightLevel: catalog?.light_level,
      summary: catalog?.summary ?? null,
      nextWateringLabel: nw?.sub,
      reminderOn: p?.reminder_enabled,
      reminderTimeLabel: p ? formatReminderClock(p.reminder_time) : undefined,
      progress,
      gamification: gamifyQ.data ?? null,
    };
  }, [upId, p, catalog, progressQ.data, gamifyQ.data]);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);

  useEffect(() => {
    if (messages.length > 0) return;
    const name = ctx.nickname?.trim() || ctx.catalogName?.trim() || 'your plants';
    setMessages([
      {
        role: 'assistant',
        text: `I’m GreenGuru — here for ${name}. Ask about watering, light, or what to do this week. ${
          ctx.nextWateringLabel ? `Next watering estimate: ${ctx.nextWateringLabel}.` : ''
        }`,
      },
    ]);
  }, [ctx.nickname, ctx.catalogName, ctx.nextWateringLabel, messages.length]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text: t };
    const { text, citations } = greenGuruReply(t, ctx);
    const botMsg: Msg = { role: 'assistant', text, citations };
    setMessages((m) => [...m, userMsg, botMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <BotanicalBackground variant="dark">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        {!upId ? (
          <View style={[styles.banner, { marginTop: insets.top + 8 }]}>
            <Text style={styles.bannerText}>
              Open GreenGuru from a plant screen for full context — you can still browse general tips here.
            </Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[styles.bubbleRow, m.role === 'user' ? styles.rowEnd : styles.rowStart]}
            >
              <GlassCard dark style={[styles.bubble, m.role === 'user' && styles.bubbleUser]}>
                {m.role === 'assistant' ? (
                  <View style={styles.botHead}>
                    <Ionicons name="leaf" size={16} color={theme.accentLight} />
                    <Text style={styles.botHeadText}>GreenGuru</Text>
                  </View>
                ) : null}
                <Text style={styles.bubbleText}>{m.text}</Text>
                {m.citations?.length ? (
                  <Text style={styles.cite}>Sources: {m.citations.join(' ')}</Text>
                ) : null}
              </GlassCard>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask GreenGuru…"
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  banner: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: theme.radiusMd,
    backgroundColor: 'rgba(114,191,155,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(114,191,155,0.25)',
  },
  bannerText: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
    lineHeight: 20,
  },
  bubbleRow: { marginBottom: 10, maxWidth: '92%' },
  rowStart: { alignSelf: 'flex-start' },
  rowEnd: { alignSelf: 'flex-end' },
  bubble: { paddingVertical: 12, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: 'rgba(62,132,102,0.35)' },
  botHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  botHeadText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: theme.accentLight,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semi,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textLight,
    fontFamily: fontFamily.body,
  },
  cite: {
    marginTop: 10,
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: fontFamily.body,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: theme.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.textLight,
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontFamily: fontFamily.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
