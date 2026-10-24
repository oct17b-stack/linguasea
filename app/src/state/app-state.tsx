import { courseKey, type CourseBundle, type L1, type Target } from '@linguasea/contract';
import {
  completeLesson,
  emptyProgress,
  mergeProgress,
  recordAnswers,
  reviewItem,
  skipLessons,
  type Progress,
} from '@linguasea/core';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState as SystemAppState } from 'react-native';

import { contentIndex, courseIndex, isCourseLoaded, l1Index, loadCourse } from '@/content';
import * as api from '@/lib/api';
import { translate } from '@/lib/i18n';
import { deviceL1 } from '@/lib/locale';
import { forgetPurchaser, identify, startPurchases } from '@/lib/purchases';
import { clearState, loadState, saveState } from '@/lib/state-store';
import {
  cancelReminder,
  reminderPermitted,
  remindersSupported,
  requestReminderPermission,
  scheduleReminder,
} from '@/lib/reminders';


/** Wait after a finished lesson / a reviewed card before syncing, so a review session sends one update. */
const SYNC_AFTER_LESSON_MS = 500;
const SYNC_AFTER_REVIEW_MS = 3000;
/** Coming back to the app syncs again, at most this often. */
const FOREGROUND_SYNC_MS = 60_000;
/** Each review answer changes the state; with thousands of cards, writing it every time would stutter. */
const SAVE_MS = 1000;

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

/** The learner's answer on the AI tutor consent screen (Apple 5.1.2(i)): data goes to Anthropic / Azure only after "agreed". */
export type TutorConsent = 'agreed' | 'declined';

type Saved = {
  l1: L1;
  target?: Target;
  progress: Progress;
  reminder: Reminder;
  entitlements: Entitlements;
  /** Courses whose placement question ("studied this before?") was answered. */
  placed: Partial<Record<Target, true>>;
  tutorConsent?: TutorConsent;
};

type AppState = {
  ready: boolean;
  l1: L1;
  target?: Target;
  /**
   * The chosen course with all its lessons. Undefined when none is chosen, and for the moment
   * after choosing one while it is read (screens show a spinner then).
   */
  course?: CourseBundle;
  progress: Progress;
  reminder: Reminder;
  /** Store entitlement OR server entitlement (OR the development unlock). */
  premium: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setL1: (l1: L1) => void;
  setTarget: (target: Target) => void;
  /** A finished lesson, reader, practice session or passed unit test (`results`: item id → answered right). */
  finishLesson: (lessonId: string, results: Record<string, boolean>) => void;
  /** A failed unit test: the answers still train the review cards, nothing is marked done. */
  recordTest: (results: Record<string, boolean>) => void;
  /** Placement passed: these lessons count as done. */
  skipLessons: (lessonIds: string[]) => void;
  reviewed: (itemId: string, correct: boolean) => void;
  placed: Partial<Record<Target, true>>;
  markPlaced: (target: Target) => void;
  tutorConsent?: TutorConsent;
  setTutorConsent: (consent: TutorConsent | undefined) => void;
  /** Turns the daily reminder on / off or moves it; "denied" when notifications are not allowed. */
  setReminder: (reminder: Reminder) => Promise<'ok' | 'denied'>;
  /** Re-reads the server's subscription state (after a restore). */
  refreshPremium: () => void;
  /** The email this install is signed in with; null when it uses an anonymous account (or none yet). */
  signedInEmail: string | null;
  /** Email sign-in, step 1: the server emails a 6-digit code. */
  requestSignInCode: (email: string) => Promise<api.SignInStart>;
  /**
   * Email sign-in, step 2: on success this install uses the email's account from now on, its progress
   * is synced (the server merged this install's progress into it) and the subscription re-read.
   */
  verifySignInCode: (email: string, code: string) => Promise<api.SignInVerify>;
  /** Back to an anonymous account; the progress on this device stays. */
  signOut: () => Promise<void>;
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
    placed: {},
  };
}

/** Saved state from storage, tolerating older versions and content that changed since. */
function revive(raw: string | null): Saved {
  const base = fresh();
  if (!raw) return base;
  const old = JSON.parse(raw) as Partial<Saved> & { premium?: boolean };
  const l1 = old.l1 && contentIndex.l1s[old.l1] ? old.l1 : base.l1;
  const ent: Partial<Entitlements> = old.entitlements ?? {};
  const until = typeof ent.serverUntil === 'string' ? ent.serverUntil : null;
  return {
    l1,
    target: old.target && courseIndex(l1, old.target) ? old.target : undefined,
    progress: old.progress?.version === 1 ? old.progress : base.progress,
    reminder: { ...base.reminder, ...old.reminder },
    placed: { ...old.placed },
    tutorConsent: old.tutorConsent === 'agreed' || old.tutorConsent === 'declined' ? old.tutorConsent : undefined,
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
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
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
    loadState()
      .then((raw) => setSaved(revive(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Saved at most every SAVE_MS, one write at a time, and at once when the app leaves the foreground.
  const saving = useRef({
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    dirty: false,
    writes: Promise.resolve(),
  });
  const flush = useCallback(() => {
    const w = saving.current;
    clearTimeout(w.timer);
    w.timer = undefined;
    if (w.dirty) {
      w.dirty = false;
      const raw = JSON.stringify(latest.current);
      w.writes = w.writes.then(() => saveState(raw)).catch(() => {});
    }
    return w.writes;
  }, []);

  useEffect(() => {
    if (!ready) return;
    const w = saving.current;
    w.dirty = true;
    w.timer ??= setTimeout(flush, SAVE_MS);
  }, [saved, ready, flush]);

  useEffect(() => {
    const sub = SystemAppState.addEventListener('change', (state) => {
      if (state !== 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

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
    return api
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
      setSignedInEmail(account?.email ?? null);
      if (account) void identify(account.id);
      else void forgetPurchaser();
    });
    void api.currentAccount().then(async (account) => {
      if (closed) return;
      setSignedInEmail(account?.email ?? null);
      stopPurchases = startPurchases(account?.id, (store) =>
        setSaved((cur) => (cur.entitlements.store === store ? cur : { ...cur, entitlements: { ...cur.entitlements, store } })),
      );
      // An account made while RevenueCat was still being configured.
      const latestAccount = await api.currentAccount();
      if (latestAccount && latestAccount.id !== account?.id) void identify(latestAccount.id);
      // The account is made lazily: only once there is progress to keep.
      if (api.apiEnabled && (latestAccount || hasProgress(latest.current.progress))) {
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

  // The chosen course is read from its own file (only the index is loaded at startup). A course read
  // before is ready at once; a new one is read right after the screen that chose it has painted.
  const [current, setCurrent] = useState<{ key: string; course: CourseBundle }>();
  const wanted = saved.target ? courseKey(saved.l1, saved.target) : undefined;
  useEffect(() => {
    if (!ready || !saved.target || current?.key === wanted) return;
    const { l1, target } = saved;
    const read = () => {
      const course = loadCourse(l1, target);
      if (course) setCurrent({ key: courseKey(l1, target), course });
    };
    if (isCourseLoaded(l1, target)) {
      read();
      return;
    }
    const timer = setTimeout(read, 0);
    return () => clearTimeout(timer);
  }, [ready, saved, current, wanted]);
  const course = current && current.key === wanted ? current.course : undefined;

  // Keep the scheduled reminder in step with its settings and the course it names.
  const { l1, target } = saved;
  const { on, hour, minute } = saved.reminder;
  useEffect(() => {
    if (!ready || !remindersSupported) return;
    if (!on) {
      void cancelReminder();
      return;
    }
    const ui = l1Index(l1).ui;
    const language = target ? (courseIndex(l1, target)?.name ?? '') : '';
    const text = {
      title: translate(ui, 'reminder.title'),
      body: translate(ui, 'reminder.body', { language }),
      channel: translate(ui, 'reminder.channel'),
    };
    reminderPermitted()
      .then((ok) => (ok ? scheduleReminder(hour, minute, text) : undefined))
      .catch(() => {});
  }, [ready, on, hour, minute, l1, target]);

  /** Holds syncs back while the account changes, so none goes out with the old token meanwhile. */
  const withSyncPaused = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const s = sync.current;
    s.paused = true;
    clearTimeout(s.timer);
    await s.running;
    try {
      return await fn();
    } finally {
      s.paused = false;
    }
  }, []);

  const verifySignInCode = useCallback(
    async (email: string, code: string) => {
      const result = await withSyncPaused(() => api.verifyEmailCode(email, code));
      if (result.kind === 'ok') {
        await runSync();
        await refreshPremium();
      }
      return result;
    },
    [withSyncPaused, runSync, refreshPremium],
  );

  const signOut = useCallback(async () => {
    await withSyncPaused(() => api.signOut());
    // The subscription stays with the email account; this device has none until signed in again.
    setSaved((cur) => ({ ...cur, entitlements: { ...cur.entitlements, server: false, serverUntil: null } }));
  }, [withSyncPaused]);

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
    // A pending save must not write the old state back after it is cleared.
    const w = saving.current;
    clearTimeout(w.timer);
    w.timer = undefined;
    w.dirty = false;
    await w.writes;
    await clearState().catch(() => {});
    setSaved((cur) => fresh(cur.l1));
    s.paused = false;
    return true;
  }, []);

  const ui = l1Index(saved.l1).ui;
  const { store, server, dev } = saved.entitlements;
  const value: AppState = {
    ready,
    l1: saved.l1,
    target: saved.target,
    course,
    progress: saved.progress,
    reminder: saved.reminder,
    premium: store || server || dev,
    t: (key, params) => translate(ui, key, params),
    setL1: (next) =>
      setSaved((cur) => ({ ...cur, l1: next, target: cur.target && courseIndex(next, cur.target) ? cur.target : undefined })),
    setTarget: (next) => setSaved((cur) => ({ ...cur, target: next })),
    finishLesson: (lessonId, results) => {
      setSaved((cur) => ({ ...cur, progress: completeLesson(cur.progress, lessonId, results, new Date()) }));
      scheduleSync(SYNC_AFTER_LESSON_MS);
    },
    recordTest: (results) => {
      setSaved((cur) => ({ ...cur, progress: recordAnswers(cur.progress, results, new Date()) }));
      scheduleSync(SYNC_AFTER_LESSON_MS);
    },
    skipLessons: (lessonIds) => {
      setSaved((cur) => ({ ...cur, progress: skipLessons(cur.progress, lessonIds, new Date()) }));
      scheduleSync(SYNC_AFTER_LESSON_MS);
    },
    placed: saved.placed,
    markPlaced: (t) => setSaved((cur) => (cur.placed[t] ? cur : { ...cur, placed: { ...cur.placed, [t]: true } })),
    tutorConsent: saved.tutorConsent,
    setTutorConsent: (tutorConsent) => setSaved((cur) => ({ ...cur, tutorConsent })),
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
    refreshPremium: () => void refreshPremium(),
    signedInEmail,
    requestSignInCode: (email) => api.startEmailSignIn(email, saved.l1),
    verifySignInCode,
    signOut,
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
