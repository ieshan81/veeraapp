import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.msg}>{message}</Text>
      {onRetry ? (
        <Button
          title="Try again"
          onPress={onRetry}
          variant="secondary"
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  msg: {
    color: theme.danger,
    textAlign: 'center',
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 22,
  },
  btn: {
    alignSelf: 'center',
    minWidth: 140,
  },
});
