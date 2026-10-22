import { loadContent } from '../load';
import { validate } from '../validate';
import { contentRoot } from './paths';

// While several people/agents edit content at once:
//   --target zh          only one course's problems
//   --only 'zh-C[1-8]-'  only problems whose file or message matches the pattern (e.g. your units)
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const only = arg('--target');
const pattern = arg('--only') ? new RegExp(arg('--only')!) : undefined;

const problems = validate(loadContent(contentRoot)).filter(
  (p) => (!only || p.file.split('/').includes(only)) && (!pattern || pattern.test(`${p.file}: ${p.message}`)),
);
for (const p of problems) console.error(`${p.file}: ${p.message}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(only || pattern ? `content OK (${[only, pattern].filter(Boolean).join(' ')})` : 'content OK');
