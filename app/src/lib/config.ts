/**
 * Build-time settings (EXPO_PUBLIC_* variables are inlined by Expo when the app is bundled).
 * Every one of them is optional: without them the app runs fully offline with device TTS,
 * self-checked speaking and placeholder subscription plans.
 */

/** LinguaSEA server, e.g. https://api.example.com. Unset: no account, sync, clips or scoring. */
export const API_URL = clean(process.env.EXPO_PUBLIC_API_URL)?.replace(/\/+$/, '');

/** RevenueCat public SDK keys. Unset (or on web): purchases are not available yet. */
export const REVENUECAT_IOS_KEY = clean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
export const REVENUECAT_ANDROID_KEY = clean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/**
 * Where learners report problems, e.g. an AI tutor reply (Google Play AI-generated content policy).
 * TODO: replace with the real support address before launch (same as the store listing).
 */
export const SUPPORT_EMAIL = 'support@example.com';
