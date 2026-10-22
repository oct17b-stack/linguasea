import { requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { setRecordingMode, stopAudio } from '@/lib/audio';
import { RECORDING_OPTIONS } from '@/lib/recording';
import { discardRecording } from '@/lib/recording-file';

export type StartResult = 'recording' | 'denied' | 'failed';

function haptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Tap to start / tap to stop recording, at most `maxSeconds` long (16 kHz mono, see lib/recording).
 * `onRecorded` receives the file after a manual or automatic stop (null when nothing could be saved);
 * the caller uploads and then discards it. Leaving the screen mid-take stops and drops the recording.
 */
export function useRecorder(maxSeconds: number, onRecorded: (uri: string | null) => void) {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const alive = useRef(true);
  const active = useRef(false);
  /** The audio session is in record mode (iOS); switched back as soon as it is not needed. */
  const micMode = useRef(false);
  const timers = useRef<{ stop?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({});
  const callback = useRef(onRecorded);

  useEffect(() => {
    callback.current = onRecorded;
  });

  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      clearTimeout(pending.stop);
      clearInterval(pending.tick);
      if (active.current) {
        active.current = false;
        // Leaving mid-take: stop so the browser / OS releases the microphone.
        try {
          recorder.stop().catch(() => {});
        } catch {}
      }
      if (micMode.current) {
        micMode.current = false;
        void setRecordingMode(false);
      }
    };
  }, [recorder]);

  const leaveMicMode = () => {
    if (!micMode.current) return;
    micMode.current = false;
    void setRecordingMode(false);
  };

  const stop = async () => {
    if (!active.current) return;
    active.current = false;
    clearTimeout(timers.current.stop);
    clearInterval(timers.current.tick);
    haptic();
    setRecording(false);
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch {}
    leaveMicMode();
    if (alive.current) callback.current(uri);
    else if (uri) discardRecording(uri);
  };

  const start = async (): Promise<StartResult> => {
    if (active.current) return 'recording';
    stopAudio();
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!alive.current) return 'failed';
      if (!permission.granted) return 'denied';
      micMode.current = true;
      await setRecordingMode(true);
      await recorder.prepareToRecordAsync();
      if (!alive.current) return 'failed';
      recorder.record();
    } catch {
      leaveMicMode();
      return 'failed';
    }
    active.current = true;
    haptic();
    const startedAt = Date.now();
    setElapsed(0);
    setRecording(true);
    timers.current.tick = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    timers.current.stop = setTimeout(() => void stop(), maxSeconds * 1000);
    return 'recording';
  };

  return { recording, elapsed, start, stop };
}
