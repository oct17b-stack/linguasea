import type { Ui } from '@linguasea/contract';

/** Looks up an interface string and fills `{name}` placeholders. Missing keys show the key so they get noticed. */
export function translate(ui: Ui, key: string, params?: Record<string, string | number>): string {
  const text = ui[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}
