import AsyncStorage from '@react-native-async-storage/async-storage';
import type { L1, Target } from '@linguasea/contract';
import { completeLesson, emptyProgress, mergeProgress, reviewItem, type Progress } from '@linguasea/core';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState as SystemAppState } from 'react-native';

import { bundle, courseBundle, l1Bundle } from '@/content';
import * as api from '@/lib/api';
import { translate } from '@/lib/i18n';
import { deviceL1 } from '@/lib/locale';
import { forgetPurchaser, identify, startPurchases } from '@/lib/purchases';
import {
  cancelReminder,
  reminderPermitted,
  remindersSupported,
  requestReminderPermission,
  scheduleReminder,
} from '@/lib/reminders';

const STORAGE_KEY = 'linguasea/state/v1';

/** Wait after a finished lesson / a reviewed card before syncing, so a review session sends one update. */
const SYNC_AFTER_LESSON_MS = 500;
const SYNC_AFTER_REVIEW_MS = 3000;
/** Coming back to the app syncs again, at most this often. */
const FOREGROUND_SYNC_MS = 60_000;

export type Reminder = { on: boolean; hour: number; minute: number };

type Entitlements = {
  /** RevenueCat (App Store / Google Play), as last reported on this device. */
  store: boolean;
  /** Server (RevenueCat webhooks): active, and until when. */
  server: boolean;
  serverUntil: string | null;
  /** __DEV__ test unlock. */
  dev: boolean;
};

type Saved = {
  l1: L1;
  target?: Target;
  progress: Progress;
  reminder: Reminder;
  entitlements: Entitlements;
};

type AppState = {
  ready: boolean;
  l1: L1;
  target?: Target;
  progress: Progress;
  reminder: Reminder;
  /** Store entitlement OR server entitlement (OR the development unlock). */
  premium: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setL1: (l1: L1) => void;
  setTarget: (target: Target) => void;
  finishLesson: (lessonId: string, results: Record<string, boolean>) => void;
  reviewed: (itemId: string, correct: boolean) => void;
  /** Turns the daily reminder on / off or moves it; "denied" when notifications are not allowed. */
  setReminder: (reminder: Reminder) => Promise<'ok' | 'denied'>;
  /** Re-reads the server's subscription state (after a restore). */
  refreshPremium: () => void;
  /** __DEV__ only: Premium without a purchase. */
  unlockForTesting: () => void;
  /**
   * Deletes the server account (when there is one) and everything on this device.
   * False when the server could not be reached; nothing is deleted then.
   */
  deleteMyData: () => Promise<boolean>;
};

function fresh(l1: L1 = deviceL1()): Saved {
  return {
    l1,
    progress: emptyProgress(),
    reminder: { on: false, hour: 20, minute: 0 },
    entitlements: { store: false, server: false, serverUntil: null, dev: false },
  };
}

/** Saved state from storage, tolerating older versions and content that changed since. */
function revive(raw: string | null): Saved {
  const base = fresh();
  if (!raw) return base;
  const old = JSON.parse(raw) as Partial<Saved> & { premium?: boolean };
  const l1 = old.l1 && bundle.l1s[old.l1] ? old.l1 : base.l1;
  const ent: Partial<Entitlements> = old.entitlements ?? {};
  const until = typeof ent.serverUntil === 'string' ? ent.serverUntil : null;
  return {
    l1,
    target: old.target && courseBundle(l1, old.target) ? old.target : undefined,
    progress: old.progress?.version === 1 ? old.progress : base.progress,
    reminder: { ...base.reminder, ...old.reminder },
    entitlements: {
      store: ent.store === true,
      server: ent.server === true && !!until && Date.parse(until) > Date.now(),
      serverUntil: until,
      // Before purchases existed, `premium` could only come from the development unlock.
      dev: ent.dev ?? old.premium === true,
    },
  };
}

function hasProgress(p: Progress): boolean {
  return p.xp > 0 || Object.keys(p.completed).length > 0 || Object.keys(p.cards).length > 0;
}

const Context = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(() => fresh());
  const [ready, setReady] = useState(false);
  /** Latest committed state, for syncs that run outside a render. */
  const latest = useRef(saved);
  const sync = useRef({
    running: undefined as Promise<void> | undefined,
    again: false,
    paused: false,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  useEffect(() => {
    latest.current = saved;
  }, [saved]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSaved(revive(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  /**
   * Sends local progress, adopts the server's merge, and merges it with what changed locally in the
   * meantime so nothing is lost. Errors are silent: the next sync tries again.
   */
  const runSync = useCallback(async () => {
    const s = sync.current;
    if (!api.apiEnabled || s.paused) return;
    if (s.running) {
      s.again = true;
      return s.running;
    }
    s.running = (async () => {
      try {
        do {
          s.again = false;
          const remote = await api.syncProgress(latest.current.progress);
          if (s.paused) return;
          setSaved((cur) => ({ ...cur, progress: mergeProgress(cur.progress, remote) }));
        } while (s.again);
      } catch {
        // Offline or server trouble.
      } finally {
        s.running = undefined;
      }
    })();
    return s.running;
  }, []);

  const scheduleSync = useCallback(
    (delay: number) => {
      if (!api.apiEnabled) return;
      clearTimeout(sync.current.timer);
      sync.current.timer = setTimeout(() => void runSync(), delay);
    },
    [runSync],
  );

  const refreshPremium = useCallback(() => {
    api
      .fetchEntitlements()
      .then((e) => {
        if (!e) return;
        setSaved((cur) => ({ ...cur, entitlements: { ...cur.entitlements, server: e.premium, serverUntil: e.premiumUntil } }));
      })
      .catch(() => {});
  }, []);

  // Launch: subscriptions, then (with a server) progress sync and the server's entitlement.
  useEffect(() => {
    if (!ready) return;
    let stopPurchases = () => {};
    let closed = false;
    const offAccount = api.onAccountChange((account) => {
      if (account) void identify(account.id);
      else void forgetPurchaser();
    });
    void api.currentAccount().then((account) => {
      if (closed) return;
      stopPurchases = startPurchases(account?.id, (store) =>
        setSaved((cur) => (cur.entitlements.store === store ? cur : { ...cur, entitlements: { ...cur.entitlements, store } })),
      );
      // The account is made lazily: only once there is progress to keep.
      if (api.apiEnabled && (account || hasProgress(latest.current.progress))) {
        void runSync().then(refreshPremium);
      }
    });
    return () => {
      closed = true;
      stopPurchases();
      offAccount();
    };
  }, [ready, runSync, refreshPremium]);

  // Back in the foreground: retry what failed while offline.
  useEffect(() => {
    if (!ready || !api.apiEnabled) return;
    let last = Date.now();
    const sub = SystemAppState.addEventListener('change', (state) => {
      if (state !== 'active' || Date.now() - last < FOREGROUND_SYNC_MS) return;
      last = Date.now();
      void api.currentAccount().then((account) => {
        if (account) void runSync().then(refreshPremium);
      });
    });
    return () => sub.remove();
  }, [ready, runSync, refreshPremium]);

  // Keep the scheduled reminder in step with its settings and the course it names.
  const { l1, target } = saved;
  const { on, hour, minute } = saved.reminder;
  useEffect(() => {
    if (!ready || !remindersSupported) return;
    if (!on) {
      void cancelReminder();
      return;
    }
    const ui = l1Bundle(l1).ui;
    const language = target ? (courseBundle(l1, target)?.gloss.name ?? '') : '';
    const text = {
      title: translate(ui, 'reminder.title'),
      body: translate(ui, 'reminder.body', { language }),
      channel: translate(ui, 'reminder.channel'),
    };
    reminderPermitted()
      .then((ok) => (ok ? scheduleReminder(hour, minute, text) : undefined))
      .catch(() => {});
  }, [ready, on, hour, minute, l1, target]);

  const deleteMyData = useCallback(async () => {
    const s = sync.current;
    s.paused = true;
    clearTimeout(s.timer);
    // An upload still in flight must not re-create the account after it is deleted.
    await s.running;
    try {
      await api.deleteAccount();
    } catch {
      s.paused = false;
      return false;
    }
    await cancelReminder().catch(() => {});
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setSaved((cur) => fresh(cur.l1));
    s.paused = false;
    return true;
  }, []);

  const ui = l1Bundle(saved.l1).ui;
  const { store, server, dev } = saved.entitlements;
  const value: AppState = {
    ready,
    l1: saved.l1,
    target: saved.target,
    progress: saved.progress,
    reminder: saved.reminder,
    premium: store || server || dev,
    t: (key, params) => translate(ui, key, params),
    setL1: (next) =>
      setSaved((cur) => ({ ...cur, l1: next, target: cur.target && courseBundle(next, cur.target) ? cur.target : undefined })),
    setTarget: (next) => setSaved((cur) => ({ ...cur, target: next })),
    finishLesson: (lessonId, results) => {
      setSaved((cur) => ({ ...cur, progress: completeLesson(cur.progress, lessonId, results, new Date()) }));
      scheduleSync(SYNC_AFTER_LESSON_MS);
    },
    reviewed: (itemId, correct) => {
      setSaved((cur) => ({ ...cur, progress: reviewItem(cur.progress, itemId, correct, new Date()) }));
      scheduleSync(SYNC_AFTER_REVIEW_MS);
    },
    setReminder: async (next) => {
      // Asks only the first time; afterwards this just reports whether notifications are still allowed.
      if (next.on && !(await requestReminderPermission().catch(() => false))) return 'denied';
      setSaved((cur) => ({ ...cur, reminder: next }));
      return 'ok';
    },
    refreshPremium,
    unlockForTesting: () => setSaved((cur) => ({ ...cur, entitlements: { ...cur.entitlements, dev: true } })),
    deleteMyData,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Context);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}
