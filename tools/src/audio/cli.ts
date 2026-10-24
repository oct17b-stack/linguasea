// npm run audio -- [--target zh] [--stage A] [--dry-run] [--prune]   (docs/AUDIO.md)
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isRegion, normalizeRegion, speechSettings, type AzureConfig } from './azure';
import { parseArgs, run, USAGE, UsageError, type Args } from './run';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const contentRoot = join(repoRoot, 'content');

let args: Args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (e) {
  if (!(e instanceof UsageError)) throw e;
  console.error(`${e.message}\n${USAGE}`);
  process.exit(2);
}
if (args.help) {
  console.log(USAGE);
  process.exit(0);
}

// The key never appears in output. server/.env holds the same key for pronunciation scoring.
const { key, region } = speechSettings(process.env, [join(repoRoot, 'server/.env'), join(repoRoot, '.env')]);
let azure: AzureConfig | undefined;
if (args.dryRun) {
  console.log('Dry run: nothing is synthesized, written or deleted.');
} else if (!key) {
  console.log('AZURE_SPEECH_KEY is not set (environment, server/.env or .env), so this is a dry run. See docs/AUDIO.md.');
} else {
  const name = region && normalizeRegion(region.value);
  if (!name || !isRegion(name)) {
    console.error(
      region
        ? `AZURE_SPEECH_REGION "${region.value}" is not a region name like southeastasia.`
        : 'AZURE_SPEECH_REGION is not set: use the region of the Speech resource, e.g. southeastasia.',
    );
    process.exit(1);
  }
  azure = { key: key.value, region: name };
  const from = key.source === 'environment' ? 'the environment' : relative(repoRoot, key.source);
  console.log(`Azure AI Speech, region ${name} (key from ${from}).`);
}

const report = await run({ contentRoot, targets: args.targets, stages: args.stages, azure, prune: args.prune });
process.exitCode = report.failures.length || report.aborted ? 1 : 0;
