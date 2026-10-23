import AsyncStorage from '@react-native-async-storage/async-storage';

/** Browsers keep the state in local storage (the web build is for testing and demos). */
const KEY = 'linguasea/state/v1';

export const loadState = (): Promise<string | null> => AsyncStorage.getItem(KEY);
export const saveState = (raw: string): Promise<void> => AsyncStorage.setItem(KEY, raw);
export const clearState = (): Promise<void> => AsyncStorage.removeItem(KEY);
