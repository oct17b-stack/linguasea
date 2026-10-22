import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppStateProvider, useApp } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { ready, t } = useApp();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="languages" options={{ title: '' }} />
      <Stack.Screen name="lesson/[id]" options={{ title: '', gestureEnabled: false }} />
      <Stack.Screen name="review" options={{ title: t('review.title') }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppStateProvider>
        <Routes />
      </AppStateProvider>
    </ThemeProvider>
  );
}
