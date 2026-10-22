import { loadContent } from '@linguasea/contract/node';
import { afterEach, describe, expect, it } from 'vitest';

import { clipHash, collectClips, recordingPath } from './clips';
import { makeContent } from './fixture';
import { OUTPUT_FORMAT } from './voices';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((f) => f()));

function content(extra: Parameters<typeof makeContent>[0] = {}) {
  const c = makeContent(extra);
  cleanups.push(c.cleanup);
  return c;
}

describe('collectClips', () => {
  it('lists every item (spoken text) and dialogue line once per course, in its voice', () => {
    const { clips, recordings, warnings } = collectClips(loadContent(content().root), ['zh', 'en']);
    expect(clips.map((c) => `${c.target} ${c.key}`)).toEqual([
      'zh item|你好',
      'zh item|妈', // say, not the pinyin text
      'zh a|你好！',
      'zh b|你好！', // same text, other speaker: its own clip
      'zh item|谢谢',
      'zh a|谢谢！',
      'zh b|不客气。',
      'en item|Hello',
      'en item|rock & roll',
      "en a|Hi, I'm Nam.",
      'en b|Nice to meet you.',
    ]);
    expect(recordings).toEqual([]);
    expect(warnings).toEqual([]);

    const byKey = (key: string) => clips.find((c) => c.key === key)!;
    expect(byKey('item|妈')).toMatchObject({
      voice: 'item',
      text: '妈',
      azure: { lang: 'zh-CN', name: 'zh-CN-XiaoxiaoNeural', rate: '-10%' },
      where: 'zh-A1-01 zh.ma1',
    });
    expect(byKey('a|你好！').azure).toEqual({ lang: 'zh-CN', name: 'zh-CN-XiaoxiaoNeural', rate: '0%' });
    expect(byKey('b|你好！').azure).toEqual({ lang: 'zh-CN', name: 'zh-CN-YunxiNeural', rate: '0%' });
    expect(byKey('b|Nice to meet you.').azure.name).toBe('en-US-GuyNeural');
    expect(byKey('b|不客气。').where).toBe('zh-A1-02 dialogue line 2');
    for (const c of clips) expect(c.file).toBe(`${c.target}/${c.hash}.mp3`);
  });

  it('covers only the requested courses', () => {
    const { clips } = collectClips(loadContent(content().root), ['en']);
    expect(new Set(clips.map((c) => c.target))).toEqual(new Set(['en']));
  });

  it('warns about a speaker the voice table does not have', () => {
    const { write, root } = content();
    write('courses/en/lessons/en-A1-01.json', {
      id: 'en-A1-01',
      target: 'en',
      stage: 'A',
      minutes: 5,
      items: [{ id: 'en.hello', text: 'Hello', reading: 'həˈloʊ' }],
      dialogue: [{ speaker: 'd', text: 'Hello!', reading: 'x' }],
    });
    const { clips, warnings } = collectClips(loadContent(root), ['en']);
    expect(clips.map((c) => c.key)).toEqual(['item|Hello']);
    expect(warnings).toEqual(['en-A1-01 dialogue line 1: no voice for speaker "d" (tools/src/audio/voices.ts has item, a, b, c)']);
  });

  it('lists recorded clips (Item.audio) under their key', () => {
    const { write, root } = content();
    write('courses/en/lessons/en-A1-01.json', {
      id: 'en-A1-01',
      target: 'en',
      stage: 'A',
      minutes: 5,
      items: [
        { id: 'en.hello', text: 'Hello', reading: 'həˈloʊ', audio: './en/recorded/hello.mp3' },
        { id: 'en.bye', text: 'Bye', reading: 'baɪ', audio: '../secret.mp3' },
      ],
    });
    const { recordings, warnings } = collectClips(loadContent(root), ['en']);
    expect(recordings).toEqual([{ target: 'en', key: 'item|Hello', file: 'en/recorded/hello.mp3', where: 'en-A1-01 en.hello' }]);
    expect(warnings).toEqual(['en-A1-01 en.bye: audio "../secret.mp3" must be a path inside content/audio']);
  });
});

describe('clipHash', () => {
  it('is stable: first 16 hex of sha1 over voice, rate, text and format', () => {
    expect(clipHash({ name: 'zh-CN-XiaoxiaoNeural', rate: '-10%' }, '你好')).toBe('58512371f159b3f8');
    expect(clipHash({ name: 'en-US-GuyNeural', rate: '0%' }, 'Nice to meet you.', OUTPUT_FORMAT)).toBe('ea6e44023ccd4089');
  });

  it('changes when the voice, rate, text or format changes', () => {
    const base = clipHash({ name: 'ja-JP-NanamiNeural', rate: '-10%' }, 'ありがとう');
    const variants = [
      clipHash({ name: 'ja-JP-KeitaNeural', rate: '-10%' }, 'ありがとう'),
      clipHash({ name: 'ja-JP-NanamiNeural', rate: '0%' }, 'ありがとう'),
      clipHash({ name: 'ja-JP-NanamiNeural', rate: '-10%' }, 'ありがとう。'),
      clipHash({ name: 'ja-JP-NanamiNeural', rate: '-10%' }, 'ありがとう', 'audio-48khz-96kbitrate-mono-mp3'),
    ];
    expect(new Set([base, ...variants]).size).toBe(5);
    for (const h of [base, ...variants]) expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('recordingPath', () => {
  it('keeps paths inside content/audio', () => {
    expect(recordingPath('zh/recorded/ni-hao.mp3')).toBe('zh/recorded/ni-hao.mp3');
    expect(recordingPath('/zh\\a.mp3')).toBe('zh/a.mp3');
    expect(recordingPath('zh/../../a.mp3')).toBeUndefined();
    expect(recordingPath('')).toBeUndefined();
  });
});
