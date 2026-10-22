import type { CourseBundle } from '@linguasea/contract';
import type { Choice, Step } from '@linguasea/core';
import { useState } from 'react';

import {
  ChooseStep,
  DialogueStep,
  IntroStep,
  LearnStep,
  LineStep,
  NoteStep,
  QuestionStep,
  ReadStep,
  SpeakStep,
} from '@/components/lesson/steps';

type QuestionStepKind = Extract<Step, { kind: 'choose' | 'question' | 'line' }>;

/** Steps that wait for an answer before "next". */
export function isQuestion(step: Step | undefined): step is QuestionStepKind {
  return step?.kind === 'choose' || step?.kind === 'question' || step?.kind === 'line';
}

/**
 * Walks through a list of steps (lesson, reader, practice, unit test, placement) and keeps score:
 * `results` per item for the review cards (an item counts as known only if every question about it
 * was right), `correct` / `total` per question for what the learner sees and for pass marks.
 */
export function useRunner(steps: Step[]) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const step = steps[index];
  const picked = picks[index];

  const pick = (choice: Choice) => {
    if (!isQuestion(step) || picked !== undefined) return;
    setPicks((p) => ({ ...p, [index]: choice.id }));
    setScore((s) => ({ correct: s.correct + (choice.correct ? 1 : 0), total: s.total + 1 }));
    if (step.kind === 'choose') {
      const id = step.word.id;
      setResults((r) => ({ ...r, [id]: (r[id] ?? true) && choice.correct }));
    }
  };

  return {
    index,
    step,
    picked,
    results,
    score,
    pick,
    /** "Next" is allowed: nothing to answer, or answered. */
    ready: !isQuestion(step) || picked !== undefined,
    next: () => setIndex((i) => i + 1),
  };
}

/** One step on screen (everything but "done", which each screen shows its own way). */
export function StepView({
  step,
  index,
  course,
  picked,
  onPick,
}: {
  step: Step;
  index: number;
  course: CourseBundle;
  picked?: string;
  onPick: (choice: Choice) => void;
}) {
  // `key={index}` gives every step fresh state (and its own auto-play), even two of the same kind in a row.
  switch (step.kind) {
    case 'intro':
      return <IntroStep key={index} step={step} />;
    case 'learn':
      return <LearnStep key={index} step={step} course={course} />;
    case 'dialogue':
      return <DialogueStep key={index} step={step} course={course} />;
    case 'note':
      return <NoteStep key={index} step={step} />;
    case 'read':
      return <ReadStep key={index} step={step} course={course} />;
    case 'question':
      return <QuestionStep key={index} step={step} picked={picked} onPick={onPick} />;
    case 'line':
      return <LineStep key={index} step={step} course={course} picked={picked} onPick={onPick} />;
    case 'choose':
      return <ChooseStep key={index} step={step} course={course} picked={picked} onPick={onPick} />;
    case 'speak':
      return <SpeakStep key={index} step={step} course={course} />;
    case 'done':
      return null;
  }
}
