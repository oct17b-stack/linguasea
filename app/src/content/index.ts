import type { Bundle, CourseBundle, L1, L1Bundle, Target } from '@linguasea/contract';

// Built from /content by `npm run content` (packages/contract). Later: downloaded per L1 from the CDN.
import raw from './bundle.generated.json';

export const bundle = raw as unknown as Bundle;

export function l1Bundle(l1: L1): L1Bundle {
  const b = bundle.l1s[l1];
  if (!b) throw new Error(`no content for ${l1}`);
  return b;
}

export function courseBundle(l1: L1, target: Target): CourseBundle | undefined {
  return bundle.l1s[l1]?.courses[target];
}

/** Which course a lesson or item id belongs to, e.g. "zh-A1-01" / "zh.ni-hao" → "zh". */
export function targetOf(id: string): Target {
  return id.slice(0, 2) as Target;
}
