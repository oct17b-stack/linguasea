import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Converts any recording the apps send (iOS wav, Android m4a, web webm) to 16 kHz mono 16-bit WAV,
 * the format speech recognition expects. Goes through a temp file because m4a needs a seekable input.
 */
export async function toWav16k(audio: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'rec-'));
  const input = join(dir, 'in');
  const output = join(dir, 'out.wav');
  try {
    await writeFile(input, audio);
    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-ac', '1', '-ar', '16000', '-sample_fmt', 's16', '-t', '30', output]);
      let err = '';
      ff.stderr.on('data', (d) => (err += d));
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.trim()}`))));
    });
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
