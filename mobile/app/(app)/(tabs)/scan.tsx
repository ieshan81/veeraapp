import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { fontFamily, theme } from '@/constants/theme';
import { resolvePlantQr } from '@/lib/api/plants';
import { normalizeQrPayload } from '@/lib/qr';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScanPhase = 'ready' | 'processing' | 'done' | 'error';

function ScanFrame() {
  const size = 220;
  const corner = 28;
  const weight = 3;
  const color = 'rgba(255,255,255,0.85)';

  const cornerStyle = (
    top?: boolean,
    left?: boolean,
  ): object => ({
    position: 'absolute' as const,
    width: corner,
    height: corner,
    ...(top ? { top: 0 } : { bottom: 0 }),
    ...(left ? { left: 0 } : { right: 0 }),
    borderColor: color,
    ...(top ? { borderTopWidth: weight } : { borderBottomWidth: weight }),
    ...(left ? { borderLeftWidth: weight } : { borderRightWidth: weight }),
    ...(top && left
      ? { borderTopLeftRadius: 14 }
      : top
        ? { borderTopRightRadius: 14 }
        : left
          ? { borderBottomLeftRadius: 14 }
          : { borderBottomRightRadius: 14 }),
  });

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <View style={cornerStyle(true, true)} />
      <View style={cornerStyle(true, false)} />
      <View style={cornerStyle(false, true)} />
      <View style={cornerStyle(false, false)} />
    </View>
  );
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('ready');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const hasNavigated = useRef(false);
  const lastValue = useRef<string | null>(null);
  const lastScanTime = useRef(0);
  const COOLDOWN_MS = 3000;

  const handleBarcode = useCallback(async ({ data }: { data: string }) => {
    if (hasNavigated.current) return;
    const now = Date.now();
    if (data === lastValue.current && now - lastScanTime.current < COOLDOWN_MS) {
      return;
    }
    lastValue.current = data;
    lastScanTime.current = now;
    setPhase('processing');
    setErrorMsg(null);

    try {
      const payload = normalizeQrPayload(data);
      if (!payload) {
        setErrorMsg('That code looks empty. Try scanning again.');
        setPhase('error');
        return;
      }
      const plantId = await resolvePlantQr(payload);
      if (!plantId) {
        setErrorMsg(
          'This code is not linked to an active plant. Try another sticker.',
        );
        setPhase('error');
        return;
      }
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      setPhase('done');
      router.push(`/(app)/plant/${plantId}`);
    } catch (e) {
      if (hasNavigated.current) return;
      setErrorMsg((e as Error).message || 'Could not resolve QR code.');
      setPhase('error');
    }
  }, []);

  const resetScanner = useCallback(() => {
    hasNavigated.current = false;
    lastValue.current = null;
    lastScanTime.current = 0;
    setPhase('ready');
    setErrorMsg(null);
  }, []);

  // Tab stays mounted after navigate away; phase can stay `done` / `processing`.
  // Reset whenever the user returns to this screen so the camera is ready again.
  useFocusEffect(
    useCallback(() => {
      resetScanner();
    }, [resetScanner])
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accentLight} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingHorizontal: 32 }]}>
        <VeeraLogo size="md" light />
        <Text style={styles.permTitle}>Camera access</Text>
        <Text style={styles.permBody}>
          We need camera permission to scan QR codes on your plants.
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const scannerActive = phase === 'ready';

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scannerActive ? handleBarcode : undefined}
      />

      {/* Top gradient overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <VeeraLogo size="sm" light />
        <Text style={styles.topTitle}>
          {phase === 'processing' || phase === 'done'
            ? 'Scanning Plant…'
            : phase === 'error'
              ? 'Scan Error'
              : 'Scan Plant'}
        </Text>
      </View>

      {/* Scan frame */}
      {scannerActive ? (
        <View style={styles.frameWrap}>
          <ScanFrame />
        </View>
      ) : null}

      {/* Processing overlay */}
      {phase === 'processing' || phase === 'done' ? (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <ActivityIndicator color={theme.accentLight} size="large" />
            <Text style={styles.statusText}>Identifying your plant…</Text>
          </View>
        </View>
      ) : null}

      {/* Error overlay */}
      {phase === 'error' ? (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable style={styles.retryBtn} onPress={resetScanner}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <GlassPanel dark style={styles.bottomGlass} intensity={56}>
          <Text style={styles.bottomText}>
            {scannerActive
              ? 'Scan QR Code'
              : phase === 'error'
                ? 'Fix the issue above'
                : 'Processing…'}
          </Text>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bg,
    gap: 20,
  },

  // Top
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 12,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Frame
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  statusCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: theme.radiusXl,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: theme.glassWhiteBorder,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textMuted,
    textAlign: 'center',
    fontFamily: fontFamily.semi,
  },
  errorText: {
    fontSize: 16,
    color: '#F5A5A5',
    textAlign: 'center',
    lineHeight: 23,
    fontFamily: fontFamily.body,
  },
  retryBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.radiusMd,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fontFamily.semi,
  },

  // Bottom
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  bottomGlass: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textLight,
    fontFamily: fontFamily.semi,
    letterSpacing: 0.3,
  },

  // Permission
  permTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  permBody: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fontFamily.body,
  },
  permBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: theme.radiusMd,
    ...theme.shadow.soft,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fontFamily.semi,
  },
});
