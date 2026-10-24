import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

import { loadContent } from '@linguasea/contract/node';
import { afterEach, describe, expect, it } from 'vitest';

import { ssml } from './azure';
import { collectClips } from './clips';
import { FILES, makeContent } from './fixture';
import { parseArgs, run, UsageError, type RunOptions } from './run';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((f) => f()));

function content() {
  const c = makeContent();
  cleanups.push(c.cleanup);
  return c;
}

const AZURE = { key: 'test-key', region: 'southeastasia' };
const quiet = () => {};

/** A stand-in for Azure: the "MP3" is the SSML it was asked for, unless `answer` returns another response. */
function fakeAzure(answer: (ssml: string) => Response | undefined = () => undefined) {
  const requests: string[] = [];
  const fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = String(init?.body);
    requests.push(body);
    return answer(body) ?? new Response(`fake mp3 for ${body}`, { headers: { 'content-type': 'audio/mpeg' } });
  }) as typeof globalThis.fetch;
  /** The texts that were synthesized, unescaped. */
  const texts = () =>
    requests.map((r) =>
      /<prosody[^>]*>(.*)<\/prosody>/
        .exec(r)![1]
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&'),
    );
  return { fetch, requests, texts };
}

const manifestOf = (audio: string, target: string): Record<string, string> =>
  JSON.parse(readFileSync(join(audio, target, 'manifest.json'), 'utf8'));

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

function runWith(root: string, extra: Partial<RunOptions> = {}) {
  return run({ contentRoot: root, targets: ['zh', 'en'], azure: AZURE, log: quiet, ...extra });
}

describe('run', () => {
  it('synthesizes every clip, writes the manifest, and skips existing files next time', async () => {
    const { root, audio } = content();
    const azure = fakeAzure();
    const first = await runWith(root, { fetch: azure.fetch });
    expect(first.failures).toEqual([]);
    expect(first.courses.map((c) => [c.target, c.clips, c.missing, c.written, c.manifest])).toEqual([
      ['zh', 7, 7, 7, 7],
      ['en', 4, 4, 4, 4],
    ]);
    expect(azure.requests).toHaveLength(11);
    expect(azure.requests).toContain(ssml({ lang: 'en-US', name: 'en-US-JennyNeural', rate: '-10%' }, 'rock & roll'));

    const { clips } = collectClips(loadContent(root), ['zh', 'en']);
    for (const clip of clips) {
      expect(readFileSync(join(audio, clip.file), 'utf8')).toBe(`fake mp3 for ${ssml(clip.azure, clip.text)}`);
    }

    // Sorted keys, "<target>/<hash>.mp3" values, and the contract loader picks it up for the bundle.
    const raw = readFileSync(join(audio, 'zh/manifest.json'), 'utf8');
    const manifest = JSON.parse(raw);
    const zh = clips.filter((c) => c.target === 'zh');
    expect(Object.keys(manifest)).toEqual(zh.map((c) => c.key).sort());
    expect(manifest).toEqual(Object.fromEntries(zh.map((c) => [c.key, c.file])));
    expect(manifest['item|妈']).toMatch(/^zh\/[0-9a-f]{16}\.mp3$/);
    expect(loadContent(root).targets.get('zh')!.audio).toEqual(manifest);

    // Second run: every file is there, so nothing is requested and the manifest stays the same.
    const again = fakeAzure();
    const second = await runWith(root, { fetch: again.fetch });
    expect(again.requests).toEqual([]);
    expect(second.courses.map((c) => [c.present, c.missing])).toEqual([
      [7, 0],
      [4, 0],
    ]);
    expect(readFileSync(join(audio, 'zh/manifest.json'), 'utf8')).toBe(raw);

    // A file that went missing is made again, and only that one.
    rmSync(join(audio, manifest['b|不客气。']));
    const third = fakeAzure();
    await runWith(root, { fetch: third.fetch });
    expect(third.texts()).toEqual(['不客气。']);
  });

  it('waits and retries when Azure answers 429', async () => {
    const { root, audio } = content();
    let throttled = false;
    const azure = fakeAzure(() => {
      if (throttled) return undefined;
      throttled = true;
      return new Response('', { status: 429, headers: { 'retry-after': '2' } });
    });
    const waits: number[] = [];
    const report = await runWith(root, { targets: ['en'], fetch: azure.fetch, sleep: async (ms) => void waits.push(ms) });
    expect(waits[0]).toBe(2000);
    expect(report.failures).toEqual([]);
    expect(report.courses[0].written).toBe(4);
    expect(azure.requests).toHaveLength(5);
    expect(Object.keys(manifestOf(audio, 'en'))).toHaveLength(4);
  });

  it('keeps going when one clip fails and leaves it out of the manifest', async () => {
    const { root, audio } = content();
    const azure = fakeAzure((body) => (body.includes('Nice to meet you.') ? new Response('bad', { status: 400 }) : undefined));
    const report = await runWith(root, { targets: ['en'], fetch: azure.fetch });
    expect(report.failures).toEqual([{ clip: 'en-A1-01 dialogue line 2 "Nice to meet you." (b)', reason: 'Azure answered 400 (bad)' }]);
    expect(report.aborted).toBeUndefined();
    expect(Object.keys(manifestOf(audio, 'en'))).toEqual(["a|Hi, I'm Nam.", 'item|Hello', 'item|rock & roll']);
  });

  it('stops after 10 failed clips, as something is wrong with every request', async () => {
    const { root } = content();
    const azure = fakeAzure(() => new Response('Unsupported voice', { status: 400 }));
    const lines: string[] = [];
    const report = await runWith(root, { fetch: azure.fetch, concurrency: 1, log: (l) => lines.push(l) });
    expect(azure.requests).toHaveLength(10);
    expect(report.aborted).toBe('10 clips failed');
    expect(lines).toContain('Stopped early (10 clips failed). Finished clips are kept; run again to continue.');
  });

  it('stops at once when the key is rejected and writes nothing', async () => {
    const { root, audio } = content();
    const azure = fakeAzure(() => new Response('', { status: 401 }));
    const lines: string[] = [];
    const report = await runWith(root, { fetch: azure.fetch, concurrency: 2, log: (l) => lines.push(l) });
    expect(report.aborted).toMatch(/^Azure answered 401: check AZURE_SPEECH_KEY/);
    expect(azure.requests).toHaveLength(2);
    expect(existsSync(audio)).toBe(false);
    // Both workers failed the same way: the reason is shown once.
    expect(lines.filter((l) => l.includes('failed: Azure answered 401: check AZURE_SPEECH_KEY'))).toHaveLength(1);
  });

  it('dry run: reports what is missing and the estimated cost, writes nothing', async () => {
    const { root, audio } = content();
    const azure = fakeAzure();
    const lines: string[] = [];
    const report = await run({ contentRoot: root, targets: ['zh', 'en'], fetch: azure.fetch, log: (l) => lines.push(l) });
    expect(report.dryRun).toBe(true);
    // zh: 你好 妈 你好！×2 谢谢 谢谢！ 不客气。 — billable counts Han twice plus the <prosody> markup.
    expect(report.courses.map((c) => [c.target, c.missing, c.chars, c.billable])).toEqual([
      ['zh', 7, 18, 241],
      ['en', 4, 45, 165],
    ]);
    expect(azure.requests).toEqual([]);
    expect(existsSync(audio)).toBe(false);
    const out = lines.join('\n');
    expect(out).toContain('Missing: 11 clip(s), 63 characters of text, about 406 billable');
    expect(out).toContain('Estimated cost: < US$0.01 at about US$16 per 1M characters (estimate only');
  });

  it('uses a recorded clip (Item.audio) once its file exists', async () => {
    const { root, audio, write } = content();
    const lesson = clone(FILES['courses/zh/lessons/zh-A1-02.json']) as any;
    lesson.items[1].audio = 'zh/recorded/xie-xie.mp3';
    write('courses/zh/lessons/zh-A1-02.json', lesson);

    // Not recorded yet: generated speech, with a warning.
    const before = await runWith(root, { targets: ['zh'], fetch: fakeAzure().fetch });
    expect(before.warnings).toContain(
      'zh-A1-02 zh.xie-xie: recording zh/recorded/xie-xie.mp3 is not in content/audio yet; using generated speech',
    );
    const generated = manifestOf(audio, 'zh')['item|谢谢'];
    expect(generated).toMatch(/^zh\/[0-9a-f]{16}\.mp3$/);

    // Recorded: the manifest points at the recording, and --prune removes the generated clip.
    write('audio/zh/recorded/xie-xie.mp3', 'voice actor');
    const azure = fakeAzure();
    const after = await runWith(root, { targets: ['zh'], fetch: azure.fetch, prune: true });
    expect(azure.requests).toEqual([]);
    expect(manifestOf(audio, 'zh')['item|谢谢']).toBe('zh/recorded/xie-xie.mp3');
    expect(after.courses[0]).toMatchObject({ clips: 7, recorded: 1, unused: [basename(generated)], pruned: true });
    expect(existsSync(join(audio, generated))).toBe(false);
    expect(readFileSync(join(audio, 'zh/recorded/xie-xie.mp3'), 'utf8')).toBe('voice actor');
  });

  it('--prune deletes generated files nothing uses, and nothing else', async () => {
    const { root, audio, write } = content();
    await runWith(root, { fetch: fakeAzure().fetch });
    const old = manifestOf(audio, 'zh')['b|不客气。'];
    const enFiles = readdirSync(join(audio, 'en')).sort();

    // A writer changes a line, so its old clip is no longer used.
    const lesson = clone(FILES['courses/zh/lessons/zh-A1-02.json']) as any;
    lesson.dialogue[1].text = '不用谢。';
    write('courses/zh/lessons/zh-A1-02.json', lesson);
    write('audio/zh/notes.txt', 'not ours');
    write('audio/zh/0123456789abcdef.mp3.123.tmp', 'half a clip');
    const unused = [basename(old), '0123456789abcdef.mp3.123.tmp'].sort();

    // Dry run: only reported.
    const dry = await run({ contentRoot: root, targets: ['zh'], prune: true, log: quiet });
    expect(dry.courses[0]).toMatchObject({ unused, pruned: true, missing: 1 });
    expect(existsSync(join(audio, old))).toBe(true);

    const azure = fakeAzure();
    const report = await runWith(root, { targets: ['zh'], fetch: azure.fetch, prune: true });
    expect(azure.texts()).toEqual(['不用谢。']);
    expect(report.courses[0].unused).toEqual(unused);
    expect(existsSync(join(audio, old))).toBe(false);
    expect(existsSync(join(audio, 'zh/0123456789abcdef.mp3.123.tmp'))).toBe(false);
    expect(readFileSync(join(audio, 'zh/notes.txt'), 'utf8')).toBe('not ours');
    expect(Object.keys(manifestOf(audio, 'zh'))).toContain('b|不用谢。');
    expect(Object.keys(manifestOf(audio, 'zh'))).not.toContain('b|不客气。');
    expect(readdirSync(join(audio, 'en')).sort()).toEqual(enFiles); // --target zh leaves en alone
  });

  it('never prunes, or shrinks the manifest of, a course whose lessons do not load', async () => {
    const { root, audio, write } = content();
    await runWith(root, { targets: ['zh'], fetch: fakeAzure().fetch });
    const files = readdirSync(join(audio, 'zh')).sort();
    const manifest = manifestOf(audio, 'zh');

    write('courses/zh/lessons/zh-A1-02.json', '{ "id": "zh-A1-02", '); // a writer mid-edit
    const lines: string[] = [];
    const report = await runWith(root, { targets: ['zh'], fetch: fakeAzure().fetch, prune: true, log: (l) => lines.push(l) });
    expect(report.courses[0]).toMatchObject({ pruned: false, problems: 2 });
    expect(report.courses[0].unused.length).toBeGreaterThan(0);
    expect(readdirSync(join(audio, 'zh')).sort()).toEqual(files);
    expect(manifestOf(audio, 'zh')).toEqual(manifest);
    expect(lines.join('\n')).toContain('--prune skipped zh: fix the content problems first');
  });
});

describe('stages', () => {
  it('--stage only synthesizes clips of those stages; the rest stay on device TTS', async () => {
    const { root } = content();
    const none = fakeAzure();
    const b = await runWith(root, { fetch: none.fetch, stages: ['B'] });
    expect(none.requests).toEqual([]);
    expect(b.courses.map((c) => [c.missing, c.manifest])).toEqual([
      [0, 0],
      [0, 0],
    ]);
    const all = fakeAzure();
    await runWith(root, { fetch: all.fetch, stages: ['A'] });
    expect(all.requests).toHaveLength(11);
  });
});

describe('parseArgs', () => {
  it('reads --target, --dry-run and --prune', () => {
    expect(parseArgs([])).toEqual({ dryRun: false, prune: false, help: false });
    expect(parseArgs(['--target', 'zh', '--dry-run', '--prune'])).toEqual({ targets: ['zh'], dryRun: true, prune: true, help: false });
    expect(parseArgs(['--target=ko']).targets).toEqual(['ko']);
    expect(parseArgs(['--stage', 'a', '--stage=B']).stages).toEqual(['A', 'B']);
  });

  it('rejects unknown courses and options', () => {
    expect(() => parseArgs(['--target', 'fr'])).toThrow(UsageError);
    expect(() => parseArgs(['--target'])).toThrow('--target must be one of zh, en, ja, ko');
    expect(() => parseArgs(['--force'])).toThrow('unknown option --force');
  });
});
