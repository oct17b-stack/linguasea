import { ErrorCode, Purchases, PurchasesError, type Package, type Product } from '@revenuecat/purchases-js';

import { currentAccount } from './api';
import { REVENUECAT_WEB_KEY } from './config';
import type * as Native from './purchases';
import { PLACEHOLDER_PLANS, type Plan } from './plans';

export { PLACEHOLDER_PLANS };
export type { Plan, PurchaseResult, RestoreResult } from './plans';

/**
 * Web build: subscriptions through RevenueCat Web Billing (@revenuecat/purchases-js), with the same
 * entitlement "premium" and offering "default" as the apps. RevenueCat knows the learner by our
 * account id, so the server's webhook finds the account just as for App Store / Google Play.
 *
 * Browser storage can be cleared at any time, so buying needs an email sign-in first (the account
 * then survives a cleared browser and works in the apps too). Before sign-in RevenueCat runs with
 * an anonymous id of its own, only to show the prices.
 *
 * Without EXPO_PUBLIC_REVENUECAT_WEB_KEY nothing can be bought here: the paywall shows the
 * placeholder plans and says purchasing is not available yet.
 */
const ENTITLEMENT = 'premium';
const OFFERING = 'default';
const apiKey = REVENUECAT_WEB_KEY;

export const purchasesReady = !!apiKey;
export const purchasesNeedSignIn = purchasesReady;

let rc: Purchases | undefined;
let report: ((premium: boolean) => void) | undefined;
const packages: Partial<Record<Plan['id'], Package>> = {};

type Client = { rc: Purchases; email: string | null };
let switching: Promise<Client | undefined> = Promise.resolve(undefined);

/** The RevenueCat client, switched to the signed-in account (or an anonymous id before sign-in). One switch at a time. */
function client(): Promise<Client | undefined> {
  switching = switching.then(switchUser, switchUser);
  return switching;
}

async function switchUser(): Promise<Client | undefined> {
  if (!apiKey) return undefined;
  const acc = await currentAccount();
  const email = acc?.email ? acc.email : null;
  const userId = email && acc ? acc.id : undefined;
  try {
    if (!rc) {
      rc = Purchases.configure({ apiKey, appUserId: userId ?? Purchases.generateRevenueCatAnonymousAppUserId() });
    } else if (userId && rc.getAppUserId() !== userId) {
      await rc.changeUser(userId);
    } else if (!userId && !rc.isAnonymous()) {
      await rc.changeUser(Purchases.generateRevenueCatAnonymousAppUserId());
    }
  } catch {
    return undefined;
  }
  return { rc, email };
}

/** Reports whether the signed-in account has Premium in RevenueCat (false before sign-in). */
async function refreshStore(): Promise<boolean> {
  const c = await client();
  let premium = false;
  if (c?.email) {
    try {
      premium = ENTITLEMENT in (await c.rc.getCustomerInfo()).entitlements.active;
    } catch {
      return false;
    }
  }
  report?.(premium);
  return premium;
}

export const startPurchases: typeof Native.startPurchases = (_accountId, onPremium) => {
  if (!apiKey) return () => {};
  report = onPremium;
  void refreshStore();
  return () => {
    if (report === onPremium) report = undefined;
  };
};

/** The account changed (signed in, or an anonymous one was made): RevenueCat follows. */
export const identify: typeof Native.identify = async () => {
  if (apiKey) await refreshStore();
};

/** Signed out / data deleted: back to an anonymous RevenueCat id, no Premium from the store. */
export const forgetPurchaser: typeof Native.forgetPurchaser = async () => {
  if (apiKey) await refreshStore();
};

const DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

function planOf(id: Plan['id'], product: Product): Plan {
  const trial = product.freeTrialPhase?.period;
  return {
    id,
    price: product.price.formattedPrice,
    perMonth: id === 'yearly' ? product.defaultSubscriptionOption?.base.pricePerMonth?.formattedPrice : undefined,
    trialDays: trial && DAYS[trial.unit] && trial.number > 0 ? DAYS[trial.unit] * trial.number : undefined,
  };
}

export const loadPlans: typeof Native.loadPlans = async () => {
  if (!apiKey) return PLACEHOLDER_PLANS;
  const c = await client();
  try {
    if (c) {
      const offerings = await c.rc.getOfferings();
      const offering = offerings.all[OFFERING] ?? offerings.current;
      const plans: Plan[] = [];
      if (offering?.annual) {
        packages.yearly = offering.annual;
        plans.push(planOf('yearly', offering.annual.product));
      }
      if (offering?.monthly) {
        packages.monthly = offering.monthly;
        plans.push(planOf('monthly', offering.monthly.product));
      }
      if (plans.length) return plans;
    }
  } catch {}
  return PLACEHOLDER_PLANS.map(({ id }) => ({ id }));
};

/** Opens RevenueCat's checkout (Stripe) over the page; the email is the one signed in with. */
export const purchase: typeof Native.purchase = async (id, locale) => {
  if (!apiKey) return 'unavailable';
  const c = await client();
  if (!c) return 'unavailable';
  if (!c.email) return 'needs-sign-in';
  if (!packages[id]) await loadPlans();
  const rcPackage = packages[id];
  if (!rcPackage) return 'unavailable';
  try {
    await c.rc.purchase({ rcPackage, customerEmail: c.email, selectedLocale: locale, defaultLocale: 'en' });
    await refreshStore();
    return 'purchased';
  } catch (e) {
    const code = e instanceof PurchasesError ? e.errorCode : undefined;
    if (code === ErrorCode.UserCancelledError) return 'cancelled';
    if (code === ErrorCode.PaymentPendingError) return 'pending';
    if (code === ErrorCode.NetworkError || code === ErrorCode.StoreProblemError) return 'unavailable';
    return 'failed';
  }
};

/** A web subscription belongs to the email account: signing in is the restore; this re-checks it. */
export const restore: typeof Native.restore = async () => {
  if (!apiKey) return 'unavailable';
  const c = await client();
  if (!c) return 'unavailable';
  if (!c.email) return 'needs-sign-in';
  try {
    const premium = ENTITLEMENT in (await c.rc.getCustomerInfo()).entitlements.active;
    report?.(premium);
    return premium ? 'restored' : 'nothing';
  } catch {
    return 'failed';
  }
};
