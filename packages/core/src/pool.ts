import { kindGroup, sameReading, type CourseBundle, type Item } from '@linguasea/contract';

/** An item joined with its explanation in the learner's language. */
export type Word = Item & {
  meaning: string;
  translit?: string;
  /** Lesson that first teaches it, and that lesson's position in the course. */
  lesson: string;
  order: number;
};

// Course bundles are loaded once and never changed, so each one's pool is built only once.
const pools = new WeakMap<CourseBundle, ReadonlyMap<string, Word>>();

/** Every item in the course in teaching order; first occurrence wins (ids mean the same thing everywhere). */
export function coursePool(course: CourseBundle): ReadonlyMap<string, Word> {
  const cached = pools.get(course);
  if (cached) return cached;
  const pool = new Map<string, Word>();
  let order = 0;
  for (const stage of course.course.stages) {
    for (const unit of stage.units) {
      for (const id of unit.lessons) {
        const entry = course.lessons[id];
        order++;
        if (!entry) continue;
        for (const item of entry.lesson.items) {
          const g = entry.gloss.items[item.id];
          if (!pool.has(item.id) && g) pool.set(item.id, { ...item, ...g, lesson: id, order });
        }
      }
    }
  }
  pools.set(course, pool);
  return pool;
}

/** Same group of question (vocabulary vs sounds) — wrong answers never cross groups. */
export function sameGroup(a: Item, b: Item): boolean {
  return kindGroup(a.kind) === kindGroup(b.kind);
}

/**
 * Two answer labels a learner cannot tell apart: they differ only in case, spacing, punctuation or
 * symbols ("เยี่ยมเลย! ขอบคุณ" / "เยี่ยมเลย ขอบคุณ!", "ออกไป (ข้างนอก)" / "ออกไปข้างนอก") or in
 * full-width vs. half-width forms. Letters and their marks (tones, dakuten) still count.
 */
export function labelKey(label: string): string {
  const plain = label.normalize('NFKC').toLowerCase();
  // A label made only of punctuation (an item teaching "。") keeps its marks.
  return plain.replace(/[\s\p{P}\p{S}]/gu, '') || plain.replace(/\s/gu, '');
}

export function sameLabel(a: string, b: string): boolean {
  return labelKey(a) === labelKey(b);
}

/** Text to send to TTS for an item. */
export function spoken(item: Pick<Item, 'text' | 'say'>): string {
  return item.say ?? item.text;
}

/** Two items a learner cannot tell apart by ear (あ / ア, 他 / 她). */
export function soundsAlike(a: Pick<Item, 'reading'>, b: Pick<Item, 'reading'>): boolean {
  return sameReading(a.reading, b.reading);
}
