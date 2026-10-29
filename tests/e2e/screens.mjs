// More end-to-end checks, run by run.mjs after the main flows: every course's first lesson, generated
// audio vs device TTS, progress bars, deep links and browser navigation, layout on a phone / desktop /
// in dark mode, the AI tutor's chat (with mocked turns), and the remaining buttons of settings and paywall.
import { answer, answerKey, clipPath, footer, play } from './answers.mjs';
import { t } from './harness.mjs';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
const SMALL = { width: 320, height: 568 };
const DAY = '2026-10-20T10:00:00.000Z';

/** Saved app state for a learner of `target` who finished `done` (lesson ids). */
function seedFor(target, done = [], { premium = false, xp = 0, cards = {}, tutorConsent } = {}) {
  return {
    l1: 'th',
    target,
    progress: { version: 1, completed: Object.fromEntries(done.map((id) => [id, DAY])), cards, xp, streak: { count: 0 } },
    reminder: { on: false, hour: 20, minute: 0 },
    entitlements: { store: false, server: false, serverUntil: null, dev: premium },
    placed: { [target]: true },
    ...(tutorConsent ? { tutorConsent } : {}),
  };
}

/** Filled share (0–1) of every visible progress bar, top to bottom. */
const bars = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('div')]
      .filter((d) => d.children.length === 1 && getComputedStyle(d).height === '8px' && getComputedStyle(d).overflow === 'hidden')
      .map((d) => ({ r: d.getBoundingClientRect(), fill: d.firstElementChild.getBoundingClientRect().width }))
      .filter(({ r }) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight)
      .sort((a, b) => a.r.top - b.r.top)
      .map(({ r, fill }) => fill / r.width),
  );

/** Horizontal overflow: the page scrolls sideways, or a button / text sticks out of the window. */
const overflow = (page) =>
  page.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page is ${document.documentElement.scrollWidth}px wide`);
    for (const el of document.querySelectorAll('[role="button"], [role="link"], [role="radio"], div[dir="auto"]')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > window.innerWidth + 1 || r.left < -1)) out.push(`"${el.innerText.slice(0, 30)}" sticks out`);
    }
    return [...new Set(out)];
  });

/** The page's own background is dark (dark mode) / light. */
const darkBackground = (page) =>
  page.evaluate(() => {
    // Near the left edge: the screen's own padding, not a card or button on it.
    let el = document.elementFromPoint(4, window.innerHeight / 2);
    for (; el; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > 0)) return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 < 0.2;
    }
    return false;
  });

const heard = (page) => page.evaluate(() => window.__audio ?? []);

export async function screens({ web, api, newPage, check, shot, state, until, realErrors, course, unitsOf }) {
  const firstLesson = (c) => c.course.stages[0].units[0].lessons[0];
  const lessonOrder = (c) => c.course.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
  const title = (c, id) => c.lessons[id].gloss.title;
  const continueButton = (page, c, id) => page.getByRole('button', { name: `▶ ${t('home.continue', { title: title(c, id) })}` });
  const audioCalls = (session) => session.api.filter((c) => c.startsWith('GET /audio/'));

  // ---------- 5. Every course: choose it, first lesson to the end, map and audio ----------
  for (const target of ['zh', 'en', 'ja', 'ko']) {
    const c = course(target);
    const key = answerKey(c);
    const session = await newPage();
    const { page, errors, context } = session;
    await page.goto(web.url);
    await page.getByText(c.gloss.name, { exact: true }).click();
    await page.getByText(t('placement.new'), { exact: true }).click();
    const first = firstLesson(c);
    await continueButton(page, c, first).click();
    // Lesson progress: starts empty, never goes back, full on the "done" screen.
    const seen = [];
    await play(page, key, 'right', {
      onStep: async () => {
        seen.push((await bars(page))[0]);
        // Dialogue lines play when tapped.
        if (await page.getByText(t('step.dialogue'), { exact: true }).count()) {
          const lines = page.getByRole('button').filter({ hasText: /^🔊 / });
          for (let i = 0; i < (await lines.count()); i++) await lines.nth(i).click();
        }
      },
    });
    seen.push((await bars(page))[0]);
    const grows = seen.every((v, i) => i === 0 || v >= seen[i - 1]);
    check(`${target}: lesson progress bar runs from 0 to full`, seen[0] === 0 && grows && Math.abs(seen.at(-1) - 1) < 0.01, seen.map((v) => v?.toFixed(2)).join(','));
    const xpShown = Number((await page.getByText(/^\+\d+ XP$/).innerText()).match(/\d+/)[0]);
    // Stage A items and dialogue lines have generated clips: they play from the server, not device TTS.
    const audio = await heard(page);
    const clips = audio.filter((a) => a.kind === 'clip');
    check(`${target}: stage A lesson plays generated clips, not device TTS`, clips.length > 0 && !audio.some((a) => a.kind === 'tts'), JSON.stringify(audio.slice(0, 3)));
    check(`${target}: clips come from the server's /audio/ and load`, clips.every((a) => clipPath(a.src)?.startsWith(`${target}/`)) && audioCalls(session).length > 0 && audioCalls(session).every((a) => / 20[06]$/.test(a)), audioCalls(session).join(', '));
    const lines = c.lessons[first].lesson.dialogue;
    check(`${target}: dialogue lines play in their speaker's voice`, lines.length === 0 || clips.some((a) => lines.some((l) => c.audio?.[`${l.speaker}|${l.text}`] === clipPath(a.src))));
    await footer(page).first().click();
    // Map: the unit's bar and counts, the stage's count, XP as on the done screen, a one-day streak.
    const unit = c.course.stages[0].units[0];
    await page.getByText(t('unit.progress', { done: 1, total: unit.lessons.length })).waitFor();
    const unitBar = (await bars(page))[0];
    check(`${target}: unit progress bar shows 1 of ${unit.lessons.length} lessons`, Math.abs(unitBar - 1 / unit.lessons.length) < 0.02, String(unitBar));
    const stageTotal = c.course.stages[0].units.flatMap((u) => u.lessons).length;
    check(`${target}: stage shows 1 lesson done`, (await page.getByText(t('stage.progress', { done: 1, total: stageTotal })).count()) === 1);
    check(`${target}: XP on the map is what the lesson gave`, (await page.getByText(`⭐ ${t('home.xp', { n: xpShown })}`).count()) === 1, String(xpShown));
    check(`${target}: streak is one day after the first lesson`, (await page.getByText(`🔥 ${t('home.streak', { n: 1 })}`).count()) === 1);
    check(`${target}: continue moves on to the second lesson`, (await continueButton(page, c, unit.lessons[1]).count()) === 1);
    check(`${target}: the first lesson is ticked on the map`, (await page.getByRole('button', { name: new RegExp(`${title(c, first)}.*${t('lesson.done')}`) }).count()) === 1);
    await shot(page, `20-${target}-map`);
    check(`no console errors (${target} first lesson)`, realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 6. Wrong answers, listen buttons, refresh and back/forward mid-lesson ----------
  {
    const ja = course('ja');
    const key = answerKey(ja);
    const first = firstLesson(ja);
    const { page, errors, context } = await newPage(seedFor('ja'));
    await page.goto(web.url);
    await continueButton(page, ja, first).click();
    // Listen / listen slowly on a new word play its clip again.
    await footer(page).first().click();
    const before = (await heard(page)).length;
    await page.getByRole('button', { name: `🔊 ${t('common.listen')}` }).click();
    await page.getByRole('button', { name: `🐢 ${t('common.listenSlow')}` }).click();
    check('listen and listen slowly play the word again', await until(async () => (await heard(page)).length >= before + 2));
    // A reload starts the lesson over; nothing is marked done.
    await footer(page).first().click();
    await page.reload();
    await footer(page).first().waitFor();
    check('a reload mid-lesson starts the lesson over at its intro', (await footer(page).first().innerText()).trim() === t('step.start') && (await bars(page))[0] === 0);
    // Browser back goes to the map with the lesson not done; forward opens it again.
    await page.goBack();
    await continueButton(page, ja, first).waitFor();
    check('browser back from a lesson shows the map, lesson not done', !(first in ((await state(page))?.progress?.completed ?? {})));
    await page.goForward();
    check('browser forward opens the lesson again', await until(async () => (await footer(page).first().innerText().catch(() => '')).trim() === t('step.start')));
    // Every answer wrong: the right one is shown, the lesson still counts, XP only for finishing.
    const rightAnswer = t('step.wrong', { answer: '' }).trim();
    let shown = 0;
    await play(page, key, 'wrong', {
      onStep: async () => {
        if (await page.getByText(rightAnswer, { exact: false }).count()) shown++;
      },
    });
    const scoreLine = new RegExp(`^${t('done.score', { correct: 0, total: '§' }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('§', '(\\d+)')}$`);
    const questions = Number((await page.getByText(scoreLine).innerText()).match(scoreLine)[1]);
    check('every wrong answer is followed by the right one', questions > 0 && shown === questions, `${shown}/${questions}`);
    check('the done screen counts no right answers', (await page.getByText(t('done.score', { correct: 0, total: questions })).count()) === 1);
    const xp = Number((await page.getByText(/^\+\d+ XP$/).innerText()).match(/\d+/)[0]);
    await shot(page, '21-all-wrong-done');
    await footer(page).first().click();
    const st = await state(page);
    check('a lesson with every answer wrong still counts, with XP for finishing only', first in st.progress.completed && st.progress.xp === xp && xp > 0, `${st.progress.xp} vs ${xp}`);
    check('no console errors (wrong answers)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 7. Deep links: Premium, locked, unknown ----------
  {
    const zh = course('zh');
    const order = lessonOrder(zh);
    const session = await newPage(seedFor('zh', [order[0]]));
    const { page, errors, context } = session;
    const visit = async (path) => {
      await page.goto(`${web.url}${path}`);
      await page.waitForTimeout(800);
    };
    const stageB = zh.course.stages[1].units[0].lessons[0];
    await visit(`lesson/${stageB}`);
    check('a Premium lesson by URL opens the paywall for a free learner', await until(async () => (await page.getByText(`👑 ${t('paywall.title')}`).count()) > 0), await page.url());
    check('…and does not start the lesson', (await page.getByRole('button', { name: t('step.start') }).count()) === 0);
    await visit(`lesson/${order[2]}`);
    check('a locked lesson by URL goes to the map', await until(async () => (await continueButton(page, zh, order[1]).count()) > 0), page.url());
    await visit(`lesson/${zh.course.stages[0].units[0].id}-test`);
    check('a locked unit test by URL goes to the map', await until(async () => (await continueButton(page, zh, order[1]).count()) > 0), page.url());
    await visit(`lesson/${order[1]}`);
    check('the next open lesson by URL opens', (await page.getByRole('button', { name: t('step.start') }).count()) === 1);
    await visit('lesson/zh-Z9-99');
    check('an unknown lesson by URL goes to the map', await until(async () => (await continueButton(page, zh, order[1]).count()) > 0), page.url());
    await visit('tutor/zh-Z9');
    check('an unknown tutor unit by URL goes to the map', await until(async () => (await continueButton(page, zh, order[1]).count()) > 0), page.url());
    await visit('no/such/page');
    check('an unknown address goes to the map (no English error page)', await until(async () => (await continueButton(page, zh, order[1]).count()) > 0) && (await page.getByText('Unmatched Route').count()) === 0, page.url());
    await shot(page, '22-after-unknown-url');
    check('no console errors (deep links)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 8. Audio past stage B: generated clips (A–F all have audio since 2026-10-29) ----------
  {
    const zh = course('zh');
    const key = answerKey(zh);
    const order = lessonOrder(zh);
    const stageC = zh.course.stages.find((s) => s.id === 'C').units[0].lessons[0];
    const session = await newPage(seedFor('zh', order.slice(0, order.indexOf(stageC)), { premium: true }));
    const { page, errors, context } = session;
    await page.goto(web.url);
    await continueButton(page, zh, stageC).click();
    await play(page, key, 'right');
    const audio = await heard(page);
    check('a stage C lesson plays generated clips, not device TTS', audio.some((a) => a.kind === 'clip') && !audio.some((a) => a.kind === 'tts'), JSON.stringify(audio.slice(0, 2)));
    check('…and the server has every clip it asks for', audioCalls(session).length > 0 && audioCalls(session).every((c) => / 20[06]$/.test(c)), audioCalls(session).join(', '));
    check('no console errors (stage C audio)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 9. Layout: phone, small phone, desktop, dark mode ----------
  {
    const ko = course('ko');
    const key = answerKey(ko);
    for (const [name, viewport, colorScheme] of [
      ['phone', PHONE, 'light'],
      ['small phone', SMALL, 'light'],
      ['desktop', DESKTOP, 'light'],
      ['dark phone', PHONE, 'dark'],
    ]) {
      const { page, errors, context } = await newPage(seedFor('ko', [firstLesson(ko)], { xp: 14 }), { viewport, colorScheme });
      const problems = [];
      const look = async (screen) => {
        await page.waitForTimeout(300);
        for (const p of await overflow(page)) problems.push(`${screen}: ${p}`);
        if ((await darkBackground(page)) !== (colorScheme === 'dark')) problems.push(`${screen}: background is not ${colorScheme}`);
      };
      await page.goto(web.url);
      await page.getByText(`⭐ ${t('home.xp', { n: 14 })}`).waitFor();
      await look('map');
      await shot(page, `23-${name.replace(' ', '-')}-map`);
      await page.getByRole('button', { name: /^▶ / }).click();
      for (let i = 0; i < 8; i++) {
        await look(`lesson step ${i}`);
        const next = footer(page).first();
        if (await next.isDisabled()) await answer(page, key, 'wrong');
        await look(`lesson step ${i} answered`);
        await next.click();
      }
      await shot(page, `24-${name.replace(' ', '-')}-lesson`);
      await page.goto(`${web.url}settings`);
      await page.getByText(t('settings.learning')).waitFor();
      await look('settings');
      await page.goto(`${web.url}paywall`);
      await page.getByText(`👑 ${t('paywall.title')}`).waitFor();
      await look('paywall');
      await shot(page, `25-${name.replace(' ', '-')}-paywall`);
      check(`${name}: nothing overflows sideways and the background suits the color scheme`, problems.length === 0, problems.slice(0, 5).join(' | '));
      check(`no console errors (${name})`, realErrors(errors).length === 0, realErrors(errors).join(' | '));
      await context.close();
    }
  }

  // ---------- 10. Course map controls, settings and paywall buttons ----------
  {
    const zh = course('zh');
    const ko = course('ko');
    const session = await newPage(seedFor('zh', [firstLesson(zh)], { tutorConsent: 'agreed' }));
    const { page, errors, dialogs, context } = session;
    await page.goto(web.url);
    // Every stage folds and unfolds, and says so to screen readers.
    const stageA = page.getByRole('button', { name: /^A · / });
    await stageA.waitFor();
    const toggles = [];
    // (The map only renders what is near the screen, so each stage is folded again before the next.)
    for (const s of zh.course.stages) {
      const head = page.getByRole('button', { name: new RegExp(`^${s.id} · `) });
      const before = await head.getAttribute('aria-expanded');
      await head.click();
      toggles.push(`${s.id}:${before}→${await head.getAttribute('aria-expanded')}`);
      if (s.id !== 'A') await head.click();
    }
    check('every stage folds / unfolds and reports it (aria-expanded)', toggles.join(' ') === zh.course.stages.map((s) => `${s.id}:${s.id === 'A'}→${s.id !== 'A'}`).join(' '), toggles.join(' '));
    await page.getByRole('button', { name: new RegExp(`^${zh.course.stages[1].id} · `) }).click();
    const firstB = zh.course.stages[1].units[0].lessons[0];
    check('an unfolded Premium stage shows its lessons with a crown', (await page.getByRole('button', { name: new RegExp(`${title(zh, firstB)}.*${t('stage.premium')}`) }).count()) === 1);

    await page.getByRole('button', { name: t('settings.title') }).click();
    await page.getByText(t('settings.learning')).waitFor();
    await shot(page, '26-settings');
    // Restore on the web: purchases are not available here.
    await page.getByRole('button', { name: t('paywall.restore') }).click();
    check('settings: restore purchases answers on the web', await until(() => dialogs.includes(t('paywall.notReady'))), dialogs.join(' | '));
    // Legal pages open from the server.
    for (const [k, file] of [['settings.privacy', 'privacy-th'], ['settings.terms', 'terms-th']]) {
      const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }).catch(() => null), page.getByRole('button', { name: t(k) }).click()]);
      await popup?.waitForURL(/legal/).catch(() => {});
      const url = popup?.url() ?? '';
      const status = url ? (await fetch(url)).status : 0;
      check(`settings: ${t(k)} opens the ${file} page`, url.endsWith(`/legal/${file}.html`) && status === 200, `${url} ${status}`);
      await popup?.close();
    }
    // Invalid email is refused before anything is sent.
    await page.getByLabel(t('account.email')).fill('not-an-email');
    await page.getByRole('button', { name: t('account.sendCode') }).click();
    check('settings: an invalid email is refused with a message', await until(async () => (await page.getByText(t('account.error.invalidEmail')).count()) === 1));
    // Withdrawing the tutor consent.
    await page.getByRole('button', { name: t('settings.tutorConsent') }).click();
    check('settings: withdrawing the AI tutor consent confirms it', await until(() => dialogs.includes(t('settings.tutorWithdrawn'))));
    check('…and the consent is forgotten', (await state(page)).tutorConsent === undefined);
    // Placement test from settings starts the stage A quiz.
    await page.getByRole('button', { name: t('settings.placement') }).click();
    check('settings: the placement test starts at stage A', await until(async () => (await page.getByText(t('placement.quizTitle', { stage: 'A', n: 1, total: 16 })).count()) === 1));
    await page.goBack();
    // Change course from settings: back on settings with the new course, the old progress kept.
    await page.getByRole('button', { name: new RegExp(zh.gloss.name) }).click();
    await page.getByText(ko.gloss.name, { exact: true }).click();
    await page.getByText(t('placement.ask', { language: ko.gloss.name })).waitFor();
    await page.getByText(t('placement.new'), { exact: true }).click();
    check('settings: changing course comes back to settings with the new course', await until(async () => (await page.getByRole('button', { name: new RegExp(ko.gloss.name) }).count()) === 1), page.url());
    await page.goBack();
    await continueButton(page, ko, firstLesson(ko)).waitFor();
    check('the new course starts at its first lesson', true);
    await page.getByRole('button', { name: t('home.changeLanguage') }).click();
    await page.getByText(zh.gloss.name, { exact: true }).click();
    check('switching back keeps the first course\'s progress', await until(async () => (await continueButton(page, zh, zh.course.stages[0].units[0].lessons[1]).count()) === 1));

    // Paywall: plans are radios, one checked; picking the other moves the check; legal links open.
    await page.getByRole('button', { name: `👑 ${t('home.premium')}` }).click();
    const plans = page.getByRole('radio');
    await plans.first().waitFor();
    const checked = () => plans.evaluateAll((els) => els.map((e) => e.getAttribute('aria-checked')).join(','));
    const first = await checked();
    await plans.nth(1).click();
    check('paywall: plans are radios and picking one checks it', first === 'true,false' && (await checked()) === 'false,true', `${first} → ${await checked()}`);
    const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }).catch(() => null), page.getByRole('link', { name: t('settings.privacy') }).click()]);
    await popup?.waitForURL(/legal/).catch(() => {});
    check('paywall: the privacy link opens the policy', !!popup?.url().endsWith('/legal/privacy-th.html'), popup?.url());
    await popup?.close();
    await page.getByRole('button', { name: t('paywall.restore') }).click();
    check('paywall: restore answers on the web', await until(() => dialogs.filter((d) => d === t('paywall.notReady')).length >= 2));
    check('no console errors (settings and paywall)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }

  // ---------- 11. AI tutor chat (turns mocked: the e2e server has no Anthropic key) ----------
  {
    const ko = course('ko');
    const unitId = ko.course.stages[0].units[0].id;
    const { page, errors, context } = await newPage(seedFor('ko', [firstLesson(ko)]));
    let turns = 0;
    let limited = false;
    const units = new Set();
    await page.route(`${api.url}/v1/tutor/turn`, (route) => {
      units.add(route.request().postDataJSON()?.unitId);
      if (limited) return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ limit: 5 }) });
      turns++;
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          reply: `안녕하세요 ${turns}`,
          reading: `annyeonghaseyo ${turns}`,
          translation: `สวัสดี ${turns}`,
          feedback: turns > 1 ? 'เก่งมาก' : '',
          correction: '',
          hint: `ลองตอบว่า 안녕하세요`,
          done: turns === 3,
        }),
      });
    });
    await page.goto(web.url);
    await page.getByText(t('tutor.entry'), { exact: true }).click();
    await page.getByRole('button', { name: t('tutor.consent.later') }).click();
    check('tutor: "later" goes back to the map', await until(async () => (await page.getByText(t('tutor.entry'), { exact: true }).count()) === 1));
    await page.getByText(t('tutor.entry'), { exact: true }).click();
    check('tutor: asks for consent again after "later"', await until(async () => (await page.getByText(`🤖 ${t('tutor.consent.title')}`).count()) === 1));
    await page.getByRole('button', { name: t('tutor.consent.agree') }).click();
    await page.getByText('🔊 안녕하세요 1').waitFor();
    check('tutor: the opening line is read aloud', await until(async () => (await heard(page)).some((a) => a.kind === 'tts' && a.text === '안녕하세요 1')));
    await page.getByText(t('tutor.showTranslation')).click();
    check('tutor: the translation shows on request', (await page.getByText('สวัสดี 1', { exact: true }).count()) === 1);
    await page.getByRole('button', { name: t('tutor.hint') }).click();
    check('tutor: the hint shows on request', (await page.getByText('💡 ลองตอบว่า 안녕하세요').count()) === 1);
    const input = page.getByLabel(t('tutor.placeholder', { language: ko.gloss.name }));
    const send = page.getByRole('button', { name: t('tutor.send') });
    check('tutor: send is disabled while the box is empty', await send.isDisabled());
    await input.fill('안녕하세요');
    await send.click();
    await page.getByText('🔊 안녕하세요 2').waitFor();
    check('tutor: the learner line and the feedback on it are shown', (await page.getByText('안녕하세요', { exact: true }).count()) === 1 && (await page.getByText('💬 เก่งมาก').count()) === 1);
    await input.fill('감사합니다');
    await send.click();
    await page.getByText(`🎉 ${t('tutor.done')}`).waitFor();
    check('tutor: the role-play ends with a done card', true);
    await shot(page, '27-tutor-done');
    limited = true;
    await page.getByRole('button', { name: t('tutor.again') }).click();
    check('tutor: the daily limit is explained with a way to Premium', await until(async () => (await page.getByText(t('tutor.limit', { n: 5 })).count()) === 1) && (await page.getByRole('button', { name: `👑 ${t('home.premium')}` }).count()) === 1);
    await page.getByRole('button', { name: t('tutor.back') }).click();
    check('tutor: "back to the lesson" returns to the map', await until(async () => (await page.getByText(t('tutor.entry'), { exact: true }).count()) === 1));
    check('tutor: every turn is asked for the unit it was opened from', units.size === 1 && units.has(unitId), [...units].join(','));
    // The 429 of the mocked limit is logged by the browser on purpose.
    const real = realErrors(errors).filter((e) => !/status of 429/.test(e));
    check('no console errors (tutor chat)', real.length === 0, real.join(' | '));
    await context.close();
  }

  // ---------- 12. Unit map counts after placement and a review session's progress ----------
  {
    const en = course('en');
    const key = answerKey(en);
    const unit = unitsOf(en)[0];
    const words = unit.lessons.flatMap((id) => en.lessons[id].lesson.items).filter((i) => !i.kind || i.kind === 'word' || i.kind === 'phrase');
    const ids = [...new Set(words.map((i) => i.id))].slice(0, 4);
    const card = { due: '2026-10-01T00:00:00.000Z', stability: 3, difficulty: 5, elapsed_days: 3, scheduled_days: 3, learning_steps: 0, reps: 1, lapses: 0, state: 2, last_review: '2026-09-28T00:00:00.000Z' };
    const { page, errors, context } = await newPage(seedFor('en', unit.lessons, { cards: Object.fromEntries(ids.map((id) => [id, card])) }));
    await page.goto(web.url);
    await page.getByText(t('unit.progress', { done: unit.lessons.length, total: unit.lessons.length })).waitFor();
    check('a finished unit shows a full bar', Math.abs((await bars(page))[0] - 1) < 0.01);
    await page.getByRole('button', { name: t('home.review', { n: ids.length }) }).click();
    const seen = [];
    await play(page, key, 'right', { onStep: async () => seen.push((await bars(page))[0]) });
    check('review progress bar moves one card at a time and ends full', seen.length === ids.length && seen.every((v, i) => Math.abs(v - (i + 1) / ids.length) < 0.02), seen.map((v) => v.toFixed(2)).join(','));
    await footer(page).first().click();
    check('after review nothing is due', await until(async () => (await page.getByRole('button', { name: t('home.noReview') }).count()) === 1));
    check('no console errors (review progress)', realErrors(errors).length === 0, realErrors(errors).join(' | '));
    await context.close();
  }
}
