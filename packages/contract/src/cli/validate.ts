import { loadContent } from '../load';
import { validate } from '../validate';
import { contentRoot } from './paths';

const problems = validate(loadContent(contentRoot));
for (const p of problems) console.error(`${p.file}: ${p.message}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log('content OK');
