import { loadContent } from '../load';
import { validate } from '../validate';
import { contentRoot } from './paths';

// `--target zh` shows only one course's problems (handy while several people/agents edit content).
const i = process.argv.indexOf('--target');
const only = i > 0 ? process.argv[i + 1] : undefined;

const problems = validate(loadContent(contentRoot)).filter((p) => !only || p.file.split('/').includes(only));
for (const p of problems) console.error(`${p.file}: ${p.message}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(only ? `content OK (${only})` : 'content OK');
