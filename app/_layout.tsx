import '@/global.css';
import { Stack } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { MaintenanceConfig } from '@/lib/domain';
import { db, firebaseConfigError } from '@/lib/firebase';
import { CartProvider } from '@/context/cart-context';
import { siteColors } from '@/constants/site-theme';

const ink = '#292B24';
const gold = '#6F8067';

function SiteGate() {
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<'loading' | 'ready' | 'maintenance' | 'error'>('loading');
  const [maintenance, setMaintenance] = useState<Partial<MaintenanceConfig>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (firebaseConfigError) return;
    return onSnapshot(
      doc(db, 'config', 'websiteMaintenance'),
      (snapshot) => {
        const config = snapshot.exists() ? (snapshot.data() as Partial<MaintenanceConfig>) : {};
        setMaintenance(config);
        setError('');
        setMode(config.enabled ? 'maintenance' : 'ready');
      },
      (cause) => {
        setError(cause.message);
        setMode('error');
      },
    );
  }, [attempt]);

  const currentMode = firebaseConfigError ? 'error' : mode;
  const currentError = firebaseConfigError || error;

  if (currentMode === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={gold} size="large" />
        <Text style={styles.muted}>Preparing Spitiko…</Text>
      </View>
    );
  }

  if (currentMode === 'maintenance' || currentMode === 'error') {
    const isError = currentMode === 'error';
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.eyebrow}>{isError ? 'TEMPORARILY UNAVAILABLE' : 'WE’LL BE BACK SOON'}</Text>
        <Text style={styles.maintenanceTitle}>
          {isError ? 'We can’t load Spitiko right now' : maintenance.title || 'A little time to refresh'}
        </Text>
        <Text style={styles.body}>
          {isError
            ? currentError
            : maintenance.message || 'We’re making a few improvements. Please check back shortly.'}
        </Text>
        {isError && !firebaseConfigError && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError('');
              setMode('loading');
              setAttempt((value) => value + 1);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Try again</Text>
          </Pressable>
        )}
        <Text style={styles.support}>SPITIKO · A table from home</Text>
      </ScrollView>
    );
  }

  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: siteColors.paper } }} />
    </CartProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SiteGate />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: siteColors.paper,
  },
  eyebrow: { color: gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textAlign: 'center' },
  maintenanceTitle: { color: ink, fontSize: 36, lineHeight: 44, fontWeight: '600', textAlign: 'center', marginTop: 18, maxWidth: 640 },
  body: { color: '#62665C', fontSize: 16, lineHeight: 26, textAlign: 'center', marginTop: 12, maxWidth: 520 },
  muted: { color: '#8C8078', marginTop: 14 },
  support: { color: '#8C8078', fontSize: 13, marginTop: 48 },
  primaryButton: { backgroundColor: '#334A37', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 5, marginTop: 24 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
