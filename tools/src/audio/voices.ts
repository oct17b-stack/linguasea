import type { Target } from '@linguasea/contract';

// Everything that decides how a clip sounds. Voice name, rate and output format are all part of each
// clip's file hash, so changing anything here records new files on the next run (`--prune` removes the old ones).

/** Azure output format (X-Microsoft-OutputFormat): 24 kHz mono MP3 at 48 kbit/s. */
export const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

/** SSML prosody rate: words and phrases a little slower for learners, dialogue at natural speed. */
export const ITEM_RATE = '-10%';
export const DIALOGUE_RATE = '0%';

/**
 * Azure neural voices per course. "item" reads words and phrases, "a" is the learner's side of a
 * dialogue (Nam), "b" a man Nam talks to and "c" a woman Nam talks to (e.g. Yuki, Emma) — a different
 * female voice from Nam's, so the two sides of a dialogue are easy to tell apart.
 * Voice list: https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts
 */
export const VOICES: Record<Target, { lang: string; item: string; a: string; b: string; c: string }> = {
  zh: { lang: 'zh-CN', item: 'zh-CN-XiaoxiaoNeural', a: 'zh-CN-XiaoxiaoNeural', b: 'zh-CN-YunxiNeural', c: 'zh-CN-XiaohanNeural' },
  en: { lang: 'en-US', item: 'en-US-JennyNeural', a: 'en-US-JennyNeural', b: 'en-US-GuyNeural', c: 'en-US-AriaNeural' },
  ja: { lang: 'ja-JP', item: 'ja-JP-NanamiNeural', a: 'ja-JP-NanamiNeural', b: 'ja-JP-KeitaNeural', c: 'ja-JP-AoiNeural' },
  ko: { lang: 'ko-KR', item: 'ko-KR-SunHiNeural', a: 'ko-KR-SunHiNeural', b: 'ko-KR-InJoonNeural', c: 'ko-KR-JiMinNeural' },
};

// Adult voices only (some Azure voices, e.g. ko-KR-SeoHyeonNeural, are children's voices).

/** What Azure is asked for: SSML xml:lang, voice name and prosody rate. */
export type Voice = { lang: string; name: string; rate: string };

/** The Azure voice for a clip voice ("item", "a", "b", "c"); undefined for a speaker the table does not have. */
export function azureVoice(target: Target, voice: string): Voice | undefined {
  const t = VOICES[target];
  if (voice === 'item') return { lang: t.lang, name: t.item, rate: ITEM_RATE };
  if (voice === 'a' || voice === 'b' || voice === 'c') return { lang: t.lang, name: t[voice], rate: DIALOGUE_RATE };
  return undefined;
}
