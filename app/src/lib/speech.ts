import * as Speech from 'expo-speech';

/**
 * Reads target-language text aloud with the device's TTS voice: the fallback when the content has
 * no generated clip for it, or the app runs without a server (see lib/audio.ts).
 */
export function say(text: string, voice: string, slow = false) {
  Speech.stop();
  Speech.speak(text, { language: voice, rate: slow ? 0.6 : 0.9 });
}

export function stopSpeech() {
  Speech.stop();
}
