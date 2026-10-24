// End-to-end harness: the real API server (in-memory store), the web build of the app pointed at it,
// and a headless Chromium. Used by run.mjs; no test framework needed.
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

export const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Thai interface strings, so tests find buttons by the same text users see. */
export const ui = JSON.parse(readFileSync(join(root, 'content/l1/th/ui.json'), 'utf8'));
export const t = (key, params = {}) => {
  if (!(key in ui)) throw new Error(`ui.json has no key ${key}`);
  return ui[key].replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
};

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(url, ms = 30_000) {
  const until = Date.now() + ms;
  for (;;) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > until) throw new Error(`${url} did not come up`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

/**
 * Starts the API server (on `port`, or a free one). Returns { url, stop, mark, loginCode }:
 * without a mail service the server prints `[mail] login code for <email>: <code>` to stdout;
 * `loginCode(email, mark())` waits for the first such code printed after the mark.
 */
export async function startApi(env = {}, port) {
  port ??= await freePort();
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/src/main.ts'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: '',
      ANTHROPIC_API_KEY: '',
      AZURE_SPEECH_KEY: '',
      RESEND_API_KEY: '',
      NODE_ENV: 'development',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d));
  const lines = [];
  let partial = '';
  child.stdout.on('data', (d) => {
    const parts = (partial + d).split('\n');
    partial = parts.pop();
    lines.push(...parts);
  });
  const mark = () => lines.length;
  async function loginCode(email, from = 0, ms = 10_000) {
    const re = /\[mail\] login code for (\S+): (\d{6})/;
    const until = Date.now() + ms;
    for (;;) {
      for (let i = from; i < lines.length; i++) {
        const m = re.exec(lines[i]);
        if (m && m[1].toLowerCase() === email.toLowerCase()) return m[2];
      }
      if (Date.now() > until) return undefined;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitFor(`${url}/health`);
  } catch (e) {
    child.kill();
    throw new Error(`${e.message}\n${stderr}`);
  }
  return { url, stop: () => child.kill(), mark, loginCode };
}

/** Exports the web app (with the API URL baked in, or offline when apiUrl is empty) into outDir. */
export function buildWeb(outDir, apiUrl = '') {
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', outDir], {
    cwd: join(root, 'app'),
    env: { ...process.env, EXPO_OFFLINE: '1', CI: '1', EXPO_PUBLIC_API_URL: apiUrl },
    stdio: 'pipe',
  });
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg' };

/**
 * Serves a static export under `base` (app.json experiments.baseUrl) with single-page-app fallback,
 * like the API server does in production. Returns { url, origin, stop }; `url` is the app's start page.
 */
export async function serveStatic(dir, base = '/app') {
  const port = await freePort();
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname !== base && !pathname.startsWith(`${base}/`)) {
      res.writeHead(302, { location: `${base}/` });
      res.end();
      return;
    }
    const path = normalize(pathname.slice(base.length) || '/').replace(/^(\.\.[/\\])+/, '');
    let file = join(dir, path);
    try {
      if (!(await stat(file)).isFile()) throw new Error('dir');
    } catch {
      file = join(dir, 'index.html');
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${port}`;
  return { url: `${origin}${base}/`, origin, stop: () => server.close() };
}

/** A phone-sized page that records console errors and failed requests. */
export async function openPage(browser, { colorScheme = 'light' } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, locale: 'th-TH' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  return { context, page, errors };
}

export const launch = () => chromium.launch();
