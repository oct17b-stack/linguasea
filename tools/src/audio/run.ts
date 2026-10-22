import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { Target, TARGETS } from '@linguasea/contract';
import { loadContent, validate } from '@linguasea/contract/node';

import { billableChars, synthesize, SynthesisError, Throttle, type AzureConfig, type SynthesizeOptions } from './azure';
import { collectClips, type Clip } from './clips';
import { OUTPUT_FORMAT } from './voices';

/** Azure neural TTS price used for the estimate: about US$16 per million characters. */
export const USD_PER_MILLION_CHARS = 16;

/** Files this tool writes, so the only ones --prune may delete: "<16 hex>.mp3" and leftovers of interrupted writes. */
const GENERATED = /^[0-9a-f]{16}\.mp3(\.\d+\.tmp)?$/;

/** Stop after this many failed clips; finished clips are kept and the next run picks up the rest. */
const MAX_FAILED = 10;

export const USAGE = 'usage: npm run audio -- [--target zh|en|ja|ko] [--dry-run] [--prune]';

export class UsageError extends Error {}

export type Args = { targets?: Target[]; dryRun: boolean; prune: boolean; help: boolean };

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = { dryRun: false, prune: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--prune') args.prune = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--target' || a.startsWith('--target=')) {
      const value = a === '--target' ? argv[++i] : a.slice('--target='.length);
      const target = Target.safeParse(value);
      if (!target.success) throw new UsageError(`--target must be one of ${TARGETS.join(', ')}`);
      (args.targets ??= []).push(target.data);
    } else throw new UsageError(`unknown option ${a}`);
  }
  return args;
}

export type RunOptions = {
  contentRoot: string;
  /** Default <contentRoot>/audio, which the server serves at /audio/. */
  audioRoot?: string;
  targets?: readonly Target[];
  /** Without it this is a dry run: nothing is synthesized, written or deleted. */
  azure?: AzureConfig;
  prune?: boolean;
  concurrency?: number;
  log?: (line: string) => void;
} & Pick<SynthesizeOptions, 'fetch' | 'sleep' | 'retries'>;

export type CourseReport = {
  target: Target;
  /** Distinct clips the course needs, generated or recorded. */
  clips: number;
  /** Clips served by a recording (Item.audio) instead of generated speech. */
  recorded: number;
  /** Generated clips whose file was already there. */
  present: number;
  /** Generated clips still to synthesize when the run started, their text length and billable characters. */
  missing: number;
  chars: number;
  billable: number;
  written: number;
  /** Generated files nothing uses any more (deleted with --prune outside a dry run). */
  unused: string[];
  /** Entries in manifest.json after the run; undefined in a dry run. */
  manifest?: number;
};

export type RunReport = {
  dryRun: boolean;
  courses: CourseReport[];
  warnings: string[];
  failures: string[];
  /** Why synthesis stopped early. */
  aborted?: string;
  /** Why --prune deleted nothing. */
  pruneSkipped?: string;
  /** Content problems (npm run validate) in the courses this run covers. */
  problems: number;
};

const isFile = (file: string) => existsSync(file) && statSync(file).isFile();

/** Write-then-rename, so an interrupted run never leaves a half-written file that later runs would skip. */
async function writeAtomic(file: string, data: Uint8Array | string) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}

const sum = (clips: Clip[], f: (c: Clip) => number) => clips.reduce((n, c) => n + f(c), 0);
const num = (n: number) => n.toLocaleString('en-US');
const usd = (chars: number) => {
  const cost = (chars / 1_000_000) * USD_PER_MILLION_CHARS;
  return cost > 0 && cost < 0.01 ? '< US$0.01' : `US$${cost.toFixed(2)}`;
};

/**
 * Generates every missing clip, writes content/audio/<target>/manifest.json and with `prune` deletes
 * generated files nothing uses. Without `azure` it only reports what is missing and what it would cost.
 */
export async function run(opts: RunOptions): Promise<RunReport> {
  const audioRoot = opts.audioRoot ?? join(opts.contentRoot, 'audio');
  const log = opts.log ?? ((line: string) => console.log(line));
  const dryRun = !opts.azure;
  const wanted = opts.targets ?? TARGETS;

  const loaded = loadContent(opts.contentRoot);
  const targets = wanted.filter((t) => loaded.targets.has(t));
  // Only the course files decide which clips exist (explanations and manifests do not).
  const problems = validate(loaded).filter((p) => wanted.some((t) => p.file.startsWith(`courses/${t}/`))).length;
  const { clips, recordings, warnings } = collectClips(loaded, targets);
  for (const t of wanted) if (!loaded.targets.has(t)) warnings.push(`courses/${t}: no course loaded, skipped`);

  // A recording that exists replaces generated speech for its key; until it exists, TTS stays.
  const plans = targets.map((target) => {
    const recorded = new Map<string, string>();
    for (const r of recordings) {
      if (r.target !== target) continue;
      if (isFile(join(audioRoot, r.file))) recorded.set(r.key, r.file);
      else warnings.push(`${r.where}: recording ${r.file} is not in content/audio yet; using generated speech`);
    }
    const tts = clips.filter((c) => c.target === target && !recorded.has(c.key));
    const missing = tts.filter((c) => !isFile(join(audioRoot, c.file)));
    return { target, tts, recorded, missing };
  });

  for (const w of warnings) log(`warning: ${w}`);
  if (problems) log(`warning: ${problems} content problem(s) in these courses (npm run validate); clips follow what loads`);

  // ---- synthesize ----
  const missing = plans.flatMap((p) => p.missing);
  const written = new Set<Clip>();
  const failures: string[] = [];
  let aborted: string | undefined;
  if (opts.azure && missing.length) {
    const azure = opts.azure;
    const throttle = new Throttle();
    const workers = Math.max(1, Math.min(opts.concurrency ?? 4, missing.length));
    let next = 0;
    let done = 0;
    log(`Synthesizing ${num(missing.length)} clip(s) with Azure (${OUTPUT_FORMAT}), ${workers} at a time…`);
    const worker = async () => {
      while (!aborted && next < missing.length) {
        const clip = missing[next++];
        try {
          const data = await synthesize(azure, clip.azure, clip.text, {
            fetch: opts.fetch,
            sleep: opts.sleep,
            retries: opts.retries,
            throttle,
            onRetry: (problem, ms) => log(`  ${clip.file}: ${problem}; retrying in ${Math.ceil(ms / 1000)} s`),
          });
          await writeAtomic(join(audioRoot, clip.file), data);
          written.add(clip);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          failures.push(`${clip.where} ${JSON.stringify(clip.text)} (${clip.voice}): ${message}`);
          if (!(e instanceof SynthesisError) || e.fatal) aborted ??= message;
          else if (failures.length >= MAX_FAILED) aborted ??= `${failures.length} clips failed`;
        }
        done++;
        if (done % 25 === 0 || done === missing.length) log(`  ${done}/${missing.length}`);
      }
    };
    await Promise.all(Array.from({ length: workers }, worker));
  }

  // ---- manifests and pruning ----
  const pruneSkipped =
    opts.prune && problems
      ? `content has ${problems} problem(s) (npm run validate); pruning now could delete clips of lessons that did not load`
      : undefined;
  const courses: CourseReport[] = [];
  for (const p of plans) {
    let manifest: number | undefined;
    if (!dryRun) {
      const entries: [string, string][] = [...p.recorded];
      for (const c of p.tts) if (isFile(join(audioRoot, c.file))) entries.push([c.key, c.file]);
      entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      const file = join(audioRoot, p.target, 'manifest.json');
      const json = JSON.stringify(Object.fromEntries(entries), null, 2) + '\n';
      const old = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
      if (json !== old && (entries.length || old !== undefined)) await writeAtomic(file, json);
      manifest = entries.length;
    }

    const keep = new Set([...p.tts.map((c) => c.file), ...p.recorded.values()]);
    const dir = join(audioRoot, p.target);
    const unused = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => GENERATED.test(f) && !keep.has(`${p.target}/${f}`))
          .sort()
      : [];
    if (opts.prune && !dryRun && !pruneSkipped) for (const f of unused) rmSync(join(dir, f), { force: true });

    courses.push({
      target: p.target,
      clips: p.tts.length + p.recorded.size,
      recorded: p.recorded.size,
      present: p.tts.length - p.missing.length,
      missing: p.missing.length,
      chars: sum(p.missing, (c) => [...c.text].length),
      billable: sum(p.missing, (c) => billableChars(c.azure, c.text)),
      written: p.missing.filter((c) => written.has(c)).length,
      unused,
      manifest,
    });
  }

  const report: RunReport = { dryRun, courses, warnings, failures, aborted, pruneSkipped, problems };
  printReport(report, opts.prune ?? false, log);
  return report;
}

function printReport(r: RunReport, prune: boolean, log: (line: string) => void) {
  const total = (f: (c: CourseReport) => number) => r.courses.reduce((n, c) => n + f(c), 0);
  const row = (cells: (string | number)[]) =>
    cells.map((c, i) => (i ? String(typeof c === 'number' ? num(c) : c).padStart(11) : String(c).padEnd(6))).join('');
  log('');
  log(row(['', 'clips', 'recorded', 'present', 'missing', 'characters', 'unused']));
  for (const c of r.courses) log(row([c.target, c.clips, c.recorded, c.present, c.missing, c.chars, c.unused.length]));
  if (r.courses.length > 1) {
    log(row(['total', total((c) => c.clips), total((c) => c.recorded), total((c) => c.present), total((c) => c.missing), total((c) => c.chars), total((c) => c.unused.length)]));
  }
  log('');

  const missing = total((c) => c.missing);
  const billable = total((c) => c.billable);
  if (missing) {
    log(
      `${r.dryRun ? 'Missing' : 'Was missing'}: ${num(missing)} clip(s), ${num(total((c) => c.chars))} characters of text, ` +
        `about ${num(billable)} billable (Azure counts each Han character twice and bills the <prosody> tag).`,
    );
    log(`Estimated cost: ${usd(billable)} at about US$${USD_PER_MILLION_CHARS} per 1M characters (estimate only; check current Azure pricing).`);
  } else {
    log('Nothing missing: every clip has a file.');
  }

  if (!r.dryRun) {
    log(`Wrote ${num(total((c) => c.written))} clip(s)${r.failures.length ? `, ${r.failures.length} failed` : ''}.`);
    for (const f of r.failures.slice(0, MAX_FAILED)) log(`  failed: ${f}`);
    if (r.aborted) log(`Stopped early: ${r.aborted}. Finished clips are kept; run again to continue.`);
    log(`Manifests: ${r.courses.map((c) => `${c.target} ${num(c.manifest ?? 0)}`).join(', ')} entries (content/audio/<course>/manifest.json); run npm run content to bundle them.`);
  }

  const unused = total((c) => c.unused.length);
  if (r.pruneSkipped) log(`--prune skipped: ${r.pruneSkipped}.`);
  else if (unused && prune) log(r.dryRun ? `--prune would delete ${num(unused)} unused file(s).` : `Deleted ${num(unused)} unused file(s).`);
  else if (unused) log(`${num(unused)} generated file(s) are no longer used; npm run audio -- --prune deletes them.`);
}
