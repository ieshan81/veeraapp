import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { theme } from '@/constants/theme';
import { qk } from '@/hooks/queries/keys';
import { insertProgress, uploadProgressPhoto } from '@/lib/api/plants';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddProgressScreen() {
  const { userPlantId } = useLocalSearchParams<{ userPlantId: string }>();
  const upId = Array.isArray(userPlantId) ? userPlantId[0] : userPlantId;
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const [note, setNote] = useState('');
  const [healthTag, setHealthTag] = useState('');
  const [issueTag, setIssueTag] = useState('');
  const [height, setHeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library permission is required.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setMime(res.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const save = async () => {
    if (!upId || !userId) {
      setError('Missing data.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let path: string | null = null;
      if (imageUri && mime) {
        path = await uploadProgressPhoto(userId, imageUri, mime);
      }
      const h = height.trim() ? Number(height) : null;
      await insertProgress({
        user_plant_id: upId,
        user_id: userId,
        note: note.trim() || null,
        health_tag: healthTag.trim() || null,
        issue_tag: issueTag.trim() || null,
        height_estimate: h !== null && !Number.isNaN(h) ? h : null,
        photo_storage_path: path,
      });
      await queryClient.invalidateQueries({ queryKey: qk.progress(upId, userId) });
      await queryClient.invalidateQueries({ queryKey: qk.userPlant(upId, userId) });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.h1}>Log progress</Text>
      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="What changed today?"
        placeholderTextColor={theme.textSecondary}
        value={note}
        onChangeText={setNote}
        multiline
      />
      <Text style={styles.label}>Health tag (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. thriving"
        placeholderTextColor={theme.textSecondary}
        value={healthTag}
        onChangeText={setHealthTag}
      />
      <Text style={styles.label}>Issue tag (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. yellow leaves"
        placeholderTextColor={theme.textSecondary}
        value={issueTag}
        onChangeText={setIssueTag}
      />
      <Text style={styles.label}>Height estimate (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="cm"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
      />

      <Pressable onPress={pickImage} style={styles.photoBtn}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <Text style={styles.photoBtnText}>Add photo</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Button title="Save entry" onPress={save} loading={loading} style={styles.btn} />
      <Button title="Cancel" onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 8, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surfaceElevated,
  },
  area: { minHeight: 100, textAlignVertical: 'top' },
  photoBtn: {
    marginTop: 16,
    height: 160,
    borderRadius: theme.radiusMd,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: theme.accentSoft,
  },
  photoBtnText: { color: theme.accent, fontWeight: '600' },
  preview: { width: '100%', height: '100%' },
  err: { color: theme.danger, marginTop: 12 },
  btn: { marginTop: 20 },
});
