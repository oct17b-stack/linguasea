import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildServer } from './app';
import { buildScenario } from './scenarios';
import { MemoryStore } from './store';
import { fixtureBundle } from './test-fixtures';
import { ClaudeTutor, redactPersonalInfo, type Tutor, type TutorLine, type TutorTurn } from './tutor';

const TURN: TutorTurn = {
  reply: 'なにを のみますか。',
  reading: 'nani o nomimasu ka.',
  translation: 'จะดื่มอะไรคะ',
  feedback: '',
  correction: '',
  hint: 'ลองตอบว่า みずを ください。',
  done: false,
};

test('a scenario holds what the learner has met so far, without sound drills', () => {
  const s = buildScenario(fixtureBundle(), 'th', 'ja', 'ja-A2')!;
  assert.equal(s.goal, 'สั่งน้ำและชาได้');
  assert.equal(s.cefr, 'pre-A1');
  assert.deepEqual(
    s.vocabulary.map((v) => v.text),
    ['こんにちは', 'みず', 'ください'],
  );
  assert.deepEqual(
    s.examples.map((e) => e.text),
    ['みずを ください。', 'はい、どうぞ。'],
  );
  assert.equal(buildScenario(fixtureBundle(), 'th', 'ja', 'ja-Z9'), undefined);
  assert.equal(buildScenario(fixtureBundle(), 'th', 'zh', 'zh-A1'), undefined);
});

/** A stand-in for the Anthropic client that records the request and returns a canned response. */
function fakeClient(response: object) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    beta: {
      messages: {
        parse: async (params: Record<string, unknown>) => {
          calls.push(params);
          return response;
        },
      },
    },
  };
  return { client: client as never, calls };
}

test('asks Claude for a structured turn with the scenario cached and fallbacks on', async () => {
  const { client, calls } = fakeClient({ stop_reason: 'end_turn', parsed_output: TURN });
  const tutor = new ClaudeTutor(client);
  const scenario = buildScenario(fixtureBundle(), 'th', 'ja', 'ja-A2')!;
  const history: TutorLine[] = [
    { role: 'tutor', text: 'いらっしゃいませ。' },
    { role: 'learner', text: 'みず ください' },
  ];
  assert.deepEqual(await tutor.turn(scenario, history), TURN);

  const req = calls[0] as {
    model: string;
    fallbacks: string;
    betas: string[];
    output_config: { effort: string; format: unknown };
    system: { text: string; cache_control?: unknown }[];
    messages: { role: string; content: string }[];
  };
  assert.equal(req.model, 'claude-opus-5-5');
  assert.equal(req.fallbacks, 'default');
  assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(req.output_config.effort, 'low');
  assert.ok(req.output_config.format);
  // Frozen rules first, then the scenario with the cache breakpoint.
  assert.equal(req.system.length, 2);
  assert.equal(req.system[0].cache_control, undefined);
  assert.deepEqual(req.system[1].cache_control, { type: 'ephemeral' });
  assert.match(req.system[1].text, /สั่งน้ำและชาได้/);
  assert.match(req.system[1].text, /みず \(mizu\): น้ำ/);
  assert.match(req.messages[0].content, /B: いらっしゃいませ。\nA: みず ください/);
});

test('opens the conversation when there is no history', async () => {
  const { client, calls } = fakeClient({ stop_reason: 'end_turn', parsed_output: TURN });
  await new ClaudeTutor(client).turn(buildScenario(fixtureBundle(), 'th', 'ja', 'ja-A2')!, []);
  assert.match((calls[0] as { messages: { content: string }[] }).messages[0].content, /opening line/);
});

test('ends quietly on a refusal and fails loudly on unparseable output', async () => {
  const scenario = buildScenario(fixtureBundle(), 'th', 'ja', 'ja-A2')!;
  const refused = await new ClaudeTutor(fakeClient({ stop_reason: 'refusal', parsed_output: null }).client).turn(scenario, []);
  assert.equal(refused.done, true);
  assert.equal(refused.reply, '');
  await assert.rejects(new ClaudeTutor(fakeClient({ stop_reason: 'max_tokens', parsed_output: null }).client).turn(scenario, []));
});

test('masks phone numbers and e-mail addresses', () => {
  assert.equal(redactPersonalInfo('my number is 081-234-5678 ok'), 'my number is […] ok');
  assert.equal(redactPersonalInfo('mail nam.k@example.co.th'), 'mail […]');
  assert.equal(redactPersonalInfo('I am 20 years old'), 'I am 20 years old');
});

test('tutor route: needs setup, validates the unit, redacts, and limits free turns', async () => {
  const seen: TutorLine[][] = [];
  const tutor: Tutor = { turn: async (_s, history) => (seen.push(history), TURN) };
  const app = buildServer({
    store: new MemoryStore(),
    tutor,
    bundle: fixtureBundle(),
    quotas: { pronunciationFree: 1, pronunciationPremium: 1, tutorFree: 2, tutorPremium: 10 },
  });
  const { token } = (await app.inject({ method: 'POST', url: '/v1/accounts' })).json();
  const auth = { authorization: `Bearer ${token}` };
  const ask = (payload: object) => app.inject({ method: 'POST', url: '/v1/tutor/turn', headers: auth, payload });

  assert.equal((await ask({ target: 'ja', unitId: 'ja-Z9', history: [] })).statusCode, 404);
  assert.equal((await ask({ target: 'xx', unitId: 'ja-A2', history: [] })).statusCode, 400);
  const ok = await ask({ target: 'ja', unitId: 'ja-A2', history: [{ role: 'learner', text: 'call me 0812345678' }] });
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.json(), TURN);
  assert.equal(seen[0][0].text, 'call me […]');
  assert.equal((await ask({ target: 'ja', unitId: 'ja-A2', history: [] })).statusCode, 200);
  assert.equal((await ask({ target: 'ja', unitId: 'ja-A2', history: [] })).statusCode, 429);

  const off = buildServer({ store: new MemoryStore() });
  const t2 = (await off.inject({ method: 'POST', url: '/v1/accounts' })).json().token;
  const res = await off.inject({
    method: 'POST',
    url: '/v1/tutor/turn',
    headers: { authorization: `Bearer ${t2}` },
    payload: { target: 'ja', unitId: 'ja-A2', history: [] },
  });
  assert.equal(res.statusCode, 503);
});
