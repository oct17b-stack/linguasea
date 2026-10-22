import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

/** Opens a web page (privacy policy, terms) in the in-app browser, or the system browser as a fallback. */
export async function openPage(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url).catch(() => {});
  }
}
