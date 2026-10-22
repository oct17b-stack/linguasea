import * as Speech from 'expo-speech';

/**
 * Reads target-language text aloud with the device's TTS voice.
 * Prototype only: production plays recorded / licensed TTS files listed in the content (item.audio).
 */
export function say(text: string, voice: string, slow = false) {
  Speech.stop();
  Speech.speak(text, { language: voice, rate: slow ? 0.6 : 0.9 });
}
