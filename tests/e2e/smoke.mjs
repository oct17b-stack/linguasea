// Checks a deployed server from the outside, the way a learner meets it (docs/DEPLOY-QNAP.md):
//   npm run content && npm run smoke -- http://192.168.1.20:8090
// Health, website, legal page and audio; then the web app at /app/ in a browser: choose a course,
// play the first lesson, and see the progress reach the server's database.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { answerKey, footer, play } from './answers.mjs';
import { launch, openPage, root, t } from './harness.mjs';

const base = process.argv[2]?.replace(/\/+$/, '');
if (!base) {
  console.error('usage: npm run smoke -- <server url, e.g. http://192.168.1.20:8090>');
  process.exit(2);
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra && !ok ? ` — ${extra}` : ''}`);
};
const get = async (path) => {
  try {
    return await fetch(`${base}${path}`);
  } catch (e) {
    return { ok: false, status: String(e.cause?.code ?? e.message), json: async () => null, text: async () => '' };
  }
};

const health = await get('/health');
check('server answers /health', health.ok && (await health.json())?.ok === true, `status ${health.status}`);
check('website home page', (await get('/')).ok);
check('Thai privacy policy', (await get('/legal/privacy-th.html')).ok);
const manifest = await get('/audio/zh/manifest.json');
const clips = manifest.ok ? await manifest.json() : {};
const firstClip = Object.values(clips)[0];
check('audio manifest and a clip', !!firstClip && (await get(`/audio/${firstClip}`)).ok, `manifest ${manifest.status}`);

const generated = join(root, 'app/src/content/generated');
const zh = JSON.parse(readFileSync(join(generated, 'th-zh.json'), 'utf8'));
const browser = await launch();
try {
  const { page, context } = await openPage(browser);
  const calls = [];
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith('/v1/')) calls.push(`${r.request().method()} ${url.origin}${url.pathname} ${r.status()}`);
  });
  await page.goto(`${base}/app/`);
  await page.getByText(t('languages.title')).waitFor({ timeout: 30_000 });
  check('web app opens', true);

  await page.getByText(zh.gloss.name, { exact: true }).click();
  await page.getByText(t('placement.new'), { exact: true }).click();
  const first = zh.course.stages[0].units[0].lessons[0];
  await page.getByRole('button', { name: `▶ ${t('home.continue', { title: zh.lessons[first].gloss.title })}` }).click();
  await play(page, answerKey(zh), 'right');
  check('first lesson plays to the end', (await page.getByText(`🎉 ${t('done.title')}`).count()) === 1);
  await footer(page).first().click();

  const synced = async () => calls.some((c) => c.startsWith(`PUT ${base}/v1/progress 200`));
  for (let i = 0; i < 60 && !(await synced()); i++) await page.waitForTimeout(500);
  check('progress is synced to this server', await synced(), calls.join(', ') || 'no API calls');
  check('the web app calls only this server', calls.length > 0 && calls.every((c) => c.split(' ')[1].startsWith(`${base}/v1/`)), calls.join(', '));

  const account = JSON.parse((await page.evaluate(() => localStorage.getItem('linguasea.account'))) ?? 'null');
  const saved = account && (await (await fetch(`${base}/v1/progress`, { headers: { authorization: `Bearer ${account.token}` } })).json());
  check('the server stored the finished lesson', !!saved?.completed?.[first]);
  await context.close();
} catch (e) {
  check('web app flow', false, e.message.split('\n')[0]);
} finally {
  await browser.close();
}

const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} of ${results.length} checks failed` : `${results.length}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
