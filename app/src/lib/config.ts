/**
 * Build-time settings (EXPO_PUBLIC_* variables are inlined by Expo when the app is bundled).
 * Every one of them is optional: without them the app runs fully offline with device TTS,
 * self-checked speaking and placeholder subscription plans.
 */

import { Platform } from 'react-native';

/**
 * LinguaSEA server, e.g. https://api.example.com. Unset: no account, sync, clips or scoring.
 * "same-origin": the web build served by the server itself (/app/) calls the address it was opened
 * from, so one Docker image works on any host (a NAS on the LAN, a test tunnel, the real domain).
 */
export const API_URL = apiUrl(clean(process.env.EXPO_PUBLIC_API_URL));

function apiUrl(value: string | undefined): string | undefined {
  if (value !== 'same-origin') return value?.replace(/\/+$/, '');
  return Platform.OS === 'web' && typeof location !== 'undefined' ? location.origin : undefined;
}

/** RevenueCat public SDK keys. Unset: purchases are not available yet on that platform. */
export const REVENUECAT_IOS_KEY = clean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
export const REVENUECAT_ANDROID_KEY = clean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
/** RevenueCat Web Billing public key (rcb_…) for the web build (purchases.web.ts). */
export const REVENUECAT_WEB_KEY = clean(process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY);

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/**
 * Where learners report problems, e.g. an AI tutor reply (Google Play AI-generated content policy).
 * TODO: replace with the real support address before launch (same as the store listing).
 */
export const SUPPORT_EMAIL = 'support@example.com';
