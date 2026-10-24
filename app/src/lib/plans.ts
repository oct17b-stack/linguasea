/** A subscription plan on the paywall. */
export type Plan = {
  id: 'yearly' | 'monthly';
  /** Price for the whole period as the store formats it, e.g. "฿1,490.00"; undefined while loading. */
  price?: string;
  /** Yearly plan: what it comes to per month. */
  perMonth?: string;
  /** Length of the free trial, when the plan has one. */
  trialDays?: number;
};

/** Placeholder Thai prices from docs/PLAN.md, shown while there are no store products. */
export const PLACEHOLDER_PLANS: Plan[] = [
  { id: 'yearly', price: '฿1,490', perMonth: '฿124', trialDays: 7 },
  { id: 'monthly', price: '฿219' },
];

/** 'needs-sign-in': web only, where a subscription is tied to an email account (browser storage can be cleared). */
export type PurchaseResult = 'purchased' | 'cancelled' | 'pending' | 'unavailable' | 'failed' | 'needs-sign-in';

export type RestoreResult = 'restored' | 'nothing' | 'unavailable' | 'failed' | 'needs-sign-in';
