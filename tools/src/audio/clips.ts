import { createHash } from 'node:crypto';

import { audioKey, TARGETS, type Target } from '@linguasea/contract';
import type { Loaded } from '@linguasea/contract/node';
import { spoken } from '@linguasea/core';

import { azureVoice, OUTPUT_FORMAT, type Voice } from './voices';

/** One generated speech file. */
export type Clip = {
  target: Target;
  /** "item" for words and phrases, otherwise the dialogue speaker ("a", "b", "c"). */
  voice: string;
  text: string;
  /** audioKey(voice, text): what the app looks the clip up by. */
  key: string;
  azure: Voice;
  hash: string;
  /** Path under content/audio (= the server's /audio/), as the manifest lists it: "zh/<hash>.mp3". */
  file: string;
  /** First place it occurs, for messages: "zh-A1-01 zh.ni-hao" or "zh-A1-01 dialogue line 2". */
  where: string;
};

/** A recorded clip (Item.audio) that replaces generated speech for its key. */
export type Recording = { target: Target; key: string; file: string; where: string };

export type Collected = { clips: Clip[]; recordings: Recording[]; warnings: string[] };

/** First 16 hex of sha1 over everything that changes the sound, so any change gives a new file name. */
export function clipHash(azure: Pick<Voice, 'name' | 'rate'>, text: string, format: string = OUTPUT_FORMAT): string {
  return createHash('sha1')
    .update(JSON.stringify([azure.name, azure.rate, text, format]))
    .digest('hex')
    .slice(0, 16);
}

/** Item.audio as a clean path under content/audio ("zh/recorded/ni-hao.mp3"); undefined if it would leave that folder. */
export function recordingPath(path: string): string | undefined {
  const parts = path.replace(/\\/g, '/').split('/').filter((p) => p && p !== '.');
  if (!parts.length || parts.includes('..')) return undefined;
  return parts.join('/');
}

/**
 * Every clip the courses need, deduplicated per course: each item as voice "item" saying spoken(item),
 * each dialogue line in its speaker's voice, each reader sentence in the item voice. Items with `audio`
 * are also listed as recordings.
 */
export function collectClips(
  loaded: Loaded,
  targets: readonly Target[] = TARGETS,
  /** Only lessons whose id passes (e.g. one stage); default all. */
  include: (lessonId: string) => boolean = () => true,
): Collected {
  const clips: Clip[] = [];
  const recordings: Recording[] = [];
  const warnings: string[] = [];

  for (const target of targets) {
    const course = loaded.targets.get(target);
    if (!course) continue;
    const seen = new Set<string>();
    const recorded = new Map<string, Recording>();

    const add = (voice: string, text: string, where: string) => {
      const key = audioKey(voice, text);
      if (seen.has(key)) return;
      seen.add(key);
      const azure = azureVoice(target, voice);
      if (!azure) {
        warnings.push(`${where}: no voice for speaker "${voice}" (tools/src/audio/voices.ts has item, a, b, c)`);
        return;
      }
      const hash = clipHash(azure, text);
      clips.push({ target, voice, text, key, azure, hash, file: `${target}/${hash}.mp3`, where });
    };

    for (const lesson of course.lessons.values()) {
      if (!include(lesson.id)) continue;
      for (const item of lesson.items) {
        const where = `${lesson.id} ${item.id}`;
        const text = spoken(item);
        add('item', text, where);
        if (item.audio === undefined) continue;
        const key = audioKey('item', text);
        const file = recordingPath(item.audio);
        const first = recorded.get(key);
        if (!file) warnings.push(`${where}: audio "${item.audio}" must be a path inside content/audio`);
        else if (!first) recorded.set(key, { target, key, file, where });
        else if (first.file !== file) {
          warnings.push(`${where}: audio "${file}" differs from ${first.where} ("${first.file}") for the same text; using the first`);
        }
      }
      lesson.dialogue.forEach((line, i) => add(line.speaker, line.text, `${lesson.id} dialogue line ${i + 1}`));
      // Reader sentences are narrated in the item voice (a little slower, like the words).
      lesson.passage.forEach((para, p) =>
        para.forEach((sentence, i) => add('item', sentence.text, `${lesson.id} passage ${p + 1}.${i + 1}`)),
      );
    }
    recordings.push(...recorded.values());
  }
  return { clips, recordings, warnings };
}
