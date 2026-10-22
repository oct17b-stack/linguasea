import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { AssessError, AzureAssessor, parseAzureResult } from './pronunciation';
import { toWav16k } from './transcode';

test('reads scores from both Azure response shapes', () => {
  const flat = parseAzureResult({
    RecognitionStatus: 'Success',
    NBest: [
      {
        Display: 'Hello.',
        AccuracyScore: 91.4,
        FluencyScore: 80,
        CompletenessScore: 100,
        PronScore: 88.6,
        Words: [{ Word: 'hello', AccuracyScore: 91, ErrorType: 'None' }],
      },
    ],
  });
  assert.equal(flat.overall, 89);
  assert.deepEqual(flat.words, [{ word: 'hello', accuracy: 91 }]);

  const nested = parseAzureResult({
    RecognitionStatus: 'Success',
    NBest: [
      {
        Lexical: 'ni hao',
        PronunciationAssessment: { AccuracyScore: 70, FluencyScore: 60, CompletenessScore: 50, PronScore: 62 },
        Words: [{ Word: '你', PronunciationAssessment: { AccuracyScore: 40, ErrorType: 'Mispronunciation' } }],
      },
    ],
  });
  assert.equal(nested.overall, 62);
  assert.equal(nested.recognized, 'ni hao');
  assert.deepEqual(nested.words, [{ word: '你', accuracy: 40, error: 'Mispronunciation' }]);

  assert.equal(parseAzureResult({ RecognitionStatus: 'InitialSilenceTimeout' }).status, 'no-speech');
});

test('sends the reference text, language and key to Azure', async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ RecognitionStatus: 'Success', NBest: [{ PronScore: 75, Words: [] }] }), { status: 200 });
  }) as typeof fetch;
  const assessor = new AzureAssessor({ key: 'k', region: 'southeastasia', fetch: fakeFetch, transcode: async (a) => a });
  const score = await assessor.assess({ audio: Buffer.from('wav'), text: 'こんにちは', target: 'ja' });
  assert.equal(score.overall, 75);
  assert.match(seen!.url, /^https:\/\/southeastasia\.stt\.speech\.microsoft\.com\/.*language=ja-JP/);
  const headers = seen!.init.headers as Record<string, string>;
  assert.equal(headers['Ocp-Apim-Subscription-Key'], 'k');
  const config = JSON.parse(Buffer.from(headers['Pronunciation-Assessment'], 'base64').toString());
  assert.equal(config.ReferenceText, 'こんにちは');

  const failing = new AzureAssessor({
    key: 'k',
    region: 'r',
    fetch: (async () => new Response('', { status: 401 })) as unknown as typeof fetch,
    transcode: async (a) => a,
  });
  await assert.rejects(failing.assess({ audio: Buffer.from('x'), text: 'hi', target: 'en' }), AssessError);
});

let hasFfmpeg = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  hasFfmpeg = false;
}

test('converts an m4a recording to 16 kHz mono WAV', { skip: !hasFfmpeg && 'ffmpeg not installed' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tone-'));
  const m4a = join(dir, 'tone.m4a');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-ac', '2', '-ar', '44100', '-c:a', 'aac', m4a]);
  const wav = await toWav16k(readFileSync(m4a));
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.readUInt16LE(22), 1, 'mono');
  assert.equal(wav.readUInt32LE(24), 16000, 'sample rate');
  assert.equal(wav.readUInt16LE(34), 16, 'bits per sample');
});

test('transcribes speech for tutor answers', async () => {
  let url = '';
  const fakeFetch = (async (u: string) => {
    url = u;
    return new Response(JSON.stringify({ RecognitionStatus: 'Success', DisplayText: '水をください。' }), { status: 200 });
  }) as typeof fetch;
  const speech = new AzureAssessor({ key: 'k', region: 'r', fetch: fakeFetch, transcode: async (a) => a });
  assert.equal(await speech.transcribe({ audio: Buffer.from('wav'), target: 'ja' }), '水をください。');
  assert.match(url, /language=ja-JP&format=simple/);

  const silent = new AzureAssessor({
    key: 'k',
    region: 'r',
    fetch: (async () => new Response(JSON.stringify({ RecognitionStatus: 'NoMatch' }))) as unknown as typeof fetch,
    transcode: async (a) => a,
  });
  assert.equal(await silent.transcribe({ audio: Buffer.from('wav'), target: 'ja' }), '');
});
