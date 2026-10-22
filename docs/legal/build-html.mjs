// Builds the pages the API serves at /legal/ (server/public/legal/*.html) from the Markdown here.
// The Markdown is the source of truth: edit it, then run
//
//   node docs/legal/build-html.mjs           (needs pandoc: https://pandoc.org/installing.html)
//   node docs/legal/build-html.mjs --check   (only lists placeholders still to fill; exit 1 if any)
//
// Pages are self-contained: inline CSS, no scripts, no web fonts, light/dark from the system setting.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '../../server/public/legal');
const PAGE = /^(?:(privacy|terms|delete-account)-(th|en)|index)\.md$/;
const PLACEHOLDER = /\[(?:TBD|รอกรอก): [^\]]*\]/g;

const FOOTER = {
  th: [['privacy', 'นโยบายความเป็นส่วนตัว'], ['terms', 'ข้อกำหนดการใช้งาน'], ['delete-account', 'การลบข้อมูล'], ['index', 'เอกสารทั้งหมด']],
  en: [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service'], ['delete-account', 'Delete your data'], ['index', 'All documents']],
};

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sources = readdirSync(here).filter((f) => PAGE.test(f)).sort();

const left = [];
for (const file of sources) {
  for (const m of readFileSync(join(here, file), 'utf8').match(PLACEHOLDER) ?? []) left.push(`${file}: ${m}`);
}
if (process.argv.includes('--check')) {
  console.log(left.length ? `${left.length} placeholder(s) left:\n${left.join('\n')}` : 'No placeholders left.');
  process.exit(left.length ? 1 : 0);
}

for (const file of sources) {
  const [, doc, lang = 'th'] = PAGE.exec(file);
  const name = file.replace(/\.md$/, '');
  const md = readFileSync(join(here, file), 'utf8');
  const title = /^# (.+)$/m.exec(md)?.[1] ?? 'LinguaSEA';

  let body = execFileSync('pandoc', ['--from=gfm', '--to=html5', '--wrap=none'], { input: md, encoding: 'utf8' });
  body = body
    .replace(/href="([\w-]+)\.md(#[^"]*)?"/g, (_, page, hash = '') => `href="${page}.html${hash}"`)
    .replace(PLACEHOLDER, (m) => `<mark class="tbd">${m}</mark>`);

  // The "read in the other language" line under the title moves into the top bar.
  let switcher = '';
  body = body.replace(/(<\/h1>\s*)<p>(<a href="[\w-]+\.html">[^<]+<\/a>)<\/p>\s*/, (_, h1, link) => {
    switcher = link.replace('<a ', `<a hreflang="${lang === 'th' ? 'en' : 'th'}" `);
    return h1;
  });

  const other = doc ? `${doc}-${lang === 'th' ? 'en' : 'th'}` : undefined;
  const alternate = other ? `\n<link rel="alternate" hreflang="${lang === 'th' ? 'en' : 'th'}" href="${other}.html">` : '';
  // The index page is itself the list of documents, so only the others get a footer.
  const footer = doc
    ? `\n<footer>${FOOTER[lang]
        .map(([page, label]) => {
          const target = page === 'index' ? 'index' : `${page}-${lang}`;
          return target === name ? `<span>${label}</span>` : `<a href="${target}.html">${label}</a>`;
        })
        .join(' · ')}</footer>`
    : '';

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(title)}</title>${alternate}
<style>
:root{--bg:#fff;--text:#1c2230;--muted:#5d6676;--line:#e2e6ec;--link:#0a5fc2;--box:#f2f6fb;--mark:#ffe9a8;--mark-text:#4d3a00}
@media (prefers-color-scheme:dark){:root{--bg:#111418;--text:#e6e9ef;--muted:#a2abb9;--line:#2b313b;--link:#86b9ff;--box:#1a2029;--mark:#5a4700;--mark-text:#ffe9a8}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans Thai","Noto Sans","Leelawadee UI",Tahoma,sans-serif}
main{max-width:46rem;margin:0 auto;padding:16px 16px 48px}
.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:12px;margin-bottom:8px;border-bottom:1px solid var(--line);font-size:15px;color:var(--muted)}
.bar strong{color:var(--text)}
h1{font-size:1.7rem;line-height:1.3;margin:20px 0 12px}
h2{font-size:1.25rem;line-height:1.4;margin:2em 0 .5em;padding-top:.5em;border-top:1px solid var(--line)}
h3{font-size:1.05rem;line-height:1.5;margin:1.5em 0 .4em}
p,ul,ol{margin:.6em 0}
ul,ol{padding-left:1.4em}
li{margin:.3em 0}
a{color:var(--link);overflow-wrap:anywhere}
blockquote{margin:1em 0;padding:4px 16px;background:var(--box);border-left:4px solid var(--link);border-radius:8px}
mark.tbd{background:var(--mark);color:var(--mark-text);padding:0 .25em;border-radius:4px}
footer{margin-top:40px;padding-top:12px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
</style>
</head>
<body>
<main>
<div class="bar"><strong>LinguaSEA</strong>${switcher}</div>
${body.trim()}${footer}
</main>
</body>
</html>
`;
  writeFileSync(join(outDir, `${name}.html`), html);
  console.log(`server/public/legal/${name}.html`);
}
if (left.length) console.log(`\n${left.length} placeholder(s) still to fill (node docs/legal/build-html.mjs --check lists them).`);
