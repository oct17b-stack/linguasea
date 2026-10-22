import type { Bundle, L1, Target } from '@linguasea/contract';

/** What the AI tutor role-plays for one unit: built from the unit's own content, so it stays within what was taught. */
export type Scenario = {
  target: Target;
  l1: L1;
  unitId: string;
  cefr: string;
  /** Unit title and can-do goal, in the learner's language. */
  title: string;
  goal: string;
  /** Words the learner has met up to and including this unit (most recent last). */
  vocabulary: { text: string; reading: string; meaning: string }[];
  /** Model lines from the unit's dialogues: "a" is the learner's role. */
  examples: { speaker: string; text: string; meaning: string }[];
};

const MAX_VOCABULARY = 80;
const MAX_EXAMPLES = 16;

export function buildScenario(bundle: Bundle, l1: L1, target: Target, unitId: string): Scenario | undefined {
  const course = bundle.l1s[l1]?.courses[target];
  if (!course) return undefined;
  const stage = course.course.stages.find((s) => s.units.some((u) => u.id === unitId));
  if (!stage) return undefined;

  const vocabulary: Scenario['vocabulary'] = [];
  const seen = new Set<string>();
  const examples: Scenario['examples'] = [];
  outer: for (const s of course.course.stages) {
    for (const unit of s.units) {
      for (const id of unit.lessons) {
        const entry = course.lessons[id];
        if (!entry) continue;
        for (const item of entry.lesson.items) {
          const meaning = entry.gloss.items[item.id]?.meaning;
          // Sound drills (kana, tones) are not conversation material.
          if (seen.has(item.id) || !meaning || item.kind === 'letter' || item.kind === 'syllable') continue;
          seen.add(item.id);
          vocabulary.push({ text: item.text, reading: item.reading, meaning });
        }
        if (unit.id === unitId) {
          entry.lesson.dialogue.forEach((line, i) =>
            examples.push({ speaker: line.speaker, text: line.text, meaning: entry.gloss.dialogue[i] ?? '' }),
          );
        }
      }
      if (unit.id === unitId) break outer;
    }
  }

  const unitGloss = course.gloss.units[unitId];
  return {
    target,
    l1,
    unitId,
    cefr: stage.cefr,
    title: unitGloss?.title ?? unitId,
    goal: unitGloss?.goal ?? unitGloss?.title ?? unitId,
    vocabulary: vocabulary.slice(-MAX_VOCABULARY),
    examples: examples.slice(0, MAX_EXAMPLES),
  };
}
