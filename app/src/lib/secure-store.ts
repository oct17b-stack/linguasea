import * as SecureStore from 'expo-secure-store';

/** Small secrets (the account token) in the iOS Keychain / Android Keystore. Web: secure-store.web.ts. */
export const secureStore = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
