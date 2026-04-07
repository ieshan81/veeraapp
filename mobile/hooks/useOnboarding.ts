import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'veera_onboarding_complete';

export function useOnboarding() {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setDone(v === '1'));
  }, []);

  const complete = useCallback(async () => {
    await AsyncStorage.setItem(KEY, '1');
    setDone(true);
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setDone(false);
  }, []);

  return {
    done,
    loading: done === null,
    complete,
    reset,
  };
}
