import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';

// The learner's state lives in a file. On Android, AsyncStorage cannot read back a value over about
// 2 MB (SQLite cursor window), and someone far into several courses has more review cards than that.
const NAME = 'linguasea-state-v1.json';
// Where builds before the file kept it.
const OLD_KEY = 'linguasea/state/v1';

const file = () => new File(Paths.document, NAME);
// Written first and then moved over the real file, so a crash mid-write never leaves half a file.
const temp = () => new File(Paths.document, `${NAME}.tmp`);

export async function loadState(): Promise<string | null> {
  const f = file();
  if (f.exists) return f.text();
  // A crash between removing the old file and moving the new one into place leaves only the temp.
  const t = temp();
  if (t.exists) return t.text();
  return AsyncStorage.getItem(OLD_KEY);
}

export async function saveState(raw: string): Promise<void> {
  const t = temp();
  await t.write(raw);
  await t.move(file(), { overwrite: true });
}

export async function clearState(): Promise<void> {
  for (const f of [file(), temp()]) if (f.exists) f.delete();
  await AsyncStorage.removeItem(OLD_KEY);
}
