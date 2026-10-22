import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Daily study reminder as a local notification (no push server involved). Web: reminders.web.ts. */
export const remindersSupported = true;

export type ReminderText = { title: string; body: string; channel: string };

const ID = 'daily-study-reminder';
const CHANNEL = 'study-reminders';

// Also show it when it fires while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function allowed(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Asks for permission unless the learner already answered; true when reminders can be shown. */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (allowed(current)) return true;
  if (!current.canAskAgain) return false;
  return allowed(await Notifications.requestPermissionsAsync());
}

/** Permission without asking (used when rescheduling in the background). */
export async function reminderPermitted(): Promise<boolean> {
  return allowed(await Notifications.getPermissionsAsync());
}

/** (Re)schedules the single daily reminder at hour:minute, device local time. */
export async function scheduleReminder(hour: number, minute: number, text: ReminderText): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: text.channel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancelReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: text.title, body: text.body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}
