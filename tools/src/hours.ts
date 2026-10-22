// Estimated study hours per course and stage (method: packages/core/src/hours.ts, docs/CONTENT.md §6).
//   npm run hours [-- --min 200]   exits 1 when a released course is below --min hours.
import { buildBundle, loadContent } from '@linguasea/contract/node';
import { estimateHours } from '@linguasea/core';
import { fileURLToPath } from 'node:url';

const contentRoot = fileURLToPath(new URL('../../content', import.meta.url));
const i = process.argv.indexOf('--min');
const min = i > 0 ? Number(process.argv[i + 1]) : undefined;

const bundle = buildBundle(loadContent(contentRoot), 'hours');
let short = false;
for (const [l1, layer] of Object.entries(bundle.l1s)) {
  for (const [target, course] of Object.entries(layer!.courses)) {
    const { stages, hours } = estimateHours(course!);
    console.log(`\n${target} (${l1}) — about ${hours} h`);
    console.log('stage  units  lessons  readers  practice  tests   hours');
    for (const s of stages) {
      console.log(
        `${s.stage.padEnd(5)}  ${String(s.units).padStart(5)}  ${String(s.lessons).padStart(7)}  ${String(s.readers).padStart(7)}  ${String(s.practice).padStart(8)}  ${String(s.tests).padStart(5)}  ${String(s.hours).padStart(6)}`,
      );
    }
    if (min !== undefined && hours < min) {
      short = true;
      console.log(`  below ${min} h`);
    }
  }
}
if (short) process.exit(1);
