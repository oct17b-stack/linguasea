// End-to-end smoke test: the real API server (in-memory store, no Azure/Anthropic keys), the web
// build of the app pointed at it, and headless Chromium driving the main flows a learner goes through.
//
//   npm run content && node tests/e2e/run.mjs
//
// Builds the web app into a temporary folder first (a few minutes). To iterate faster, build once with
// EXPO_PUBLIC_API_URL=http://127.0.0.1:<port> and run with E2E_DIST=<folder> E2E_API_PORT=<port>.
// Screenshots go to E2E_SHOTS when set. Prints PASS/FAIL per check; exits 1 when anything failed.
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AUDIO_PROBE, answer, answerKey, clipPath, footer, play } from './answers.mjs';
import { buildWeb, launch, openPage, root, serveStatic, startApi, t } from './harness.mjs';
import { screens } from './screens.mjs';

// ---------- content, as the app sees it ----------
const generated = join(root, 'app/src/content/generated');
const index = JSON.parse(readFileSync(join(generated, 'index.json'), 'utf8'));
const course = (target) => JSON.parse(readFileSync(join(generated, `th-${target}.json`), 'utf8'));
const lessonsOf = (c, stage) => c.course.stages.find((s) => s.id === stage).units.flatMap((u) => u.lessons);
const unitsOf = (c) => c.course.stages.flatMap((s) => s.units);

// ---------- results ----------
const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra && !ok ? ` — ${extra}` : ''}`);
};
const shots = process.env.E2E_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const shot = (page, name) => (shots ? page.screenshot({ path: join(shots, `${name}.png`) }) : Promise.resolve());

// ---------- servers and browser ----------
const api = await startApi({}, process.env.E2E_API_PORT ? Number(process.env.E2E_API_PORT) : undefined);
let dist = process.env.E2E_DIST;
if (!dist) {
  dist = mkdtempSync(join(tmpdir(), 'linguasea-web-'));
  console.log(`building the web app into ${dist} …`);
  buildWeb(dist, api.url);
}
const web = await serveStatic(dist);
const browser = await launch();

let current; // the page under test, for a screenshot when something throws
async function newPage(seed, options) {
  const session = await openPage(browser, options);
  const { page } = session;
  current = page;
  await page.addInitScript(AUDIO_PROBE);
  if (seed) {
    await page.addInitScript((s) => {
      if (!localStorage.getItem('e2e-seeded')) {
        localStorage.setItem('linguasea/state/v1', s);
        localStorage.setItem('e2e-seeded', '1');
      }
    }, JSON.stringify(seed));
  }
  session.dialogs = [];
  page.on('dialog', async (d) => {
    session.dialogs.push(d.message());
    await d.accept();
  });
  session.api = [];
  page.on('response', (r) => {
    if (r.url().startsWith(api.url)) session.api.push(`${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`);
  });
  return session;
}
// The app saves its state at most once a second.
const state = async (page) => {
  await page.waitForTimeout(1200);
  return JSON.parse((await page.evaluate(() => localStorage.getItem('linguasea/state/v1'))) ?? 'null');
};
const account = async (page) => JSON.parse((await page.evaluate(() => localStorage.getItem('linguasea.account'))) ?? 'null');
async function until(fn, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}
// The tutor answers 503 without an Anthropic key, and the browser logs failed requests.
// A wrong sign-in code is answered with 400 on purpose.
const realErrors = (errors) => errors.filter((e) => !/status of (503|400)/.test(e));

try {
  // ---------- 1. First visit: choose a course, first lesson, sync, tutor, paywall, review ----------
  {
    const ko = course('ko');
    const key = answerKey(ko);
    const { page, errors, dialogs, api: calls, context } = await newPage();
    await page.goto(web.url);
    await page.getByText(t('languages.title')).waitFor();
    const names = Object.values(index.l1s.th.courses).map((c) => c.name);
    check('language screen lists every course', (await Promise.all(names.map((n) => page.getByText(n, { exact: true }).count()))).every((n) => n === 1));
    await shot(page, '01-languages');

    await page.getByText(ko.gloss.name, { exact: true }).click();
    await page.getByText(t('placement.ask', { language: ko.gloss.name })).waitFor();
    await page.getByText(t('placement.new'), { exact: true }).click();
    const first = ko.course.stages[0].units[0].lessons[0];
    const firstTitle = ko.lessons[first].gloss.title;
    const cont = page.getByRole('button', { name: `▶ ${t('home.continue', { title: firstTitle })}` });
    await cont.waitFor();
    check('new learner starts at the first lesson', true);
    await shot(page, '02-home');

    await cont.click();
    await play(page, key, 'right');
    check('first lesson plays to the end', (await page.getByText(`🎉 ${t('done.title')}`).count()) === 1);
    await shot(page, '03-done');
    await footer(page).first().click();
    await page.getByText(t('home.xp', { n: 0 })).waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    const st = await state(page);
    check('finished lesson is saved on the device', first in (st?.progress?.completed ?? {}));
    check('XP goes up', (st?.progress?.xp ?? 0) > 0);

    check('an account is created once there is progress to keep', await until(() => calls.some((c) => c === 'POST /v1/accounts 201')), calls.join(', '));
    check('progress is pushed to the server', await until(() => calls.some((c) => c === 'PUT /v1/progress 200')), calls.join(', '));
    const acc = await account(page);
    const remote = acc ? await fetch(`${api.url}/v1/progress`, { headers: { authorization: `Bearer ${acc.token}` } }).then((r) => r.json()) : null;
    check('the server has the finished lesson', !!remote && first in (remote.completed ?? {}), JSON.stringify(remote)?.slice(0, 200));

    // The AI tutor opens once the unit is started; without an Anthropic key it says it is not available.
    const tutor = page.getByText(t('tutor.entry'), { exact: true });
    check('unit offers the AI tutor after its first lesson', (await tutor.count()) > 0);
    if (await tutor.count()) {
      await tutor.first().click();
      await page.getByText(`🤖 ${t('tutor.consent.title')}`).waitFor();
      await shot(page, '04-tutor-consent');
      await page.getByRole('button', { name: t('tutor.consent.agree') }).click();
      check('tutor without a key says it is unavailable', await until(async () => (await page.getByText(t('tutor.unavailable')).count()) > 0));
      await shot(page, '05-tutor-unavailable');
      await page.goBack();
      await cont.or(page.getByRole('button', { name: new RegExp(`^▶ `) })).first().waitFor();
    }

    // Paywall: the plans and what Premium includes; the web build cannot buy.
    await page.getByRole('button', { name: `👑 ${t('home.premium')}` }).click();
    await page.getByText(`👑 ${t('paywall.title')}`).waitFor();
    const features = ['allLevels', 'readers', 'practice', 'speaking'];
    check('paywall lists what Premium includes', (await Promise.all(features.map((f) => page.getByText(`✓ ${t(`paywall.feature.${f}`)}`).count()))).every((n) => n === 1));
    await shot(page, '06-paywall');
    await page.getByRole('button', { name: t('paywall.subscribe') }).click();
    check('subscribing on the web says purchases are not available here', await until(() => dialogs.includes(t('paywall.notReady'))), dialogs.join(' | '));
    await page.goBack();

    // A Premium lesson opens the paywall. (The map only renders what is near the screen, so the
    // current stage is folded first to bring the next one up.)
    const stageB = ko.course.stages[1];
    await page.getByRole('button', { name: /^A · / }).click();
    await page.getByRole('button', { name: new RegExp(`^${stageB.id} · `) }).click();
    await page.getByText(ko.lessons[stageB.units[0].lessons[0]].gloss.title, { exact: true }).first().click();
    check('a Premium lesson opens the paywall', await until(async () => (await page.getByText(`👑 ${t('paywall.title')}`).count()) > 0));
    await page.goBack();

    // Words come up for review from the next day on, so on day one there is nothing to review.
    const review = page.getByRole('button', { name: t('home.noReview') });
    check('nothing to review on day one (button disabled)', (await review.count()) === 1 && (await review.isDisabled()));

    // Delete my data: removes the server account and starts over on this device.
    await page.getByRole('button', { name: t('settings.title') }).click();
    await page.getByRole('button', { name: t('settings.deleteData') }).click();
    await page.getByText(t('languages.title')).waitFor();
    check('delete my data asks first', dialogs.some((d) => d.startsWith(t('settings.deleteTitle'))));
    const gone = acc ? (await fetch(`${api.url}/v1/progress`, { headers: { authorization: `Bearer ${acc.token}` } })).status : 0;
    check('delete my data removes the server account', gone === 401, String(gone));
    check('no console errors (first visit)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 2. Placement: knows stage A, not stage B ----------
  {
    const zh = course('zh');
    const key = answerKey(zh);
    const { page, errors, context } = await newPage();
    await page.goto(web.url);
    await page.getByText(zh.gloss.name, { exact: true }).click();
    await page.getByText(t('placement.some'), { exact: true }).click();
    async function quiz(stage, mode) {
      const title = page.getByText(new RegExp(`^${t('placement.quizTitle', { stage, n: 1, total: 'X' }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('X', '(\\d+)')}$`));
      await title.waitFor();
      const total = Number((await title.innerText()).match(/(\d+)$/)[1]);
      for (let n = 1; n <= total; n++) {
        await answer(page, key, mode);
        const last = n === total;
        await page.getByRole('button', { name: last ? t('placement.finish') : t('common.next'), exact: true }).click();
      }
      return total;
    }
    const total = await quiz('A', 'right');
    check('placement quiz asks 16 questions', total === 16, String(total));
    await page.getByText(`🎉 ${t('placement.passed', { stage: 'A' })}`).waitFor();
    await shot(page, '07-placement-passed');
    await page.getByRole('button', { name: t('placement.testNext', { stage: 'B' }) }).click();
    await quiz('B', 'wrong');
    await page.getByText(`🌱 ${t('placement.failed', { stage: 'B' })}`).waitFor();
    await page.getByRole('button', { name: t('placement.startAt', { stage: 'B' }) }).click();
    const a = lessonsOf(zh, 'A');
    await page.getByText(t('stage.progress', { done: a.length, total: a.length })).first().waitFor();
    const st = await state(page);
    check('passing A marks all of stage A done, and nothing else', a.every((id) => id in st.progress.completed) && Object.keys(st.progress.completed).length === a.length);
    check('placement is remembered for the course', st.placed?.zh === true);
    check('no console errors (placement)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 3. Premium learner: practice, unit test (fail, retry, pass) and a reader ----------
  {
    const en = course('en');
    const key = answerKey(en);
    const unit = unitsOf(en)[0];
    const stageB = en.course.stages[1];
    // Unit A1 done, and in unit B1 every lesson before its reader (readers come after the lessons).
    const reader = stageB.units[0].lessons.find((id) => en.lessons[id].lesson.kind === 'reader');
    const beforeReader = stageB.units[0].lessons.slice(0, stageB.units[0].lessons.indexOf(reader));
    const done = Object.fromEntries([...unit.lessons, ...beforeReader].map((id) => [id, '2026-10-20T10:00:00.000Z']));
    // Five words of the unit, due for review since a while.
    const dueWords = unit.lessons
      .flatMap((id) => en.lessons[id].lesson.items)
      .filter((i) => !i.kind || i.kind === 'word' || i.kind === 'phrase')
      .slice(0, 5)
      .map((i) => i.id);
    const card = { due: '2026-10-01T00:00:00.000Z', stability: 3, difficulty: 5, elapsed_days: 3, scheduled_days: 3, learning_steps: 0, reps: 1, lapses: 0, state: 2, last_review: '2026-09-28T00:00:00.000Z' };
    const cards = Object.fromEntries(dueWords.map((id) => [id, card]));
    const { page, errors, context } = await newPage({
      l1: 'th',
      target: 'en',
      progress: { version: 1, completed: done, cards, xp: 100, streak: { count: 1, lastDay: '2026-10-21' } },
      reminder: { on: false, hour: 20, minute: 0 },
      entitlements: { store: false, server: false, serverUntil: null, dev: true },
      placed: { en: true },
    });
    await page.goto(web.url);
    await page.getByText(t('path.practice', { n: 1 })).first().waitFor();
    await shot(page, '08-map-premium');

    // Review the due words first (practice and tests grade the same words).
    await page.getByRole('button', { name: t('home.review', { n: dueWords.length }) }).click();
    await play(page, key, 'right');
    check('review asks every due word and then says it is done', (await page.getByText(t('review.empty')).count()) === 1);
    const after = (await state(page)).progress.cards;
    check('reviewed words are scheduled for later', dueWords.every((id) => new Date(after[id]?.due) > new Date()));
    await footer(page).first().click();
    await page.getByRole('button', { name: t('home.noReview') }).waitFor();

    await page.getByText(t('path.practice', { n: 1 })).first().click();
    await page.getByText(t('practice.intro')).waitFor();
    await play(page, key, 'right');
    check('practice plays to the end', (await page.getByText(`💪 ${t('done.practiceTitle')}`).count()) === 1);
    await footer(page).first().click();
    await page.waitForTimeout(300);
    check('finished practice is recorded', `${unit.id}-p1` in (await state(page)).progress.completed);

    await page.getByText(t('path.test')).first().click();
    await play(page, key, 'wrong');
    check('a failed unit test says so', (await page.getByText(`🌱 ${t('done.testFailed')}`).count()) === 1);
    await page.getByRole('button', { name: t('done.retry') }).click();
    await play(page, key, 'right');
    check('a passed unit test says so', (await page.getByText(`🏅 ${t('done.testPassed')}`).count()) === 1);
    await footer(page).first().click();
    await page.getByText(`🏅 ${t('unit.passed')}`, { exact: true }).waitFor();
    check('passed unit shows its badge', true);

    await page.getByRole('button', { name: /^A · / }).click();
    await page.getByRole('button', { name: new RegExp(`^${stageB.id} · `) }).click();
    await page.getByText(en.lessons[reader].gloss.title).first().click();
    await footer(page).first().click();
    await page.getByText(`📖 ${t('step.read')}`).waitFor();
    const sentence = en.lessons[reader].lesson.passage[0][0];
    check('reader shows the reading under each sentence', (await page.getByText(sentence.reading, { exact: true }).count()) === 1);
    await page.getByRole('button', { name: sentence.text }).click();
    const heard = async () => (await page.evaluate(() => window.__audio ?? [])).some((a) => (a.kind === 'clip' ? key.clipText.get(clipPath(a.src)) : a.text) === sentence.text);
    check('tapping a sentence reads it aloud', await until(heard));
    await shot(page, '09-reader');
    let asked = false;
    await play(page, key, 'right', {
      onStep: async () => {
        asked ||= (await page.getByText(`❓ ${t('step.question')}`).count()) > 0;
      },
    });
    check('reader asks comprehension questions', asked);
    await footer(page).first().click();
    await page.waitForTimeout(300);
    check('finished reader is recorded', reader in (await state(page)).progress.completed);
    check('no console errors (premium)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 4. Email sign-in: same progress on a second device, sign-out ----------
  {
    const ko = course('ko');
    const key = answerKey(ko);
    const email = `learner-${Date.now()}@example.com`;
    const me = (token) => fetch(`${api.url}/v1/accounts/me`, { headers: { authorization: `Bearer ${token}` } });
    /** Settings → account: email → code (read from the server's output) → verify. */
    async function signIn(page, { wrongFirst = false } = {}) {
      await page.getByLabel(t('account.email')).fill(email);
      const from = api.mark();
      await page.getByRole('button', { name: t('account.sendCode') }).click();
      const code = await api.loginCode(email, from);
      if (!code) return { code };
      await page.getByText(t('account.codeSent', { email })).waitFor();
      let wrongShown;
      if (wrongFirst) {
        await page.getByLabel(t('account.code')).fill(code === '000000' ? '111111' : '000000');
        await page.getByRole('button', { name: t('account.verify') }).click();
        wrongShown = await until(async () => (await page.getByText(t('account.error.invalidCode')).count()) > 0);
      }
      await page.getByLabel(t('account.code')).fill(code);
      await page.getByRole('button', { name: t('account.verify') }).click();
      const shown = await until(async () => (await page.getByText(t('account.signedInAs', { email })).count()) > 0);
      return { code, shown, wrongShown };
    }

    // Device 1: a lesson as an anonymous learner, then sign in from settings.
    const one = await newPage();
    await one.page.goto(web.url);
    check('the web app has a page title', /LinguaSEA/.test(await one.page.title()), await one.page.title());
    await one.page.getByText(ko.gloss.name, { exact: true }).click();
    await one.page.getByText(t('placement.new'), { exact: true }).click();
    const first = ko.course.stages[0].units[0].lessons[0];
    await one.page.getByRole('button', { name: `▶ ${t('home.continue', { title: ko.lessons[first].gloss.title })}` }).click();
    await play(one.page, key, 'right');
    await footer(one.page).first().click();
    await until(() => one.api.some((c) => c === 'PUT /v1/progress 200'));
    const anonymous = await account(one.page);
    await one.page.getByRole('button', { name: t('settings.title') }).click();
    check('settings explain why to sign in', await until(async () => (await one.page.getByText(t('account.why')).count()) === 1));
    const first1 = await signIn(one.page);
    check('email sign-in sends a 6-digit code', !!first1.code);
    check('after the code, settings show the signed-in email', !!first1.shown);
    const acc1 = await account(one.page);
    check('the device keeps the new token and the email', !!acc1 && acc1.email === email && acc1.token !== anonymous?.token, JSON.stringify(acc1));
    const me1 = acc1 ? await me(acc1.token).then((r) => (r.ok ? r.json() : null)) : null;
    check('the server knows the account by its email', me1?.email === email, JSON.stringify(me1));
    const remote = acc1 ? await fetch(`${api.url}/v1/progress`, { headers: { authorization: `Bearer ${acc1.token}` } }).then((r) => (r.ok ? r.json() : null)) : null;
    check('the progress made before signing in is kept in the account', !!remote && first in (remote.completed ?? {}), JSON.stringify(remote)?.slice(0, 200));
    await one.page.reload();
    check('a reload on a deep link (/app/settings) stays signed in', await until(async () => (await one.page.getByText(t('account.signedInAs', { email })).count()) > 0), one.page.url());
    await shot(one.page, '10-signed-in');

    // Device 2: a new browser opens settings directly and signs in to the same email.
    const two = await newPage();
    await two.page.goto(`${web.url}settings`);
    const second = await signIn(two.page, { wrongFirst: true });
    check('a wrong code is refused with a message', !!second.wrongShown);
    check('a second device signs in to the same email', !!second.shown);
    const acc2 = await account(two.page);
    check('both devices share one account, each with its own token', !!acc2 && acc2.id === acc1?.id && acc2.token !== acc1?.token);
    check('the second device gets the same progress', await until(async () => first in ((await state(two.page))?.progress?.completed ?? {})));
    {
      // XP is counted per install (Progress.xpBy) so offline XP on two devices adds up; syncing must not double it.
      const [s1, s2] = [await state(one.page), await state(two.page)];
      check('each install has its own device id', !!s1?.device && !!s2?.device && s1.device !== s2.device, `${s1?.device} ${s2?.device}`);
      check('the second device shows the same XP, not doubled', s1?.progress?.xp > 0 && s2?.progress?.xp === s1?.progress?.xp, `${s1?.progress?.xp} ${s2?.progress?.xp}`);
    }

    // Sign-out on device 2: back to anonymous, local progress stays, device 1 stays signed in.
    await two.page.getByRole('button', { name: t('account.signOut') }).click();
    check('sign-out asks first', await until(() => two.dialogs.some((d) => d.startsWith(t('account.signOutTitle')))));
    check('after sign-out the sign-in form is back', await until(async () => (await two.page.getByLabel(t('account.email')).count()) === 1));
    check('sign-out tells the server', await until(() => two.api.some((c) => c === 'POST /v1/auth/logout 204')), two.api.join(', '));
    const after = await account(two.page);
    check('sign-out forgets the account on the device', !after?.email, JSON.stringify(after));
    check('the signed-out token no longer works', acc2 ? (await me(acc2.token)).status === 401 : false);
    check('the progress stays on the device after sign-out', first in ((await state(two.page))?.progress?.completed ?? {}));
    check('the other device is still signed in', acc1 ? (await me(acc1.token)).status === 200 : false);
    // Opened straight on /app/settings, the screen still goes back (to home, which asks for a course here).
    await two.page.getByRole('link', { name: 'Go back' }).click();
    check('a deep-linked screen goes back to home', await until(async () => (await two.page.getByText(t('languages.title')).count()) > 0));
    check('no console errors (sign-in)', realErrors([...one.errors, ...two.errors]).length === 0, realErrors([...one.errors, ...two.errors]).join(' | '));
    await one.context.close();
    await two.context.close();
  }

  // ---------- 5–12. Every course, audio, progress bars, deep links, layout, settings, tutor (screens.mjs) ----------
  await screens({ web, api, newPage, check, shot, state, until, realErrors, course, unitsOf });
} catch (e) {
  check(`unexpected error: ${e.message.split('\n')[0]}`, false);
  console.error(e);
  if (current) {
    await shot(current, 'error').catch(() => {});
    const text = await current.evaluate(() => document.body.innerText).catch(() => '');
    console.error(`page ${current.url()} shows:\n${text.slice(0, 600)}`);
  }
} finally {
  await browser.close();
  web.stop();
  api.stop();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
