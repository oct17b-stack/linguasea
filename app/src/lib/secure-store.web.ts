import AsyncStorage from '@react-native-async-storage/async-storage';

/** Browsers have no keychain; the web build keeps the token in local storage like the rest of its state. */
export const secureStore = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
