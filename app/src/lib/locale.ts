import { L1S, type L1 } from '@linguasea/contract';
import { getLocales } from 'expo-localization';

import { bundle } from '@/content';

/** Some systems report Filipino as Tagalog. */
const ALIASES: Record<string, string> = { tl: 'fil' };

export function isL1(code: string): code is L1 {
  return (L1S as readonly string[]).includes(code);
}

/** Interface language for a first launch: the first preferred device language the bundle has, else Thai. */
export function deviceL1(): L1 {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode?.toLowerCase();
      const l1 = code ? (ALIASES[code] ?? code) : undefined;
      if (l1 && isL1(l1) && bundle.l1s[l1]) return l1;
    }
  } catch {}
  return 'th';
}
