import type { ConfirmOptions } from './dialog';

export type { ConfirmOptions };

// React Native Web's Alert.alert does nothing, so the browser's own dialogs are used.

export function notify(message: string) {
  window.alert(message);
}

export function confirm({ title, message }: ConfirmOptions): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}
