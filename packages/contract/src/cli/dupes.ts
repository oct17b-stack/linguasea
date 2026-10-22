// Words taught under more than one id (in content and in content/_plan): npm run dupes [-- --target zh]
import { findDuplicates } from '../dupes';
import { loadContent } from '../load';
import { contentRoot } from './paths';

const i = process.argv.indexOf('--target');
const only = i > 0 ? process.argv[i + 1] : undefined;
const dupes = findDuplicates(loadContent(contentRoot), contentRoot).filter((d) => !only || d.target === only);
for (const d of dupes) console.log(`${d.target} "${d.text}" (${d.reading}): ${d.ids.map((x) => `${x.id} [${x.where}]`).join(', ')}`);
console.log(dupes.length ? `\n${dupes.length} word(s) with more than one id` : 'no duplicate words');
process.exit(dupes.length ? 1 : 0);
