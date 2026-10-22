import AsyncStorage from '@react-native-async-storage/async-storage';
import type { L1, Target } from '@linguasea/contract';
import { completeLesson, emptyProgress, reviewItem, type Progress } from '@linguasea/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { l1Bundle } from '@/content';
import { translate } from '@/lib/i18n';

const STORAGE_KEY = 'linguasea/state/v1';

type Saved = {
  l1: L1;
  target?: Target;
  /** Mirrors the store entitlement; RevenueCat becomes the source of truth once purchases are wired. */
  premium: boolean;
  progress: Progress;
};

type AppState = Saved & {
  ready: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setTarget: (target: Target) => void;
  setPremium: (premium: boolean) => void;
  finishLesson: (lessonId: string, results: Record<string, boolean>) => void;
  reviewed: (itemId: string, correct: boolean) => void;
};

const initial: Saved = { l1: 'th', premium: false, progress: emptyProgress() };

const Context = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSaved({ ...initial, ...(JSON.parse(raw) as Partial<Saved>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  const ui = l1Bundle(saved.l1).ui;
  const value: AppState = {
    ...saved,
    ready,
    t: (key, params) => translate(ui, key, params),
    setTarget: (target) => setSaved((s) => ({ ...s, target })),
    setPremium: (premium) => setSaved((s) => ({ ...s, premium })),
    finishLesson: (lessonId, results) =>
      setSaved((s) => ({ ...s, progress: completeLesson(s.progress, lessonId, results, new Date()) })),
    reviewed: (itemId, correct) =>
      setSaved((s) => ({ ...s, progress: reviewItem(s.progress, itemId, correct, new Date()) })),
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Context);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}
