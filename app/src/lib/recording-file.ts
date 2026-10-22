import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type { RecordingFile } from '@/lib/api';

/** The finished recording as an upload part (React Native sends it straight from disk). */
export async function recordingFile(uri: string): Promise<RecordingFile> {
  return Platform.OS === 'ios'
    ? { uri, name: 'speech.wav', type: 'audio/wav' }
    : { uri, name: 'speech.m4a', type: 'audio/mp4' };
}

/** Recordings are not kept on the device once they have been scored. */
export function discardRecording(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {}
}
