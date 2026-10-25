// Knows the right answer to any question in a course (from the app's generated content), so tests
// can answer right or wrong on purpose: word questions, reader comprehension, sentence-by-ear.
import { t } from './harness.mjs';

/** What a learner would have to know to answer every question of `course` (one course bundle). */
export function answerKey(course) {
  const meaningOf = new Map();
  const textsOf = new Map();
  const lineMeaning = new Map();
  const questionAnswer = new Map();
  for (const { lesson, gloss } of Object.values(course.lessons)) {
    for (const item of lesson.items) {
      const m = gloss.items[item.id]?.meaning;
      if (!m) continue;
      if (!meaningOf.has(item.text)) meaningOf.set(item.text, m);
      textsOf.set(m, [...(textsOf.get(m) ?? []), item.text]);
    }
    lesson.dialogue.forEach((l, i) => lineMeaning.set(l.text, gloss.dialogue[i]));
    lesson.questions.forEach((q, i) => {
      const g = gloss.questions[i];
      if (g) questionAnswer.set(g.prompt, g.options[q.answer]);
    });
  }
  // Generated clips (served at /audio/<path>) → the text they speak.
  const clipText = new Map(Object.entries(course.audio ?? {}).map(([k, path]) => [path, k.slice(k.indexOf('|') + 1)]));
  return { meaningOf, textsOf, lineMeaning, questionAnswer, clipText };
}

/** Records speech synthesis and <audio> playback, so tests know what the learner just heard. */
export const AUDIO_PROBE = () => {
  window.__audio = [];
  const synth = window.speechSynthesis;
  if (synth) {
    const speak = synth.speak.bind(synth);
    synth.speak = (u) => {
      window.__audio.push({ kind: 'tts', text: u.text, lang: u.lang });
      return speak(u);
    };
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__audio.push({ kind: 'clip', src: this.src });
    return play.call(this);
  };
};

const footerLabels = () => [t('step.start'), t('common.next'), t('step.speakOk'), t('done.back'), t('placement.finish')];

/** The button that moves a lesson, practice, test or quiz on. */
export function footer(page) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByRole('button', { name: new RegExp(`^(${footerLabels().map(escape).join('|')})$`) });
}

/** Visible answer buttons and their labels. */
async function options(page) {
  const buttons = page.locator('[role="button"]:visible').filter({ hasNotText: /🔊|🐢/ });
  const labels = (await buttons.allInnerTexts()).map((s) => s.trim());
  const skip = new Set(footerLabels());
  return labels
    .map((label, i) => ({ label, el: buttons.nth(i) }))
    .filter((o) => o.label && !skip.has(o.label) && !o.label.startsWith('▶'));
}

/** The path under /audio/ of a clip URL ("zh/abc.mp3"), or undefined for other URLs. */
export const clipPath = (src) => {
  const m = /\/audio\/(.+)$/.exec(src ? new URL(src).pathname : '');
  return m ? decodeURIComponent(m[1]) : undefined;
};

/** What the learner heard last: a TTS text, or the text of the generated clip that played. */
async function lastSpoken(page, key) {
  const audio = await page.evaluate(() => window.__audio ?? []);
  const last = [...audio].reverse().find((a) => a.kind === 'tts' || a.kind === 'clip');
  return last?.kind === 'clip' ? key.clipText.get(clipPath(last.src)) : last?.text;
}

/** Answers the question on screen, right or wrong; returns false when there was none. */
export async function answer(page, key, mode = 'right') {
  const opts = await options(page);
  if (opts.length < 2) return false;
  const shown = async (s) => !!s && (await page.getByText(s, { exact: true }).count()) > 0;
  let right;
  if (await page.getByText(`❓ ${t('step.question')}`).count()) {
    for (const [prompt, label] of key.questionAnswer) if (await shown(prompt)) right = label;
  } else if (await page.getByText(t('step.line'), { exact: true }).count()) {
    right = key.lineMeaning.get(await lastSpoken(page, key));
  } else if (opts.some((o) => key.meaningOf.has(o.label))) {
    // Answers are target-language text: the one whose meaning is the prompt, or the one heard.
    for (const o of opts) if (key.meaningOf.has(o.label) && (await shown(key.meaningOf.get(o.label)))) right = o.label;
    if (!right) {
      const heard = await lastSpoken(page, key);
      if (opts.some((o) => o.label === heard)) right = heard;
    }
  } else {
    // Answers are meanings: of the word on screen, or of the word heard.
    for (const o of opts) {
      for (const text of key.textsOf.get(o.label) ?? []) if (await shown(text)) right = o.label;
    }
    right ??= key.meaningOf.get(await lastSpoken(page, key));
  }
  const pick = mode === 'right' ? opts.find((o) => o.label === right) : opts.find((o) => o.label !== right);
  await (pick ?? opts[0]).el.click();
  return true;
}

/** Answers and moves on until the footer shows one of `until`; returns that label. */
export async function play(page, key, mode = 'right', { until = [t('done.back')], onStep } = {}) {
  for (let i = 0; i < 150; i++) {
    const next = footer(page).first();
    await next.waitFor({ timeout: 10_000 });
    await page.waitForTimeout(80);
    const label = (await next.innerText()).trim();
    if (until.includes(label)) return label;
    if (await next.isDisabled()) await answer(page, key, mode);
    if (onStep) await onStep(i);
    await next.click();
  }
  throw new Error('did not reach the end');
}
