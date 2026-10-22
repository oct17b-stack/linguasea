import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';

/** Longest take; recording stops by itself after this. */
export const MAX_RECORDING_SECONDS = 8;

/**
 * 16 kHz mono, what pronunciation scoring works on: linear PCM .wav on iOS, AAC .m4a on Android,
 * the browser's default (webm) on web. The server converts whatever arrives to 16 kHz WAV.
 */
export const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 16000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};
