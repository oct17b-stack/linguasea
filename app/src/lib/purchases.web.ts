import type * as Native from './purchases';
import { PLACEHOLDER_PLANS } from './plans';

export { PLACEHOLDER_PLANS };
export type { Plan, PurchaseResult, RestoreResult } from './plans';

/**
 * Web build: no App Store / Google Play, so nothing can be bought here. The paywall shows the
 * placeholder plans and says purchasing is not available yet (subscriptions are made in the apps).
 */
export const purchasesReady = false;

export const startPurchases: typeof Native.startPurchases = () => () => {};
export const identify: typeof Native.identify = async () => {};
export const forgetPurchaser: typeof Native.forgetPurchaser = async () => {};
export const loadPlans: typeof Native.loadPlans = async () => PLACEHOLDER_PLANS;
export const purchase: typeof Native.purchase = async () => 'unavailable';
export const restore: typeof Native.restore = async () => 'unavailable';
