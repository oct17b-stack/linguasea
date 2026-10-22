import { Alert, Platform } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirm: string;
  cancel: string;
  destructive?: boolean;
};

/** A short notice in a system alert. (Web: dialog.web.ts — React Native Web has no Alert.) */
export function notify(message: string) {
  // Android shows a title-only dialog in a large font that cuts long text; there it goes in the body.
  if (Platform.OS === 'android') Alert.alert('', message);
  else Alert.alert(message);
}

/** Asks before doing something; resolves true when the learner confirms. */
export function confirm({ title, message, confirm: ok, cancel, destructive }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: ok, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
