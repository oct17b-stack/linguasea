/**
 * Subscription seam. Will wrap RevenueCat (react-native-purchases) once the App Store / Google Play
 * products exist; until then nothing can be bought and prices are display placeholders.
 */
export type Plan = { id: 'yearly' | 'monthly'; price: string; trial: boolean };

/** Placeholder Thai prices from docs/PLAN.md; real prices come from the store per country. */
export const PLACEHOLDER_PLANS: Plan[] = [
  { id: 'yearly', price: '฿1,490 / ปี', trial: true },
  { id: 'monthly', price: '฿219 / เดือน', trial: false },
];

export const purchasesReady = false;

export async function purchase(_plan: Plan['id']): Promise<boolean> {
  return false;
}

export async function restore(): Promise<boolean> {
  return false;
}
