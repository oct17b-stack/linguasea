import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '@/lib/config';
import { PLACEHOLDER_PLANS, type Plan, type PurchaseResult, type RestoreResult } from '@/lib/plans';

export { PLACEHOLDER_PLANS, type Plan, type PurchaseResult, type RestoreResult };

/**
 * Subscriptions through RevenueCat (App Store / Google Play). Entitlement "premium" unlocks
 * everything; offering "default" holds the monthly and annual packages. RevenueCat knows the
 * learner by our account id, which is how the server's webhook finds the account.
 * Without the EXPO_PUBLIC_REVENUECAT_* key for this platform (and on web, purchases.web.ts)
 * nothing can be bought and the paywall shows placeholder prices.
 */
const ENTITLEMENT = 'premium';
const OFFERING = 'default';

const apiKey = Platform.select({ ios: REVENUECAT_IOS_KEY, android: REVENUECAT_ANDROID_KEY });

/** Store purchases are set up for this platform. */
export const purchasesReady = !!apiKey;

let configured = false;
const packages: Partial<Record<Plan['id'], PurchasesPackage>> = {};

function hasPremium(info: CustomerInfo): boolean {
  return ENTITLEMENT in info.entitlements.active;
}

/**
 * Configures RevenueCat once (as `accountId` when known) and reports the entitlement now and
 * whenever it changes. Returns a function that stops the reports.
 */
export function startPurchases(accountId: string | undefined, onPremium: (premium: boolean) => void): () => void {
  if (!apiKey) return () => {};
  if (!configured) {
    try {
      Purchases.configure({ apiKey, appUserID: accountId ?? null });
      configured = true;
    } catch {
      // e.g. Expo Go, which only accepts RevenueCat test-store keys.
      return () => {};
    }
  }
  const listener = (info: CustomerInfo) => onPremium(hasPremium(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  Purchases.getCustomerInfo().then(listener, () => {});
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/** Purchases made so far move to our account id (called once the server account exists). */
export async function identify(accountId: string): Promise<void> {
  if (!configured) return;
  await Purchases.logIn(accountId).catch(() => {});
}

/** After "delete my data": RevenueCat goes back to an anonymous user. */
export async function forgetPurchaser(): Promise<void> {
  if (!configured) return;
  try {
    if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch {}
}

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function trialDays(product: PurchasesStoreProduct): number | undefined {
  const days = (unit: string, n: number) => (UNIT_DAYS[unit] && n > 0 ? UNIT_DAYS[unit] * n : undefined);
  const intro = product.introPrice; // App Store introductory offer
  if (intro && intro.price === 0) return days(intro.periodUnit, intro.periodNumberOfUnits);
  const free = product.defaultOption?.freePhase?.billingPeriod; // Google Play free phase
  return free ? days(free.unit, free.value) : undefined;
}

function planOf(id: Plan['id'], pkg: PurchasesPackage): Plan {
  const p = pkg.product;
  return {
    id,
    price: p.priceString,
    perMonth: id === 'yearly' ? (p.pricePerMonthString ?? undefined) : undefined,
    trialDays: trialDays(p),
  };
}

/**
 * Plans with the store's own prices (from the "default" offering). Placeholders when purchases
 * are not set up; plans without a price when the store cannot be reached.
 */
export async function loadPlans(): Promise<Plan[]> {
  if (!configured) return PLACEHOLDER_PLANS;
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[OFFERING] ?? offerings.current;
    const plans: Plan[] = [];
    if (offering?.annual) {
      packages.yearly = offering.annual;
      plans.push(planOf('yearly', offering.annual));
    }
    if (offering?.monthly) {
      packages.monthly = offering.monthly;
      plans.push(planOf('monthly', offering.monthly));
    }
    if (plans.length) return plans;
  } catch {}
  return PLACEHOLDER_PLANS.map(({ id }) => ({ id }));
}

export async function purchase(id: Plan['id']): Promise<PurchaseResult> {
  if (!configured) return 'unavailable';
  if (!packages[id]) await loadPlans();
  const pkg = packages[id];
  if (!pkg) return 'unavailable';
  try {
    await Purchases.purchasePackage(pkg);
    // The entitlement itself arrives through the customer-info listener.
    return 'purchased';
  } catch (e) {
    const err = e as Partial<PurchasesError>;
    if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    if (err.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    const unreachable = [
      PURCHASES_ERROR_CODE.NETWORK_ERROR,
      PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR,
      PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR,
    ];
    return err.code && unreachable.includes(err.code) ? 'unavailable' : 'failed';
  }
}

export async function restore(): Promise<RestoreResult> {
  if (!configured) return 'unavailable';
  try {
    return hasPremium(await Purchases.restorePurchases()) ? 'restored' : 'nothing';
  } catch {
    return 'failed';
  }
}
