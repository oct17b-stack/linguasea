import type { RecordingFile } from '@/lib/api';

/** In the browser the recorder hands back a blob: URL (webm in Chrome / Firefox, mp4 in Safari). */
export async function recordingFile(uri: string): Promise<RecordingFile> {
  const blob = await (await fetch(uri)).blob();
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  return { blob, name: `speech.${ext}` };
}

export function discardRecording(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}
