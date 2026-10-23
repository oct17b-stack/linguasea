// Words taught under more than one id (in content and in content/_plan): npm run dupes [-- --target zh]
//   --meanings also lists vocabulary items that share the exact same explanation.
import { findDuplicates, findRetaught, findSameMeaning } from '../dupes';
import { loadContent } from '../load';
import { contentRoot } from './paths';

const i = process.argv.indexOf('--target');
const only = i > 0 ? process.argv[i + 1] : undefined;
const dupes = findDuplicates(loadContent(contentRoot), contentRoot).filter((d) => !only || d.target === only);
for (const d of dupes) console.log(`${d.target} "${d.text}" (${d.reading}): ${d.ids.map((x) => `${x.id} [${x.where}]`).join(', ')}`);
console.log(dupes.length ? `\n${dupes.length} word(s) with more than one id` : 'no duplicate words');

// Same id listed as a new item in several lessons: fine for a deliberate reuse (e.g. a minimal-pair
// drill word taught again as vocabulary), otherwise the later lesson should teach something new.
const again = findRetaught(loadContent(contentRoot), contentRoot).filter((r) => !only || r.target === only);
for (const r of again) console.log(`taught again: ${r.target} ${r.id} in ${r.where.join(', ')}`);
if (again.length) console.log(`${again.length} item(s) taught in more than one lesson (check they are deliberate)`);

if (process.argv.includes('--meanings')) {
  const same = findSameMeaning(loadContent(contentRoot)).filter((m) => !only || m.target === only);
  for (const m of same) console.log(`same meaning: ${m.target} (${m.l1}) "${m.meaning}": ${m.ids.map((x) => `${x.id} [${x.where}]`).join(', ')}`);
  console.log(same.length ? `${same.length} meaning(s) shared by several items` : 'no shared meanings');
}
process.exit(dupes.length ? 1 : 0);
