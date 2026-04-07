import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'veera_pending_qr_token';

/** Stash token so after login we can open /p/[token] again. */
export async function setPendingQrToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEY, token);
}

/** Read and clear pending token (single use). */
export async function consumePendingQrToken(): Promise<string | null> {
  const v = await AsyncStorage.getItem(KEY);
  if (v) await AsyncStorage.removeItem(KEY);
  return v;
}

export async function clearPendingQrToken(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
